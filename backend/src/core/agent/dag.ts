/**
 * Dependency graph helpers shared by the pipeline map and the runner.
 *
 * Stage dependencies are stored as ids on `agent_stages.depends_on`, so order
 * and parallelism are computed from data rather than parsed out of prose. Both
 * consumers must agree on that computation, which is why it lives here rather
 * than in either one.
 */

export interface DagNode {
  id: string;
  dependsOn: string[];
}

export class CycleError extends Error {
  constructor(public readonly involved: string[]) {
    super('Pipeline stages form a dependency cycle.');
  }
}

/**
 * Groups nodes into execution levels. Everything in one level has no dependency
 * on anything else in that level, so a runner may execute a level concurrently.
 *
 * Dependencies pointing outside the given set are ignored — a stage that
 * referenced a since-deleted stage should still be schedulable.
 */
export function toLevels<T extends DagNode>(nodes: T[]): T[][] {
  const present = new Set(nodes.map((n) => n.id));
  const remaining = new Map(nodes.map((n) => [n.id, n]));
  const done = new Set<string>();
  const levels: T[][] = [];

  while (remaining.size > 0) {
    const ready = [...remaining.values()].filter((n) =>
      n.dependsOn.every((d) => !present.has(d) || done.has(d)),
    );

    if (ready.length === 0) throw new CycleError([...remaining.keys()]);

    for (const n of ready) remaining.delete(n.id);
    for (const n of ready) done.add(n.id);
    levels.push(ready);
  }

  return levels;
}

/** Throws CycleError if the graph cannot be ordered. Used to validate writes. */
export function assertAcyclic(nodes: DagNode[]): void {
  toLevels(nodes);
}

/**
 * True when adding `from → to` would create a cycle, i.e. `to` can already
 * reach `from`. Lets the UI reject an edge before the user commits it.
 */
export function wouldCycle(nodes: DagNode[], from: string, to: string): boolean {
  if (from === to) return true;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const stack = [to];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === from) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const dep of byId.get(current)?.dependsOn ?? []) stack.push(dep);
  }

  return false;
}
