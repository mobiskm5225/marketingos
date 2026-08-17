/**
 * Works out an agent's pipeline — stage order, dependencies and gates — from an
 * AGENT.md and the skills found beside it.
 *
 * This is deliberately deterministic rather than model-driven. The agents these
 * imports come from state their pipeline explicitly:
 *
 *   1.  gather-context        → page brief
 *         ├─ 2. competitor-research    ┐ parallel
 *         └─ 4. keyword-research       ┘ (need only stage 1)
 *   3.  messaging-strategy    → …   (needs 1+2)
 *   8.  write-copy            → …   (needs 3+6+7)
 *
 * …so parsing beats guessing, works with no API key configured, and is testable.
 * `refineWithModel` in map.ts can improve a messy import afterwards, and the
 * user confirms the result in the visual map before anything is written.
 */

export interface AnalyzedStage {
  skillSlug: string;
  position: number;
  /** Stage *positions* this one depends on. Resolved to ids at commit time. */
  dependsOn: number[];
  isGate: boolean;
}

/** Extracts every integer in a string: "3+6+7" → [3,6,7], "9 pass" → [9]. */
function numbersIn(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}

/**
 * Pulls `<n>. <skill-name>` lines out of the pipeline block, tolerating the
 * box-drawing characters used to show parallel groups.
 */
function parsePipelineLines(agentMd: string): Map<number, { slug: string; deps: number[] }> {
  const found = new Map<number, { slug: string; deps: number[] }>();

  for (const line of agentMd.split('\n')) {
    // Strip leading tree glyphs and whitespace before matching.
    const cleaned = line.replace(/^[\s│├└─┐┘┌┤┬┴┼|+\\-]*/u, '');
    const match = cleaned.match(/^(\d+)\.\s+([a-z0-9][a-z0-9-]*)/i);
    if (!match) continue;

    const position = Number(match[1]);
    const slug = match[2]!.toLowerCase();

    // "(needs 3+6+7)", "(needs 9 pass)", "(need only stage 1)"
    const needs = line.match(/\(\s*needs?\b([^)]*)\)/i);
    const deps = needs ? numbersIn(needs[1]!) : [];

    found.set(position, { slug, deps });
  }

  return found;
}

/**
 * Prose fallbacks for pipelines that describe dependencies in sentences rather
 * than inline markers, e.g. "Stages 2 and 3 both depend only on stage 1".
 */
function applyProseDependencies(
  agentMd: string,
  stages: Map<number, { slug: string; deps: number[] }>,
): void {
  const dependOnly = /stages?\s+([\d,\sand]+?)\s+(?:both\s+)?depends?\s+only\s+on\s+stage\s+(\d+)/gi;
  let match: RegExpExecArray | null;
  let lastParallelGroup: number[] = [];

  while ((match = dependOnly.exec(agentMd)) !== null) {
    const targets = numbersIn(match[1]!);
    const source = Number(match[2]);
    lastParallelGroup = targets;
    for (const t of targets) {
      const stage = stages.get(t);
      if (stage && stage.deps.length === 0) stage.deps = [source];
    }
  }

  // "Stage 4 needs both." — refers to the parallel group just described.
  const needsBoth = /stage\s+(\d+)\s+needs\s+both/gi;
  while ((match = needsBoth.exec(agentMd)) !== null) {
    const stage = stages.get(Number(match[1]));
    if (stage && stage.deps.length === 0 && lastParallelGroup.length > 0) {
      stage.deps = [...lastParallelGroup];
    }
  }
}

/** "Stages 9 and 10 are gates", "Stage 5 is a hard gate". */
function findGates(agentMd: string): Set<number> {
  const gates = new Set<number>();
  const pattern = /stages?\s+([\d,\sand]+?)\s+(?:are|is)\s+(?:a\s+)?(?:hard\s+)?gates?/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(agentMd)) !== null) {
    for (const n of numbersIn(match[1]!)) gates.add(n);
  }

  return gates;
}

export function analyzePipeline(agentMd: string, skillSlugs: string[]): AnalyzedStage[] {
  const known = new Set(skillSlugs);
  const parsed = parsePipelineLines(agentMd ?? '');

  // Keep only lines that name a skill we actually imported.
  for (const [position, entry] of parsed) {
    if (!known.has(entry.slug)) parsed.delete(position);
  }

  applyProseDependencies(agentMd ?? '', parsed);
  const gates = findGates(agentMd ?? '');

  if (parsed.size === 0) {
    // No parseable pipeline — fall back to a sequential chain in the order the
    // skills were discovered, which the user can rewire in the map.
    return skillSlugs.map((slug, i) => ({
      skillSlug: slug,
      position: i + 1,
      dependsOn: i === 0 ? [] : [i],
      isGate: false,
    }));
  }

  const positions = [...parsed.keys()].sort((a, b) => a - b);

  const stages: AnalyzedStage[] = [...parsed.entries()]
    .map(([position, { slug, deps }]) => {
      // Drop references to stages that were not imported.
      let dependsOn = deps.filter((d) => parsed.has(d) && d !== position);

      // A numbered stage that states no dependency still runs after the one
      // before it — without this it would land in the first execution level and
      // run before the work it consumes.
      if (dependsOn.length === 0) {
        const previous = positions.filter((p) => p < position).pop();
        if (previous !== undefined) dependsOn = [previous];
      }

      return { skillSlug: slug, position, dependsOn, isGate: gates.has(position) };
    })
    .sort((a, b) => a.position - b.position);

  // Any skill the pipeline block never mentioned still belongs to the agent —
  // append it rather than silently dropping it.
  const placed = new Set(stages.map((s) => s.skillSlug));
  let next = Math.max(...stages.map((s) => s.position)) + 1;
  for (const slug of skillSlugs) {
    if (placed.has(slug)) continue;
    stages.push({ skillSlug: slug, position: next, dependsOn: [], isGate: false });
    next += 1;
  }

  return stages;
}

/**
 * Groups stages into execution levels: everything in a level has no dependency
 * on anything else in that level, so a runtime may execute it concurrently.
 * Shared by the pipeline map and the runner. Throws on a cycle.
 */
export function toLevels<T extends { position: number; dependsOn: number[] }>(
  stages: T[],
): T[][] {
  const remaining = new Map(stages.map((s) => [s.position, s]));
  const done = new Set<number>();
  const levels: T[][] = [];

  while (remaining.size > 0) {
    const ready = [...remaining.values()].filter((s) =>
      s.dependsOn.every((d) => done.has(d) || !remaining.has(d)),
    );

    if (ready.length === 0) {
      throw new Error(
        `Pipeline has a dependency cycle among stages: ${[...remaining.keys()].join(', ')}`,
      );
    }

    for (const s of ready) {
      remaining.delete(s.position);
    }
    for (const s of ready) {
      done.add(s.position);
    }

    levels.push(ready.sort((a, b) => a.position - b.position));
  }

  return levels;
}
