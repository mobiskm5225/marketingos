import { Router } from 'express';
import { z } from 'zod';
import { eq, count, sql, asc, inArray } from 'drizzle-orm';
import { db } from '../core/db';
import {
  agents,
  agentKnowledgeBases,
  agentStages,
  agentReferences,
  agentInputs,
  knowledgeBases,
  modelProviders,
  runs,
  skills,
} from '../core/db/schema';
import { toLevels, CycleError } from '../core/agent/dag';
import { slugify } from '../core/skills/parse';
import { HttpError } from '../middleware/error';

const router = Router();

async function findAgent(slug: string) {
  const [row] = await db.select().from(agents).where(eq(agents.slug, slug));
  if (!row) throw new HttpError(404, 'Agent not found');
  return row;
}

// ─── List ─────────────────────────────────────────────────────────────────────

router.get('/agents', async (_req, res, next) => {
  try {
    const allAgents = await db.select().from(agents).orderBy(agents.createdAt);

    const agentKbs = await db
      .select({ agentId: agentKnowledgeBases.agentId, kbName: knowledgeBases.name })
      .from(agentKnowledgeBases)
      .innerJoin(knowledgeBases, eq(agentKnowledgeBases.kbId, knowledgeBases.id));

    // The `skills` array the UI shows is derived from the pipeline stages.
    const stageSkills = await db
      .select({
        agentId: agentStages.agentId,
        position: agentStages.position,
        skillName: skills.name,
      })
      .from(agentStages)
      .innerJoin(skills, eq(agentStages.skillId, skills.id))
      .orderBy(asc(agentStages.position));

    const stats = await db
      .select({
        agentId: runs.agentId,
        totalRuns: count(runs.id),
        lastRunAt: sql<Date | null>`MAX(${runs.createdAt})`,
        successCount: sql<number>`SUM(CASE WHEN ${runs.status} = 'complete' THEN 1 ELSE 0 END)`,
      })
      .from(runs)
      .groupBy(runs.agentId);

    const kbsByAgent = groupBy(agentKbs, (r) => r.agentId, (r) => r.kbName);
    const skillsByAgent = groupBy(stageSkills, (r) => r.agentId, (r) => r.skillName);

    const statsByAgent = new Map(
      stats.map((row) => {
        const total = Number(row.totalRuns);
        return [
          row.agentId,
          {
            runs: total,
            successRate: total > 0 ? Math.round((Number(row.successCount) / total) * 100) : 0,
            lastRun: row.lastRunAt ? new Date(row.lastRunAt).toISOString() : null,
          },
        ];
      }),
    );

    res.json(
      allAgents.map((a) => {
        const s = statsByAgent.get(a.id) ?? { runs: 0, successRate: 0, lastRun: null };
        return {
          id: a.slug,
          name: a.name,
          role: a.role,
          description: a.description,
          status: a.status,
          icon: a.icon,
          category: a.category,
          model: a.defaultModel ?? '',
          skills: skillsByAgent.get(a.id) ?? [],
          knowledgeBases: kbsByAgent.get(a.id) ?? [],
          runs: s.runs,
          successRate: s.successRate,
          lastRun: s.lastRun,
        };
      }),
    );
  } catch (err) {
    next(err);
  }
});

function groupBy<T, V>(rows: T[], key: (r: T) => string, value: (r: T) => V): Map<string, V[]> {
  const out = new Map<string, V[]>();
  for (const row of rows) {
    const k = key(row);
    const list = out.get(k) ?? [];
    list.push(value(row));
    out.set(k, list);
  }
  return out;
}

// ─── Detail ───────────────────────────────────────────────────────────────────

