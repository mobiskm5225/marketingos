/**
 * Pipeline runner — executes an agent's skill pipeline.
 *
 * The runner:
 *  1. Loads the agent, its stages, references, knowledge bases, and skills.
 *  2. Computes execution levels from the DAG.
 *  3. Executes each level concurrently (stages in one level run in parallel).
 *  4. Records run_stages, run_events, and updates the run row as it goes.
 *  5. Emits SSE events so the frontend can stream progress.
 *
 * Concurrency is limited by a semaphore to prevent overwhelming local models.
 */

import { eq, asc, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  agents,
  agentStages,
  agentReferences,
  agentInputs,
  agentKnowledgeBases,
  skills,
  modelProviders,
  runs,
  runStages,
  runEvents,
  activities,
  coreMemory,
} from '../db/schema';
import { toLevels, type DagNode } from './dag';
import { buildSystemPrompt, buildUserPrompt, buildGateUserPrompt, type StageOutput } from './prompt';
import { callModel, type CompletionResult } from '../ai/provider';
import { retrieve, activeFacts } from '../knowledge/retrieve';
import { emitRunEvent, cleanupRun } from './emitter';
import { formatDuration } from '../../lib/format';
import log from '../../logger';

// ─── Concurrency limiter ──────────────────────────────────────────────────────

const MAX_CONCURRENT_RUNS = 2;
let activeRuns = 0;
const queue: (() => void)[] = [];

function acquireSlot(): Promise<void> {
  if (activeRuns < MAX_CONCURRENT_RUNS) {
    activeRuns++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => queue.push(resolve));
}

function releaseSlot(): void {
  activeRuns--;
  const next = queue.shift();
  if (next) {
    activeRuns++;
    next();
  }
}

// ─── Slug generation ──────────────────────────────────────────────────────────

