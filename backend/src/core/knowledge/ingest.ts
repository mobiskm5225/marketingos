import { eq } from 'drizzle-orm';
import { db } from '../db';
import { documents, chunks } from '../db/schema';
import { embedAll } from './embed';
import log from '../../logger';

/**
 * Turns a file, page or crawl into retrievable chunks.
 *
 *   extract text → chunk on paragraph boundaries → embed → store
 *
 * A document is stored even when parsing yields nothing useful, so a failed
 * source is visible in the UI as `error` rather than silently missing.
 */

const TARGET_CHUNK_CHARS = 3200; // ~800 tokens
const OVERLAP_CHARS = 400; // ~100 tokens

export interface IngestInput {
  kbId: string;
  name: string;
  sourceType: 'upload' | 'notion' | 'obsidian' | 'web';
  sourceRef?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  /** Raw bytes for uploads; omit when `text` is supplied directly. */
  buffer?: Buffer;
  /** Already-extracted text, e.g. from Notion or a crawl. */
  text?: string;
}

export interface IngestResult {
  documentId: string;
  chunks: number;
  embedded: boolean;
}

/** Pulls plain text out of the formats the Files tab advertises. */
export async function extractText(
  buffer: Buffer,
  mimeType: string | null | undefined,
  name: string,
): Promise<string> {
  const lower = name.toLowerCase();
  const is = (ext: string) => lower.endsWith(ext);

  if (is('.pdf') || mimeType === 'application/pdf') {
    const { extractText: extractPdf, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractPdf(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join('\n\n') : text;
  }

  if (is('.docx')) {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (is('.xlsx') || is('.xls') || is('.csv')) {
    const XLSX = await import('xlsx');
    const book = XLSX.read(buffer, { type: 'buffer' });
    return book.SheetNames.map((sheet) => {
      const csv = XLSX.utils.sheet_to_csv(book.Sheets[sheet]!);
      return `## ${sheet}\n${csv}`;
    }).join('\n\n');
  }

  // md, txt, json, html and anything else readable as text
  return buffer.toString('utf8');
}

/**
 * Splits on blank lines and packs paragraphs up to the target size, carrying a
 * small overlap so a fact spanning a boundary is still retrievable. A single
 * oversized paragraph is hard-split rather than dropped.
 */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).flatMap((p) => {
    const trimmed = p.trim();
    if (!trimmed) return [];
    if (trimmed.length <= TARGET_CHUNK_CHARS) return [trimmed];
    const pieces: string[] = [];
    for (let i = 0; i < trimmed.length; i += TARGET_CHUNK_CHARS) {
      pieces.push(trimmed.slice(i, i + TARGET_CHUNK_CHARS));
    }
    return pieces;
  });

  const out: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > TARGET_CHUNK_CHARS) {
      out.push(current);
      const tail = current.slice(-OVERLAP_CHARS);
      // Resume from a word boundary so the overlap does not start mid-word.
      current = `${tail.slice(tail.indexOf(' ') + 1)}\n\n${paragraph}`;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim()) out.push(current);
  return out;
}

export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const [doc] = await db
    .insert(documents)
    .values({
      kbId: input.kbId,
      name: input.name,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef ?? null,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? input.buffer?.length ?? null,
      status: 'pending',
    })
    .returning({ id: documents.id });

  const documentId = doc!.id;

  try {
    const text =
      input.text ?? (input.buffer ? await extractText(input.buffer, input.mimeType, input.name) : '');

    if (!text.trim()) throw new Error('No readable text found in this document.');

    const pieces = chunkText(text);
    const vectors = await embedAll(pieces);

    if (pieces.length > 0) {
      await db.insert(chunks).values(
        pieces.map((content, ordinal) => ({
          documentId,
          kbId: input.kbId,
          ordinal,
          content,
          // Rough token estimate; only used for display and budgeting.
          tokenCount: Math.ceil(content.length / 4),
          embedding: vectors[ordinal] ?? null,
        })),
      );
    }

    await db
      .update(documents)
      .set({ content: text, status: 'indexed', updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    return { documentId, chunks: pieces.length, embedded: vectors.some(Boolean) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn({ documentId, err: message }, 'Ingestion failed');
    await db
      .update(documents)
      .set({ status: 'error', error: message, updatedAt: new Date() })
      .where(eq(documents.id, documentId));
    return { documentId, chunks: 0, embedded: false };
  }
}