router.get('/agents/:slug', async (req, res, next) => {
  try {
    const agent = await findAgent(req.params.slug);

    const stageRows = await db
      .select({ stage: agentStages, skill: skills, providerSlug: modelProviders.slug })
      .from(agentStages)
      .innerJoin(skills, eq(agentStages.skillId, skills.id))
      .leftJoin(modelProviders, eq(agentStages.providerId, modelProviders.id))
      .where(eq(agentStages.agentId, agent.id))
      .orderBy(asc(agentStages.position));

    const stages = stageRows.map(({ stage, skill, providerSlug }) => ({
      id: stage.id,
      skill: skill.slug,
      skillName: skill.name,
      description: skill.description,
      position: stage.position,
      dependsOn: stage.dependsOn,
      isGate: stage.isGate,
      // null means "inherit the agent default" — that is the per-layer routing.
      provider: providerSlug,
      model: stage.model,
      hasOverride: Boolean(stage.bodyOverride),
    }));

    // Levels are computed, never stored, so the map and the runner never drift.
    let levels: string[][] = [];
    let cycle: string[] | null = null;
    try {
      levels = toLevels(stages).map((level) => level.map((s) => s.id));
    } catch (err) {
      if (err instanceof CycleError) cycle = err.involved;
      else throw err;
    }

    const [references, inputs, linkedKbs, provider] = await Promise.all([
      db
        .select()
        .from(agentReferences)
        .where(eq(agentReferences.agentId, agent.id))
        .orderBy(asc(agentReferences.position)),
      db
        .select()
        .from(agentInputs)
        .where(eq(agentInputs.agentId, agent.id))
        .orderBy(asc(agentInputs.position)),
      db
        .select({ slug: knowledgeBases.slug })
        .from(agentKnowledgeBases)
        .innerJoin(knowledgeBases, eq(agentKnowledgeBases.kbId, knowledgeBases.id))
        .where(eq(agentKnowledgeBases.agentId, agent.id)),
      agent.defaultProviderId
        ? db
            .select({ slug: modelProviders.slug })
            .from(modelProviders)
            .where(eq(modelProviders.id, agent.defaultProviderId))
        : Promise.resolve([]),
    ]);

    res.json({
      id: agent.slug,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      status: agent.status,
      icon: agent.icon,
      category: agent.category,
      guardrails: agent.guardrails,
      agentMd: agent.agentMd,
      defaultProvider: provider[0]?.slug ?? null,
      defaultModel: agent.defaultModel,
      temperature: agent.temperature ? Number(agent.temperature) : null,
      maxTokens: agent.maxTokens,
      knowledgeBases: linkedKbs.map((k) => k.slug),
      stages,
      levels,
      cycle,
      references: references.map((r) => ({ id: r.id, name: r.name, bodyMd: r.bodyMd })),
      inputs: inputs.map((i) => ({
        id: i.id,
        key: i.key,
        label: i.label,
        type: i.type,
        required: i.required,
        placeholder: i.placeholder,
        options: i.options,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Create / update / delete ─────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().default('Custom agent'),
  description: z.string().default(''),
  model: z.string().nullish(),
  category: z.string().nullish(),
});

router.post('/agents', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const slug = slugify(body.name);
    if (!slug) throw new HttpError(400, 'Name must contain at least one letter or number.');

    const [clash] = await db.select({ id: agents.id }).from(agents).where(eq(agents.slug, slug));
    if (clash) throw new HttpError(409, `An agent named "${body.name}" already exists.`);

    const [created] = await db
      .insert(agents)
      .values({
        slug,
        name: body.name,
        role: body.role || 'Custom agent',
        description: body.description || 'No description yet.',
        status: 'draft',
        icon: 'Bot',
        category: body.category ?? null,
        defaultModel: body.model ?? null,
      })
      .returning({ slug: agents.slug });

    res.status(201).json({ id: created!.slug });
  } catch (err) {
    next(err);
  }
});

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'draft', 'paused']).optional(),
  icon: z.string().optional(),
  category: z.string().nullish(),
  guardrails: z.string().nullish(),
  defaultProvider: z.string().nullish(),
  defaultModel: z.string().nullish(),
  temperature: z.number().min(0).max(2).nullish(),
  maxTokens: z.number().int().positive().nullish(),
});

