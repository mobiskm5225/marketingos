import OpenAI from 'openai';
import log from '../../logger';

/**
 * Embeddings for chunk and fact vectors.
 *
 * Deliberately optional: when OPENAI_API_KEY is unset, this returns nulls rather
 * than throwing, and ingestion still stores documents and chunks. Retrieval then
 * falls back to Postgres full-text search. That keeps the whole knowledge
 * pipeline usable before any key is configured, and it upgrades to semantic
 * search the moment one is added — no re-import, just a backfill.
 */

const MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100;

let client: OpenAI | null = null;

export function embeddingsAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient(): OpenAI | null {
  if (!embeddingsAvailable()) return null;
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

/**
 * Embeds a batch of texts. Returns an array the same length as the input, with
 * null in every position when embeddings are unavailable or the call failed —
 * callers must handle nulls rather than assume vectors exist.
 */
export async function embedAll(texts: string[]): Promise<(number[] | null)[]> {
  const openai = getClient();
  if (!openai || texts.length === 0) return texts.map(() => null);

  const out: (number[] | null)[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    try {
      const response = await openai.embeddings.create({
        model: MODEL,
        input: batch.map((t) => t.slice(0, 8000)),
      });
      // The API preserves input order, but sort by index to be certain.
      const sorted = [...response.data].sort((a, b) => a.index - b.index);
      out.push(...sorted.map((d) => d.embedding));
    } catch (err) {
      log.warn(
        { err: err instanceof Error ? err.message : err },
        'Embedding batch failed — storing chunks without vectors',
      );
      out.push(...batch.map(() => null));
    }
  }

  return out;
}

export async function embedOne(text: string): Promise<number[] | null> {
  const [vector] = await embedAll([text]);
  return vector ?? null;
}
