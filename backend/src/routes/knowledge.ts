import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { eq, count, desc, isNull } from 'drizzle-orm';
import { db } from '../core/db';
import {
  knowledgeBases,
  agentKnowledgeBases,
  agents,
  documents,
  chunks,
  notes,
  facts,
  coreMemory,
  distillationRuns,
} from '../core/db/schema';
import { ingestDocument } from '../core/knowledge/ingest';
import { embeddingsAvailable } from '../core/knowledge/embed';
import { distill } from '../core/knowledge/distill';
import { slugify } from '../core/skills/parse';
import { HttpError } from '../middleware/error';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

async function findKb(slug: string) {
  const [row] = await db.select().from(knowledgeBases).where(eq(knowledgeBases.slug, slug));
  if (!row) throw new HttpError(404, 'Knowledge base not found');
  return row;
}

/** The three memory layers a base can represent. Layer 4 is core memory. */
const KB_TYPES = ['Raw corpus', 'Curated notes', 'Distilled memory'] as const;

// ─── Bases ────────────────────────────────────────────────────────────────────

router.get('/knowledge-bases', async (_req, res, next) => {
  try {
    const allKbs = await db.select().from(knowledgeBases).orderBy(knowledgeBases.createdAt);

    const linkedAgents = await db
      .select({ kbId: agentKnowledgeBases.kbId, agentName: agents.name })
      .from(agentKnowledgeBases)
      .innerJoin(agents, eq(agentKnowledgeBases.agentId, agents.id));

    // Counts are aggregates, never stored counters.
    const [docCounts, chunkCounts] = await Promise.all([
      db.select({ kbId: documents.kbId, total: count(documents.id) }).from(documents).groupBy(documents.kbId),
      db.select({ kbId: chunks.kbId, total: count(chunks.id) }).from(chunks).groupBy(chunks.kbId),
    ]);

    const usedByKb = new Map<string, string[]>();
    for (const row of linkedAgents) {
      const list = usedByKb.get(row.kbId) ?? [];
      list.push(row.agentName);
      usedByKb.set(row.kbId, list);
    }

    const docsByKb = new Map(docCounts.map((r) => [r.kbId, Number(r.total)]));
    const chunksByKb = new Map(chunkCounts.map((r) => [r.kbId, Number(r.total)]));

    res.json(
      allKbs.map((kb) => ({
        id: kb.slug,
        name: kb.name,
        type: kb.type,
        source: kb.source,
        docs: docsByKb.get(kb.id) ?? 0,
        chunks: chunksByKb.get(kb.id) ?? 0,
        updated: (kb.lastSyncedAt ?? kb.updatedAt).toISOString(),
        usedBy: usedByKb.get(kb.id) ?? [],
        icon: kb.icon,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.post('/knowledge-bases', async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        type: z.enum(KB_TYPES).default('Raw corpus'),
        source: z.string().default('Uploads'),
        icon: z.string().default('FileText'),
      })
      .parse(req.body);

    const slug = slugify(body.name);
    if (!slug) throw new HttpError(400, 'Name must contain a letter or number.');

    const [clash] = await db
      .select({ id: knowledgeBases.id })
      .from(knowledgeBases)
      .where(eq(knowledgeBases.slug, slug));
    if (clash) throw new HttpError(409, `A knowledge base named "${body.name}" already exists.`);

    const [created] = await db
      .insert(knowledgeBases)
      .values({ slug, name: body.name, type: body.type, source: body.source, icon: body.icon })
      .returning({ slug: knowledgeBases.slug });

    res.status(201).json({ id: created!.slug });
  } catch (err) {
    next(err);
  }
});

router.patch('/knowledge-bases/:slug', async (req, res, next) => {
  try {
    const kb = await findKb(req.params.slug);
    const body = z
      .object({
        name: z.string().min(1).optional(),
        type: z.enum(KB_TYPES).optional(),
        source: z.string().optional(),
        icon: z.string().optional(),
      })
      .parse(req.body);

    await db
      .update(knowledgeBases)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(knowledgeBases.id, kb.id));

    res.json({ id: kb.slug });
  } catch (err) {
    next(err);
  }
});

router.delete('/knowledge-bases/:slug', async (req, res, next) => {
  try {
    const kb = await findKb(req.params.slug);
    // documents, chunks, notes and facts all cascade from the base.
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, kb.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Documents ────────────────────────────────────────────────────────────────

router.get('/knowledge-bases/:slug/documents', async (req, res, next) => {
  try {
    const kb = await findKb(req.params.slug);
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.kbId, kb.id))
      .orderBy(desc(documents.createdAt));

    // Grouped aggregate rather than a correlated subquery — the same pattern the
    // base list uses, and it actually correlates.
    const counts = await db
      .select({ documentId: chunks.documentId, total: count(chunks.id) })
      .from(chunks)
      .where(eq(chunks.kbId, kb.id))
      .groupBy(chunks.documentId);
    const chunksByDoc = new Map(counts.map((c) => [c.documentId, Number(c.total)]));

    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        sourceType: r.sourceType,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        status: r.status,
        error: r.error,
        chunks: chunksByDoc.get(r.id) ?? 0,
        created: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.post(
  '/knowledge-bases/:slug/documents',
  upload.array('files', 20),
  async (req, res, next) => {
    try {
      const kb = await findKb(String(req.params.slug));
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) throw new HttpError(400, 'Attach at least one file.');

      const results = [];
      for (const file of files) {
        results.push({
          name: file.originalname,
          ...(await ingestDocument({
            kbId: kb.id,
            name: file.originalname,
            sourceType: 'upload',
            mimeType: file.mimetype,
            sizeBytes: file.size,
            buffer: file.buffer,
          })),
        });
      }

      await db
        .update(knowledgeBases)
        .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
        .where(eq(knowledgeBases.id, kb.id));

      res.status(201).json({
        indexed: results.filter((r) => r.chunks > 0).length,
        chunks: results.reduce((sum, r) => sum + r.chunks, 0),
        // Surfaced so the UI can explain why search is keyword-only.
        embedded: results.some((r) => r.embedded),
        embeddingsAvailable: embeddingsAvailable(),
        documents: results,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/documents/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const [row] = await db.select({ id: documents.id }).from(documents).where(eq(documents.id, id));
    if (!row) throw new HttpError(404, 'Document not found');
    await db.delete(documents).where(eq(documents.id, row.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Memory layers ────────────────────────────────────────────────────────────

router.get('/memory/layers', async (_req, res, next) => {
  try {
    const [[docCount], [noteCount], [factCount], [coreCount], [lastPass]] = await Promise.all([
      db.select({ n: count(documents.id) }).from(documents),
      db.select({ n: count(notes.id) }).from(notes),
      db.select({ n: count(facts.id) }).from(facts).where(isNull(facts.supersededBy)),
      db.select({ n: count(coreMemory.id) }).from(coreMemory),
      db.select().from(distillationRuns).orderBy(desc(distillationRuns.startedAt)).limit(1),
    ]);

    res.json({
      layers: [
        {
          key: 'raw',
          title: 'Raw context',
          blurb: 'Everything dropped in as-is: docs, transcripts, exports, crawls.',
          count: Number(docCount!.n),
          unit: 'files',
        },
        {
          key: 'notes',
          title: 'Working notes',
          blurb: 'Agent-written summaries of each source, refreshed on every sync.',
          count: Number(noteCount!.n),
          unit: 'notes',
        },
        {
          key: 'distilled',
          title: 'Distilled facts',
          blurb: 'Deduped, conflict-checked statements the agents treat as truth.',
          count: Number(factCount!.n),
          unit: 'facts',
        },
        {
          key: 'core',
          title: 'Core memory',
          blurb: 'Always-in-prompt essentials: brand voice, ICP, non-negotiables.',
          count: Number(coreCount!.n),
          unit: 'entries',
        },
      ],
      lastDistillation: lastPass
        ? {
            status: lastPass.status,
            factsAdded: lastPass.factsAdded,
            conflictsResolved: lastPass.conflictsResolved,
            startedAt: lastPass.startedAt.toISOString(),
            finishedAt: lastPass.finishedAt?.toISOString() ?? null,
          }
        : null,
      embeddingsAvailable: embeddingsAvailable(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/memory/distill', async (req, res, next) => {
  try {
    const { kb } = z.object({ kb: z.string().nullish() }).parse(req.body ?? {});
    const kbId = kb ? (await findKb(kb)).id : undefined;
    res.json(await distill(kbId));
  } catch (err) {
    next(err);
  }
});

router.get('/memory/core', async (_req, res, next) => {
  try {
    const rows = await db.select().from(coreMemory).orderBy(desc(coreMemory.pinned));
    res.json(rows.map((r) => ({ id: r.id, key: r.key, value: r.value, pinned: r.pinned })));
  } catch (err) {
    next(err);
  }
});

router.put('/memory/core', async (req, res, next) => {
  try {
    const { entries } = z
      .object({
        entries: z
          .array(
            z.object({
              key: z.string().min(1),
              value: z.string().min(1),
              pinned: z.boolean().default(true),
            }),
          )
          .default([]),
      })
      .parse(req.body);

    await db.transaction(async (tx) => {
      await tx.delete(coreMemory);
      for (const entry of entries) {
        await tx.insert(coreMemory).values(entry);
      }
    });

    res.json({ entries: entries.length });
  } catch (err) {
    next(err);
  }
});

export default router;
