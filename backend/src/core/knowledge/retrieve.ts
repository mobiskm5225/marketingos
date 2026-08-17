import { sql, inArray, and, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import { chunks, knowledgeBases, facts } from '../db/schema';
import { embedOne } from './embed';

/**
 * The single retrieval interface the agent runtime uses.
 *
 * Prefers vector similarity. Falls back to Postgres full-text search when the
 * query cannot be embedded (no API key) or when no chunk has a vector yet, so
 * grounding still works — with weaker recall — before embeddings are configured.
 */

export interface RetrievedChunk {
  content: string;
  kbName: string;
  documentId: string;
  score: number;
  method: 'vector' | 'text';
}

export async function retrieve(
  kbIds: string[],
  query: string,
  limit = 8,
): Promise<RetrievedChunk[]> {
  if (kbIds.length === 0 || !query.trim()) return [];

  const vector = await embedOne(query);

  if (vector) {
    const literal = `[${vector.join(',')}]`;
    const rows = await db
      .select({
        content: chunks.content,
        kbName: knowledgeBases.name,
        documentId: chunks.documentId,
        // Cosine distance → similarity, so higher is better in both branches.
        score: sql<number>`1 - (${chunks.embedding} <=> ${literal}::vector)`,
      })
      .from(chunks)
      .innerJoin(knowledgeBases, sql`${knowledgeBases.id} = ${chunks.kbId}`)
      .where(and(inArray(chunks.kbId, kbIds), isNotNull(chunks.embedding)))
      .orderBy(sql`${chunks.embedding} <=> ${literal}::vector`)
      .limit(limit);

    if (rows.length > 0) {
      return rows.map((r) => ({ ...r, score: Number(r.score), method: 'vector' as const }));
    }
  }

  return textSearch(kbIds, query, limit);
}

async function textSearch(kbIds: string[], query: string, limit: number): Promise<RetrievedChunk[]> {
  const rows = await db
    .select({
      content: chunks.content,
      kbName: knowledgeBases.name,
      documentId: chunks.documentId,
      score: sql<number>`ts_rank(to_tsvector('english', ${chunks.content}), plainto_tsquery('english', ${query}))`,
    })
    .from(chunks)
    .innerJoin(knowledgeBases, sql`${knowledgeBases.id} = ${chunks.kbId}`)
    .where(
      and(
        inArray(chunks.kbId, kbIds),
        sql`to_tsvector('english', ${chunks.content}) @@ plainto_tsquery('english', ${query})`,
      ),
    )
    .orderBy(
      sql`ts_rank(to_tsvector('english', ${chunks.content}), plainto_tsquery('english', ${query})) DESC`,
    )
    .limit(limit);

  return rows.map((r) => ({ ...r, score: Number(r.score), method: 'text' as const }));
}

/**
 * Distilled facts for the linked bases. These go into the prompt wholesale
 * rather than being retrieved by similarity — they are the statements the agent
 * treats as true, and there are few enough to carry every time.
 */
export async function activeFacts(kbIds: string[], limit = 50): Promise<string[]> {
  if (kbIds.length === 0) return [];
  const rows = await db
    .select({ statement: facts.statement })
    .from(facts)
    .where(and(inArray(facts.kbId, kbIds), sql`${facts.supersededBy} IS NULL`))
    .orderBy(sql`${facts.confidence} DESC`)
    .limit(limit);
  return rows.map((r) => r.statement);
}
