/**
 * Prompt assembly for agent pipeline stages.
 *
 * Each stage needs two things: a system prompt (who the agent is, its
 * constraints, and the facts it knows) and a user prompt (the skill's
 * instructions, grounding context, earlier stage outputs, and the run input).
 *
 * Both are plain strings — the model protocol layer in `ai/provider.ts`
 * handles message formatting.
 */

import type { RetrievedChunk } from '../knowledge/retrieve';

export interface AgentContext {
  name: string;
  role: string;
  description: string;
  guardrails: string | null;
}

export interface Reference {
  name: string;
  bodyMd: string;
}

export interface StageOutput {
  stageName: string;
  text: string;
}

// ─── System prompt ────────────────────────────────────────────────────────────

export function buildSystemPrompt(
  agent: AgentContext,
  references: Reference[],
  facts: string[],
): string {
  const parts: string[] = [];

  parts.push(`You are "${agent.name}", a specialised marketing agent.`);
  parts.push(`Role: ${agent.role}`);
  if (agent.description) parts.push(`Description: ${agent.description}`);

  if (agent.guardrails) {
    parts.push('');
    parts.push('## Constraints (you MUST follow these)');
    parts.push(agent.guardrails);
  }

  if (references.length > 0) {
    parts.push('');
    parts.push('## Reference documents');
    for (const ref of references) {
      parts.push(`### ${ref.name}`);
      parts.push(ref.bodyMd);
    }
  }

  if (facts.length > 0) {
    parts.push('');
    parts.push('## Known facts (treat as true)');
    for (const fact of facts) {
      parts.push(`- ${fact}`);
    }
  }

  return parts.join('\n');
}

// ─── User prompt ──────────────────────────────────────────────────────────────

export function buildUserPrompt(
  skillBody: string,
  groundingChunks: RetrievedChunk[],
  previousOutputs: StageOutput[],
  runInput: Record<string, unknown>,
): string {
  const parts: string[] = [];

  // Skill instructions are the primary directive for this stage.
  parts.push('## Task');
  parts.push(skillBody);

  // Run input — what the user supplied when starting this run.
  const inputEntries = Object.entries(runInput).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );
  if (inputEntries.length > 0) {
    parts.push('');
    parts.push('## Run input');
    for (const [key, value] of inputEntries) {
      parts.push(`**${key}**: ${String(value)}`);
    }
  }

  // Earlier stage outputs — each stage sees what came before it.
  if (previousOutputs.length > 0) {
    parts.push('');
    parts.push('## Previous stage outputs');
    for (const prev of previousOutputs) {
      parts.push(`### ${prev.stageName}`);
      parts.push(prev.text);
    }
  }

  // Retrieved knowledge — grounding context from the agent's knowledge bases.
  if (groundingChunks.length > 0) {
    parts.push('');
    parts.push('## Retrieved context');
    for (const chunk of groundingChunks) {
      parts.push(`[${chunk.kbName}] ${chunk.content}`);
    }
  }

  return parts.join('\n');
}

// ─── Gate prompt ──────────────────────────────────────────────────────────────

/**
 * Gates use a structured JSON response. The system prompt wraps the skill body
 * with instructions to return `{ "pass": true/false, "reason": "..." }`.
 */
export function buildGateUserPrompt(
  skillBody: string,
  previousOutputs: StageOutput[],
  runInput: Record<string, unknown>,
): string {
  const parts: string[] = [];

  parts.push('## Quality gate');
  parts.push('You are a quality gate. Evaluate whether the work so far meets the criteria below.');
  parts.push('');
  parts.push('### Criteria');
  parts.push(skillBody);

  const inputEntries = Object.entries(runInput).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );
  if (inputEntries.length > 0) {
    parts.push('');
    parts.push('### Original input');
    for (const [key, value] of inputEntries) {
      parts.push(`**${key}**: ${String(value)}`);
    }
  }

  if (previousOutputs.length > 0) {
    parts.push('');
    parts.push('### Work to evaluate');
    for (const prev of previousOutputs) {
      parts.push(`#### ${prev.stageName}`);
      parts.push(prev.text);
    }
  }

  parts.push('');
  parts.push('### Response format');
  parts.push('Respond ONLY with a JSON object:');
  parts.push('```json');
  parts.push('{ "pass": true, "reason": "Brief explanation" }');
  parts.push('```');
  parts.push('Set "pass" to false if the work does not meet the criteria.');

  return parts.join('\n');
}