router.patch('/agents/:slug', async (req, res, next) => {
  try {
    const agent = await findAgent(req.params.slug);
    const body = patchSchema.parse(req.body);

    let defaultProviderId: string | null | undefined;
    if (body.defaultProvider !== undefined) {
      defaultProviderId = body.defaultProvider
        ? (await requireProviderId(body.defaultProvider))
        : null;
    }

    await db
      .update(agents)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.category !== undefined ? { category: body.category ?? null } : {}),
        ...(body.guardrails !== undefined ? { guardrails: body.guardrails ?? null } : {}),
        ...(defaultProviderId !== undefined ? { defaultProviderId } : {}),
        ...(body.defaultModel !== undefined ? { defaultModel: body.defaultModel ?? null } : {}),
        ...(body.temperature !== undefined
          ? { temperature: body.temperature === null ? null : String(body.temperature) }
          : {}),
        ...(body.maxTokens !== undefined ? { maxTokens: body.maxTokens ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agent.id));

    res.json({ id: agent.slug });
  } catch (err) {
    next(err);
  }
});

router.delete('/agents/:slug', async (req, res, next) => {
  try {
    const agent = await findAgent(req.params.slug);
    // Stages, references, inputs and runs cascade; skills survive in the library.
    await db.delete(agents).where(eq(agents.id, agent.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

async function requireProviderId(slug: string): Promise<string> {
  const [row] = await db
    .select({ id: modelProviders.id })
    .from(modelProviders)
    .where(eq(modelProviders.slug, slug));
  if (!row) throw new HttpError(400, `Unknown model provider "${slug}".`);
  return row.id;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

const stagesSchema = z.object({
  stages: z
    .array(
      z.object({
        // Absent for a newly added stage; present when editing an existing one.
        id: z.string().uuid().optional(),
        skill: z.string().min(1),
        position: z.number().int().positive(),
        dependsOn: z.array(z.string()).default([]),
        isGate: z.boolean().default(false),
        provider: z.string().nullish(),
        model: z.string().nullish(),
        bodyOverride: z.string().nullish(),
      }),
    )
    .default([]),
});

/**
 * Replaces the whole pipeline in one call.
 *
 * Incoming `dependsOn` may reference either an existing stage id or the
 * client-side id of a stage created in the same request, so ids are remapped
 * after insert. The result is validated for cycles before it is committed.
 */
router.put('/agents/:slug/stages', async (req, res, next) => {
  try {
    const agent = await findAgent(req.params.slug);
    const { stages } = stagesSchema.parse(req.body);

    const slugs = [...new Set(stages.map((s) => s.skill))];
    const skillRows = slugs.length
      ? await db.select({ id: skills.id, slug: skills.slug }).from(skills).where(inArray(skills.slug, slugs))
      : [];
    const skillIdBySlug = new Map(skillRows.map((s) => [s.slug, s.id]));

    for (const stage of stages) {
      if (!skillIdBySlug.has(stage.skill)) {
        throw new HttpError(400, `Unknown skill "${stage.skill}".`);
      }
    }

    const providerSlugs = [...new Set(stages.map((s) => s.provider).filter(Boolean))] as string[];
    const providerRows = providerSlugs.length
      ? await db
          .select({ id: modelProviders.id, slug: modelProviders.slug })
          .from(modelProviders)
          .where(inArray(modelProviders.slug, providerSlugs))
      : [];
    const providerIdBySlug = new Map(providerRows.map((p) => [p.slug, p.id]));

    // Validate the graph using the client's own ids before touching the database.
    const localIds = stages.map((s, i) => s.id ?? `new-${i}`);
    const localIdSet = new Set(localIds);
    toLevels(
      stages.map((s, i) => ({
        id: localIds[i]!,
        dependsOn: s.dependsOn.filter((d) => localIdSet.has(d)),
      })),
    );

    await db.transaction(async (tx) => {
      await tx.delete(agentStages).where(eq(agentStages.agentId, agent.id));

      const newIdByLocalId = new Map<string, string>();
      for (const [i, stage] of stages.entries()) {
        const [row] = await tx
          .insert(agentStages)
          .values({
            agentId: agent.id,
            skillId: skillIdBySlug.get(stage.skill)!,
            position: stage.position,
            dependsOn: [],
            isGate: stage.isGate,
            providerId: stage.provider ? (providerIdBySlug.get(stage.provider) ?? null) : null,
            model: stage.model ?? null,
            bodyOverride: stage.bodyOverride ?? null,
          })
          .returning({ id: agentStages.id });
        newIdByLocalId.set(localIds[i]!, row!.id);
      }

      for (const [i, stage] of stages.entries()) {
        const resolved = stage.dependsOn
          .map((d) => newIdByLocalId.get(d))
          .filter((id): id is string => Boolean(id));
        if (resolved.length === 0) continue;
        await tx
          .update(agentStages)
          .set({ dependsOn: resolved })
          .where(eq(agentStages.id, newIdByLocalId.get(localIds[i]!)!));
      }
    });

    res.json({ stages: stages.length });
  } catch (err) {
    if (err instanceof CycleError) {
      next(new HttpError(400, 'Those dependencies form a loop — a stage cannot depend on itself.'));
      return;
    }
    next(err);
  }
});

// ─── References, inputs, knowledge ────────────────────────────────────────────

router.put('/agents/:slug/references', async (req, res, next) => {
  try {
    const agent = await findAgent(req.params.slug);
    const { references } = z
      .object({
        references: z
          .array(z.object({ name: z.string().min(1), bodyMd: z.string() }))
          .default([]),
      })
      .parse(req.body);

    await db.transaction(async (tx) => {
      await tx.delete(agentReferences).where(eq(agentReferences.agentId, agent.id));
      for (const [i, reference] of references.entries()) {
        await tx.insert(agentReferences).values({
          agentId: agent.id,
          name: reference.name,
          bodyMd: reference.bodyMd,
          position: i,
        });
      }
    });

    res.json({ references: references.length });
  } catch (err) {
    next(err);
  }
});

router.put('/agents/:slug/inputs', async (req, res, next) => {
  try {
    const agent = await findAgent(req.params.slug);
    const { inputs } = z
      .object({
        inputs: z
          .array(
            z.object({
              key: z.string().min(1),
              label: z.string().min(1),
              type: z.enum(['text', 'textarea', 'file', 'url', 'select']).default('text'),
              required: z.boolean().default(true),
              placeholder: z.string().nullish(),
              options: z.array(z.string()).default([]),
            }),
          )
          .default([]),
      })
      .parse(req.body);

    const keys = new Set<string>();
    for (const input of inputs) {
      if (keys.has(input.key)) throw new HttpError(400, `Duplicate input key "${input.key}".`);
      keys.add(input.key);
    }

    await db.transaction(async (tx) => {
      await tx.delete(agentInputs).where(eq(agentInputs.agentId, agent.id));
      for (const [i, input] of inputs.entries()) {
        await tx.insert(agentInputs).values({
          agentId: agent.id,
          key: input.key,
          label: input.label,
          type: input.type,
          required: input.required,
          placeholder: input.placeholder ?? null,
          options: input.options,
          position: i,
        });
      }
    });

    res.json({ inputs: inputs.length });
  } catch (err) {
    next(err);
  }
});

router.put('/agents/:slug/knowledge-bases', async (req, res, next) => {
  try {
    const agent = await findAgent(req.params.slug);
    const { kbSlugs } = z.object({ kbSlugs: z.array(z.string()).default([]) }).parse(req.body);

    const rows = kbSlugs.length
      ? await db
          .select({ id: knowledgeBases.id, slug: knowledgeBases.slug })
          .from(knowledgeBases)
          .where(inArray(knowledgeBases.slug, kbSlugs))
      : [];

    const found = new Set(rows.map((r) => r.slug));
    const missing = kbSlugs.filter((s) => !found.has(s));
    if (missing.length > 0) throw new HttpError(400, `Unknown knowledge base: ${missing.join(', ')}`);

    await db.transaction(async (tx) => {
      await tx.delete(agentKnowledgeBases).where(eq(agentKnowledgeBases.agentId, agent.id));
      for (const row of rows) {
        await tx.insert(agentKnowledgeBases).values({ agentId: agent.id, kbId: row.id });
      }
    });

    res.json({ knowledgeBases: rows.length });
  } catch (err) {
    next(err);
  }
});

export default router;
