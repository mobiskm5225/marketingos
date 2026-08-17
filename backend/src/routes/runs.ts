import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../core/db';
import { runs, agents, runComments, runAttachments } from '../core/db/schema';
import { eq, desc, inArray, asc } from 'drizzle-orm';
import { formatDuration, formatBytes, initialsFor } from '../lib/format';
import { HttpError } from '../middleware/error';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

/** Attachments live on disk; the database stores only the generated filename. */
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

type RunRow = typeof runs.$inferSelect;

/**
 * Comments and attachments live in their own tables now, so both endpoints load
 * them for the runs they are returning and attach them here. Shapes match
 * frontend/src/lib/api.ts exactly.
 */
async function decorate(rows: { run: RunRow; agentName: string }[]) {
  if (rows.length === 0) return [];
  const runIds = rows.map((r) => r.run.id);

  const comments = await db
    .select()
    .from(runComments)
    .where(inArray(runComments.runId, runIds))
    .orderBy(asc(runComments.createdAt));

  const attachments = await db
    .select()
    .from(runAttachments)
    .where(inArray(runAttachments.runId, runIds))
    .orderBy(asc(runAttachments.createdAt));

  const commentsByRun = new Map<string, unknown[]>();
  for (const c of comments) {
    const list = commentsByRun.get(c.runId) ?? [];
    list.push({
      id: c.id,
      author: c.author,
      initials: c.initials,
      time: c.createdAt.toISOString(),
      body: c.body,
      ...(c.anchor ? { anchor: c.anchor } : {}),
    });
    commentsByRun.set(c.runId, list);
  }

  const attachmentsByRun = new Map<string, unknown[]>();
  for (const a of attachments) {
    const list = attachmentsByRun.get(a.runId) ?? [];
    list.push({ name: a.name, kind: a.kind, size: formatBytes(a.sizeBytes) });
    attachmentsByRun.set(a.runId, list);
  }

  return rows.map(({ run, agentName }) => ({
    id: run.slug,
    title: run.title,
    agent: agentName,
    status: run.status,
    started: run.startedAt.toISOString(),
    // A run still in flight has no duration to report yet.
    duration: run.status === 'running' ? 'running…' : formatDuration(run.durationMs),
    model: run.model ?? '',
    summary: run.summary,
    metrics: run.metrics,
    sections: run.sections,
    sources: run.sources,
    attachments: attachmentsByRun.get(run.id) ?? [],
    comments: commentsByRun.get(run.id) ?? [],
  }));
}

router.get('/runs', async (_req, res, next) => {
  try {
    const rows = await db
      .select({ run: runs, agentName: agents.name })
      .from(runs)
      .innerJoin(agents, eq(runs.agentId, agents.id))
      .orderBy(desc(runs.createdAt));

    res.json(await decorate(rows));
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:slug', async (req, res, next) => {
  try {
    const rows = await db
      .select({ run: runs, agentName: agents.name })
      .from(runs)
      .innerJoin(agents, eq(runs.agentId, agents.id))
      .where(eq(runs.slug, req.params.slug));

    if (rows.length === 0) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    const [decorated] = await decorate(rows);
    res.json(decorated);
  } catch (err) {
    next(err);
  }
});

// ─── Review ───────────────────────────────────────────────────────────────────

async function findRun(slug: string) {
  const [row] = await db.select().from(runs).where(eq(runs.slug, slug));
  if (!row) throw new HttpError(404, 'Run not found');
  return row;
}

router.post('/runs/:slug/comments', async (req, res, next) => {
  try {
    const run = await findRun(String(req.params.slug));
    const { body, author, anchor } = z
      .object({
        body: z.string().min(1, 'A comment needs some text.'),
        author: z.string().default('You'),
        anchor: z.string().nullish(),
      })
      .parse(req.body);

    const [created] = await db
      .insert(runComments)
      .values({
        runId: run.id,
        author,
        initials: initialsFor(author),
        body,
        anchor: anchor ?? null,
      })
      .returning();

    res.status(201).json({
      id: created!.id,
      author: created!.author,
      initials: created!.initials,
      time: created!.createdAt.toISOString(),
      body: created!.body,
      ...(created!.anchor ? { anchor: created!.anchor } : {}),
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/runs/:slug/comments/:id', async (req, res, next) => {
  try {
    await findRun(String(req.params.slug));
    await db.delete(runComments).where(eq(runComments.id, String(req.params.id)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:slug/attachments', upload.array('files', 10), async (req, res, next) => {
  try {
    const run = await findRun(String(req.params.slug));
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw new HttpError(400, 'Attach at least one file.');

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const saved = [];
    for (const file of files) {
      // Generated name, never the client's — an uploaded filename must not be
      // able to steer where the file lands on disk.
      const storedName = `${randomUUID()}${path.extname(file.originalname).slice(0, 10)}`;
      await fs.writeFile(path.join(UPLOAD_DIR, storedName), file.buffer);

      const [row] = await db
        .insert(runAttachments)
        .values({
          runId: run.id,
          name: file.originalname,
          kind: kindFor(file.mimetype, file.originalname),
          sizeBytes: file.size,
          storagePath: storedName,
        })
        .returning();

      saved.push({ name: row!.name, kind: row!.kind, size: formatBytes(row!.sizeBytes) });
    }

    res.status(201).json({ attachments: saved });
  } catch (err) {
    next(err);
  }
});

function kindFor(mimeType: string, name: string): 'image' | 'pdf' | 'doc' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) return 'pdf';
  return 'doc';
}

router.delete('/runs/:slug', async (req, res, next) => {
  try {
    const run = await findRun(String(req.params.slug));
    await db.delete(runs).where(eq(runs.id, run.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