function generateRunSlug(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `run-${num}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CreateRunOptions {
  agentSlug: string;
  title?: string;
  input?: Record<string, unknown>;
  parentRunId?: string;
}

export interface CreatedRun {
  id: string;
  slug: string;
}

/**
 * Creates a run row and starts execution asynchronously.
 * Returns immediately so the HTTP handler can respond with the run slug.
 */
export async function createAndExecuteRun(opts: CreateRunOptions): Promise<CreatedRun> {
  // Load the agent
  const [agent] = await db.select().from(agents).where(eq(agents.slug, opts.agentSlug));
  if (!agent) throw new Error(`Agent "${opts.agentSlug}" not found.`);

  // Verify the agent has stages
  const stageCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentStages)
    .where(eq(agentStages.agentId, agent.id));
  if (Number(stageCount[0]?.count) === 0) {
    throw new Error(`Agent "${agent.name}" has no pipeline stages. Add stages before running.`);
  }

  // Verify a model is available
  const hasModel = await callModel.isConfigured(undefined);
  if (!hasModel && !agent.defaultModel) {
    throw new Error('No model provider configured. Add an API key or endpoint on the Models page.');
  }

  // Generate a unique slug
  let slug = generateRunSlug();
  const existing = await db.select({ id: runs.id }).from(runs).where(eq(runs.slug, slug));
  if (existing.length > 0) slug = `run-${Date.now().toString(36)}`;

  const title = opts.title || `${agent.name} — ${new Date().toLocaleDateString()}`;

  const [run] = await db
    .insert(runs)
    .values({
      slug,
      title,
      agentId: agent.id,
      status: 'pending',
      input: opts.input ?? {},
      parentRunId: opts.parentRunId ?? null,
    })
    .returning({ id: runs.id, slug: runs.slug });

  // Fire and forget — errors are handled inside executeRun
  void executeRun(run!.id, agent.id).catch((err) => {
    log.error({ runId: run!.id, err: err instanceof Error ? err.message : err }, 'Run failed');
  });

  return { id: run!.id, slug: run!.slug };
}

// ─── Core execution ───────────────────────────────────────────────────────────

async function executeRun(runId: string, agentId: string): Promise<void> {
  await acquireSlot();
  const startTime = Date.now();

  try {
    // Mark as running
    await db
      .update(runs)
      .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
      .where(eq(runs.id, runId));

    emitRunEvent({
      type: 'run_started',
      runId,
      data: {},
      timestamp: new Date().toISOString(),
    });
    await writeRunEvent(runId, 'run_started', 'Run started');

    // Load everything we need
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!agent) throw new Error('Agent disappeared during execution');

    const [run] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!run) throw new Error('Run disappeared during execution');

    const stageRows = await db
      .select({
        stage: agentStages,
        skill: skills,
        providerSlug: modelProviders.slug,
      })
      .from(agentStages)
      .innerJoin(skills, eq(agentStages.skillId, skills.id))
      .leftJoin(modelProviders, eq(agentStages.providerId, modelProviders.id))
      .where(eq(agentStages.agentId, agentId))
      .orderBy(asc(agentStages.position));

    const references = await db
      .select({ name: agentReferences.name, bodyMd: agentReferences.bodyMd })
      .from(agentReferences)
      .where(eq(agentReferences.agentId, agentId))
      .orderBy(asc(agentReferences.position));

    const kbLinks = await db
      .select({ kbId: agentKnowledgeBases.kbId })
      .from(agentKnowledgeBases)
      .where(eq(agentKnowledgeBases.agentId, agentId));
    const kbIds = kbLinks.map((k) => k.kbId);

    // Load facts for the system prompt
    const facts = await activeFacts(kbIds);

    // Core memory
    const coreRows = kbIds.length > 0
      ? await db
          .select({ key: coreMemory.key, value: coreMemory.value })
          .from(coreMemory)
          .where(inArray(coreMemory.kbId, kbIds))
      : [];
    const coreMemoryFacts = coreRows.map((r) => `${r.key}: ${r.value}`);

    // Build the system prompt once — it's the same for every stage
    const systemPrompt = buildSystemPrompt(
      {
        name: agent.name,
        role: agent.role,
        description: agent.description,
        guardrails: agent.guardrails,
      },
      references,
      [...facts, ...coreMemoryFacts],
    );

    // Compute execution levels from the DAG
    const dagNodes: (DagNode & { idx: number })[] = stageRows.map((r, i) => ({
      id: r.stage.id,
      dependsOn: r.stage.dependsOn as string[],
      idx: i,
    }));

    const levels = toLevels(dagNodes);

    // Track outputs so downstream stages can see upstream results
    const outputsByStageId = new Map<string, StageOutput>();
    const runInput = (run.input ?? {}) as Record<string, unknown>;

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let primaryModel = '';
    let gateFailure = false;

    // Execute level by level
    for (const level of levels) {
      if (gateFailure) break;

      // All stages in one level run concurrently
      const results = await Promise.allSettled(
        level.map(async (dagNode) => {
          const row = stageRows[dagNode.idx]!;
          const stageName = row.skill.name;
          const skillBody = row.stage.bodyOverride ?? row.skill.bodyMd;

          // Create the run_stages row
          const [runStage] = await db
            .insert(runStages)
            .values({
              runId,
              agentStageId: row.stage.id,
              position: row.stage.position,
              name: stageName,
              status: 'running',
              startedAt: new Date(),
            })
            .returning();

          emitRunEvent({
            type: 'stage_started',
            runId,
            data: {
              stageId: runStage!.id,
              name: stageName,
              position: row.stage.position,
            },
            timestamp: new Date().toISOString(),
          });
          await writeRunEvent(runId, 'stage_started', `Stage "${stageName}" started`);

          const stageStart = Date.now();

          try {
            // Collect outputs from stages this one depends on
            const prevOutputs: StageOutput[] = [];
            for (const depId of row.stage.dependsOn as string[]) {
              const dep = outputsByStageId.get(depId);
              if (dep) prevOutputs.push(dep);
            }
            // If no explicit dependencies but there are earlier outputs, include all
            if (prevOutputs.length === 0 && outputsByStageId.size > 0) {
              prevOutputs.push(...outputsByStageId.values());
            }

            // Retrieve grounding context
            const groundingChunks = kbIds.length > 0
              ? await retrieve(kbIds, skillBody.slice(0, 500), 6)
              : [];

            // Resolve model: stage override → agent default
            const stageProvider = row.providerSlug ?? undefined;
            const stageModel = row.stage.model ?? agent.defaultModel ?? undefined;

            let completion: CompletionResult;

            if (row.stage.isGate) {
              // Gate stages use structured JSON output
              const gatePrompt = buildGateUserPrompt(skillBody, prevOutputs, runInput);
              completion = await callModel.run({
                system: systemPrompt + '\n\nYou are acting as a quality gate. Respond ONLY with valid JSON.',
                user: gatePrompt,
                provider: stageProvider,
                model: stageModel,
                maxTokens: agent.maxTokens ?? 2048,
                temperature: 0.1,
              });

              // Parse gate result
              let gateResult = { pass: true, reason: 'Gate passed' };
              try {
                const jsonMatch = completion.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  gateResult = JSON.parse(jsonMatch[0]);
                }
              } catch {
                // If we can't parse, treat as pass
                gateResult = { pass: true, reason: 'Could not parse gate response — defaulting to pass' };
              }

              if (!gateResult.pass) {
                gateFailure = true;

                await db
                  .update(runStages)
                  .set({
                    status: 'failed',
                    model: completion.model,
                    inputTokens: completion.inputTokens,
                    outputTokens: completion.outputTokens,
                    costUsd: String(completion.costUsd),
                    output: { gate: gateResult },
                    finishedAt: new Date(),
                  })
                  .where(eq(runStages.id, runStage!.id));

                emitRunEvent({
                  type: 'gate_failed',
                  runId,
                  data: {
                    stageId: runStage!.id,
                    name: stageName,
                    reason: gateResult.reason,
                  },
                  timestamp: new Date().toISOString(),
                });
                await writeRunEvent(runId, 'gate_failed', `Gate "${stageName}" failed: ${gateResult.reason}`);

                totalInputTokens += completion.inputTokens;
                totalOutputTokens += completion.outputTokens;
                totalCostUsd += completion.costUsd;
                if (!primaryModel) primaryModel = completion.model;

                outputsByStageId.set(row.stage.id, {
                  stageName,
                  text: `GATE FAILED: ${gateResult.reason}`,
                });

                return;
              }
            } else {
              // Normal stage
              const userPrompt = buildUserPrompt(skillBody, groundingChunks, prevOutputs, runInput);
              completion = await callModel.run({
                system: systemPrompt,
                user: userPrompt,
                provider: stageProvider,
                model: stageModel,
                maxTokens: agent.maxTokens ?? 4096,
                temperature: agent.temperature ? Number(agent.temperature) : 0.4,
              });
            }

            const stageDuration = Date.now() - stageStart;

            // Update the run_stages row
            await db
              .update(runStages)
              .set({
                status: 'complete',
                model: completion.model,
                inputTokens: completion.inputTokens,
                outputTokens: completion.outputTokens,
                costUsd: String(completion.costUsd),
                output: { text: completion.text },
                finishedAt: new Date(),
              })
              .where(eq(runStages.id, runStage!.id));

            totalInputTokens += completion.inputTokens;
            totalOutputTokens += completion.outputTokens;
            totalCostUsd += completion.costUsd;
            if (!primaryModel) primaryModel = completion.model;

            outputsByStageId.set(row.stage.id, {
              stageName,
              text: completion.text,
            });

            emitRunEvent({
              type: 'stage_complete',
              runId,
              data: {
                stageId: runStage!.id,
                name: stageName,
                position: row.stage.position,
                model: completion.model,
                inputTokens: completion.inputTokens,
                outputTokens: completion.outputTokens,
                costUsd: completion.costUsd,
                durationMs: stageDuration,
              },
              timestamp: new Date().toISOString(),
            });
            await writeRunEvent(
              runId,
              'stage_complete',
              `Stage "${stageName}" complete (${completion.model}, ${completion.inputTokens + completion.outputTokens} tokens)`,
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);

            await db
              .update(runStages)
              .set({
                status: 'error',
                error: message,
                finishedAt: new Date(),
              })
              .where(eq(runStages.id, runStage!.id));

            emitRunEvent({
              type: 'stage_error',
              runId,
              data: {
                stageId: runStage!.id,
                name: stageName,
                error: message,
              },
              timestamp: new Date().toISOString(),
            });
            await writeRunEvent(runId, 'stage_error', `Stage "${stageName}" failed: ${message}`);

            throw err;
          }
        }),
      );

      // Check for any rejected promises in this level
      const errors = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      if (errors.length > 0) {
        const errorMessage = errors
          .map((e) => (e.reason instanceof Error ? e.reason.message : String(e.reason)))
          .join('; ');
        throw new Error(errorMessage);
      }
    }

    // ── Finish the run ──────────────────────────────────────────────────────

    const durationMs = Date.now() - startTime;
    const finalStatus = gateFailure ? 'needs review' : 'complete';

    // Build sections from stage outputs
    const sections = [...outputsByStageId.entries()].map(([, output]) => ({
      heading: output.stageName,
      body: output.text,
    }));

    // Use the last non-gate stage's output as the summary
    const allOutputs = [...outputsByStageId.values()];
    const lastOutput = allOutputs[allOutputs.length - 1];
    const summary = lastOutput
      ? lastOutput.text.slice(0, 300) + (lastOutput.text.length > 300 ? '…' : '')
      : '';

    await db
      .update(runs)
      .set({
        status: finalStatus,
        summary,
        sections,
        model: primaryModel || null,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd: String(totalCostUsd),
        durationMs,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(runs.id, runId));

    // Write activity
    const durationStr = formatDuration(durationMs);
    await db.insert(activities).values({
      slug: `activity-${Date.now().toString(36)}`,
      text: `Run completed: ${lastOutput?.stageName ?? 'pipeline'} (${durationStr}, ${totalInputTokens + totalOutputTokens} tokens, $${totalCostUsd.toFixed(4)})`,
    });

    emitRunEvent({
      type: 'run_complete',
      runId,
      data: {
        status: finalStatus,
        durationMs,
        totalTokens: totalInputTokens + totalOutputTokens,
        costUsd: totalCostUsd,
      },
      timestamp: new Date().toISOString(),
    });
    await writeRunEvent(runId, 'run_complete', `Run ${finalStatus} in ${durationStr}`);

    log.info(
      {
        runId,
        status: finalStatus,
        durationMs,
        tokens: totalInputTokens + totalOutputTokens,
        cost: totalCostUsd,
      },
      'Run finished',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startTime;

    await db
      .update(runs)
      .set({
        status: 'error',
        error: message,
        durationMs,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(runs.id, runId));

    emitRunEvent({
      type: 'run_error',
      runId,
      data: { error: message },
      timestamp: new Date().toISOString(),
    });
    await writeRunEvent(runId, 'run_error', `Run failed: ${message}`);

    log.error({ runId, err: message, durationMs }, 'Run failed');
  } finally {
    // Clean up SSE listeners after a short delay so late events flush
    setTimeout(() => cleanupRun(runId), 5000);
    releaseSlot();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writeRunEvent(runId: string, type: string, message: string): Promise<void> {
  try {
    await db.insert(runEvents).values({ runId, type, message });
  } catch (err) {
    log.warn({ runId, type, err }, 'Failed to write run event');
  }
}
