import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../core/db';
import { runs, agents, runComments, runAttachments, runStages, runEvents } from '../core/db/schema';
import { eq, desc, inArray, asc } from 'drizzle-orm';
import { formatDuration, formatBytes, initialsFor } from '../lib/format';
import { HttpError } from '../middleware/error';
import { createAndExecuteRun } from '../core/agent/runner';
import { onRunEvent } from '../core/agent/emitter';

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
    duration: run.status === 'running' || run.status === 'pending'
      ? 'running…'
      : formatDuration(run.durationMs),
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

    // Also include stages and events for the detail view
    const stages = await db
      .select()
      .from(runStages)
      .where(eq(runStages.runId, rows[0]!.run.id))
      .orderBy(asc(runStages.position));

    const events = await db
      .select()
      .from(runEvents)
      .where(eq(runEvents.runId, rows[0]!.run.id))
      .orderBy(asc(runEvents.createdAt));

    res.json({
      ...decorated,
      stages: stages.map((s) => ({
        id: s.id,
        name: s.name,
        position: s.position,
        status: s.status,
        attempt: s.attempt,
        model: s.model,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        costUsd: s.costUsd,
        output: s.output,
        error: s.error,
        startedAt: s.startedAt?.toISOString() ?? null,
        finishedAt: s.finishedAt?.toISOString() ?? null,
      })),
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        message: e.message,
        time: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Execute ──────────────────────────────────────────────────────────────────

const createRunSchema = z.object({
  agentSlug: z.string().min(1),
  title: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

router.post('/runs', async (req, res, next) => {
  try {
    const body = createRunSchema.parse(req.body);
    const run = await createAndExecuteRun({
      agentSlug: body.agentSlug,
      title: body.title,
      input: body.input,
    });
    res.status(201).json({ id: run.slug, slug: run.slug });
  } catch (err) {
    next(err);
  }
});

// ─── SSE stream ───────────────────────────────────────────────────────────────

router.get('/runs/:slug/events', async (req, res, next) => {
  try {
    const run = await findRun(String(req.params.slug));

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx
    });

    // Send existing events as catch-up
    const existingEvents = await db
      .select()
      .from(runEvents)
      .where(eq(runEvents.runId, run.id))
      .orderBy(asc(runEvents.createdAt));

    for (const event of existingEvents) {
      res.write(
        `data: ${JSON.stringify({ type: event.type, message: event.message, time: event.createdAt.toISOString() })}\n\n`,
      );
    }

    // If the run is already finished, close immediately
    if (['complete', 'error', 'needs review'].includes(run.status)) {
      res.write(`data: ${JSON.stringify({ type: 'stream_end', message: 'Run already finished' })}\n\n`);
      res.end();
      return;
    }

    // Subscribe to live events
    const cleanup = onRunEvent(run.id, (event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === 'run_complete' || event.type === 'run_error') {
          res.write(`data: ${JSON.stringify({ type: 'stream_end' })}\n\n`);
          res.end();
        }
      } catch {
        // Client disconnected
      }
    });

    // Keep-alive ping every 15s
    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 15_000);

    req.on('close', () => {
      cleanup();
      clearInterval(keepAlive);
    });
  } catch (err) {
    next(err);
  }
});

// ─── Re-run ───────────────────────────────────────────────────────────────────

const rerunSchema = z.object({
  title: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

router.post('/runs/:slug/rerun', async (req, res, next) => {
  try {
    const original = await findRun(String(req.params.slug));
    const body = rerunSchema.parse(req.body);

    // Look up the agent slug
    const [agent] = await db.select({ slug: agents.slug }).from(agents).where(eq(agents.id, original.agentId));
    if (!agent) throw new HttpError(404, 'Agent no longer exists');

    const mergedInput = {
      ...((original.input ?? {}) as Record<string, unknown>),
      ...(body.input ?? {}),
    };

    const run = await createAndExecuteRun({
      agentSlug: agent.slug,
      title: body.title ?? `Re-run: ${original.title}`,
      input: mergedInput,
      parentRunId: original.id,
    });

    res.status(201).json({ id: run.slug, slug: run.slug });
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
