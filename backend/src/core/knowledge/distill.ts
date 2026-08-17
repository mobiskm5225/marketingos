import { eq, and, inArray, isNull, sql, notInArray } from 'drizzle-orm';
import { db } from '../db';
import { documents, notes, facts, coreMemory, distillationRuns, chunks } from '../db/schema';
import { embedAll, embedOne, embeddingsAvailable } from './embed';
import { callModel } from '../ai/provider';
import log from '../../logger';

/**
 * The Memory builder: raw context → working notes → distilled facts → core memory.
 *
 *   Layer 1 documents  — stored as ingested
 *   Layer 2 notes      — one summary per document, refreshed when it changes
 *   Layer 3 facts      — atomic statements, deduped, contradictions superseded
 *   Layer 4 coreMemory — high-confidence facts promoted to always-in-prompt
 *
 * Every pass is recorded in distillationRuns so the UI can report what actually
 * changed rather than a hardcoded line.
 */

/** Two facts closer than this are treated as the same statement. */
const DUPLICATE_THRESHOLD = 0.92;
/** Facts at or above this confidence are promoted into core memory. */
const CORE_PROMOTION_CONFIDENCE = 0.85;

export interface DistillResult {
  runId: string;
  notesWritten: number;
  factsAdded: number;
  conflictsResolved: number;
  skipped?: string;
}

export async function distill(kbId?: string): Promise<DistillResult> {
  const [run] = await db
    .insert(distillationRuns)
    .values({ kbId: kbId ?? null, status: 'running' })
    .returning({ id: distillationRuns.id });
  const runId = run!.id;

  try {
    // Distillation is model work — without a provider there is nothing to do,
    // and pretending otherwise would fabricate facts.
    const usable = await callModel.isConfigured();
    if (!usable) {
      await db
        .update(distillationRuns)
        .set({ status: 'skipped', finishedAt: new Date() })
        .where(eq(distillationRuns.id, runId));
      return {
        runId,
        notesWritten: 0,
        factsAdded: 0,
        conflictsResolved: 0,
        skipped: 'No model provider is configured. Add an API key on the Models page.',
      };
    }

    const notesWritten = await writeNotes(kbId);
    const { factsAdded, conflictsResolved } = await extractFacts(kbId);
    await promoteToCore(kbId);

    await db
      .update(distillationRuns)
      .set({ status: 'complete', factsAdded, conflictsResolved, finishedAt: new Date() })
      .where(eq(distillationRuns.id, runId));

    return { runId, notesWritten, factsAdded, conflictsResolved };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ runId, err: message }, 'Distillation failed');
    await db
      .update(distillationRuns)
      .set({ status: 'error', error: message, finishedAt: new Date() })
      .where(eq(distillationRuns.id, runId));
    throw err;
  }
}

/** Layer 1 → 2. Summarizes documents that have no note yet. */
async function writeNotes(kbId?: string): Promise<number> {
  const existing = await db.select({ documentId: notes.documentId }).from(notes);
  const covered = existing.map((n) => n.documentId);

  const pending = await db
    .select({ id: documents.id, kbId: documents.kbId, name: documents.name, content: documents.content })
    .from(documents)
    .where(
      and(
        eq(documents.status, 'indexed'),
        kbId ? eq(documents.kbId, kbId) : undefined,
        covered.length > 0 ? notInArray(documents.id, covered) : undefined,
      ),
    )
    .limit(50);

  let written = 0;
  for (const doc of pending) {
    if (!doc.content?.trim()) continue;
    const summary = await callModel.complete({
      system:
        'Summarize the document for later reuse. Six sentences at most. State only what the document says — never infer, never embellish.',
      user: `Document: ${doc.name}\n\n${doc.content.slice(0, 12_000)}`,
      maxTokens: 400,
    });
    if (!summary.trim()) continue;
    await db.insert(notes).values({ documentId: doc.id, kbId: doc.kbId, summary });
    written += 1;
  }

  return written;
}

/** Layer 2 → 3. Extracts atomic statements, dedupes, supersedes contradictions. */
async function extractFacts(kbId?: string): Promise<{ factsAdded: number; conflictsResolved: number }> {
  const sourceNotes = await db
    .select({ id: notes.id, kbId: notes.kbId, summary: notes.summary })
    .from(notes)
    .where(kbId ? eq(notes.kbId, kbId) : undefined)
    .limit(100);

  if (sourceNotes.length === 0) return { factsAdded: 0, conflictsResolved: 0 };

  let factsAdded = 0;
  let conflictsResolved = 0;

  for (const note of sourceNotes) {
    const raw = await callModel.complete({
      system:
        'Extract standalone factual statements from the text. One per line, no numbering, no commentary. ' +
        'Each line must be understandable on its own without the surrounding text. Omit opinions and anything hedged.',
      user: note.summary,
      maxTokens: 600,
    });

    const statements = raw
      .split('\n')
      .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
      .filter((line) => line.length > 15);

    if (statements.length === 0) continue;

    const vectors = await embedAll(statements);
    const existing = await db
      .select({ id: facts.id, statement: facts.statement, embedding: facts.embedding })
      .from(facts)
      .where(and(eq(facts.kbId, note.kbId), isNull(facts.supersededBy)));

    for (const [i, statement] of statements.entries()) {
      const vector = vectors[i] ?? null;

      // Near-identical statements are the same fact — keep the newer wording and
      // retire the older rather than accumulating duplicates.
      const duplicate = vector
        ? existing.find(
            (e) => e.embedding && cosine(vector, e.embedding as number[]) >= DUPLICATE_THRESHOLD,
          )
        : existing.find((e) => e.statement.toLowerCase() === statement.toLowerCase());

      if (duplicate) {
        const [replacement] = await db
          .insert(facts)
          .values({
            kbId: note.kbId,
            statement,
            confidence: '0.8',
            sourceNoteIds: [note.id],
            embedding: vector,
          })
          .returning({ id: facts.id });
        await db
          .update(facts)
          .set({ supersededBy: replacement!.id })
          .where(eq(facts.id, duplicate.id));
        conflictsResolved += 1;
        continue;
      }

      await db.insert(facts).values({
        kbId: note.kbId,
        statement,
        confidence: '0.7',
        sourceNoteIds: [note.id],
        embedding: vector,
      });
      factsAdded += 1;
    }
  }

  return { factsAdded, conflictsResolved };
}

/** Layer 3 → 4. Promotes confident facts into always-in-prompt core memory. */
async function promoteToCore(kbId?: string): Promise<void> {
  const candidates = await db
    .select({ id: facts.id, statement: facts.statement, kbId: facts.kbId })
    .from(facts)
    .where(
      and(
        isNull(facts.supersededBy),
        sql`${facts.confidence} >= ${String(CORE_PROMOTION_CONFIDENCE)}`,
        kbId ? eq(facts.kbId, kbId) : undefined,
      ),
    )
    .limit(30);

  for (const candidate of candidates) {
    const key = candidate.statement.slice(0, 80);
    const [exists] = await db.select({ id: coreMemory.id }).from(coreMemory).where(eq(coreMemory.key, key));
    if (exists) continue;
    await db.insert(coreMemory).values({
      kbId: candidate.kbId,
      key,
      value: candidate.statement,
      pinned: false,
    });
  }
}

/** Cosine similarity over two equal-length vectors. */
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
