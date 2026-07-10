import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { ingestAuth } from '../middleware/auth';
import { createDatabaseEntry } from '../core/notion/writer';
import { agentRegistry } from '../registry';
import { db } from '../core/db';
import { agentJobs, blogDrafts, linkedinPosts } from '../core/db/schema';
import { runLinkedinCreatives } from '../agents/linkedin-creatives';
import log from '../logger';

const router = Router();

const NOTION_DB_ID = (process.env.NOTION_DATABASE_ID ?? '').replace(/-/g, '');

router.post('/ingest', ingestAuth, async (req: Request, res: Response) => {
  const { title, content } = req.body ?? {};

  if (!title || !content) {
    res.status(400).json({ error: 'title and content required' });
    return;
  }

  try {
    const page = await createDatabaseEntry(NOTION_DB_ID, title, content, 'SEO Status', 'Pending');
    log.info({ pageId: page.id, title }, 'Ingest: created blog page');

    const agent = agentRegistry.get(NOTION_DB_ID);
    if (!agent) {
      res.status(500).json({ error: 'No agent registered for SEO database' });
      return;
    }

    const [job] = await db
      .insert(agentJobs)
      .values({
        agentName: agent.agentName,
        notionPageId: page.id,
        title,
        status: 'pending',
        source: 'ingest',
      })
      .returning();

    res.json({ status: 'accepted', pageId: page.id, jobId: job.id });

    agent.run(page.id, job.id, 'ingest').catch((err: Error) => {
      log.error({ pageId: page.id, jobId: job.id, err: err.message }, 'Ingest agent run failed');
    });

  } catch (err: any) {
    log.error({ err: err.message }, 'Ingest failed');
    res.status(500).json({ error: err.message });
  }
});

// POST /ingest/blog-draft — Go routines push new blog drafts here
router.post('/ingest/blog-draft', ingestAuth, async (req: Request, res: Response) => {
  const { title, content, url, source } = req.body ?? {};

  if (!title) {
    res.status(400).json({ error: 'title required' });
    return;
  }

  try {
    const [draft] = await db
      .insert(blogDrafts)
      .values({ title, content: content ?? null, url: url ?? null, source: source ?? 'go-routine' })
      .returning();

    log.info({ draftId: draft.id, title }, 'Blog draft ingested via Go routine');
    res.json({ id: draft.id, title: draft.title, status: draft.status, createdAt: draft.createdAt });
  } catch (err: any) {
    log.error({ err: err.message }, 'Blog draft ingest failed');
    res.status(500).json({ error: err.message });
  }
});

// POST /ingest/linkedin — Claude routines push LinkedIn post content here.
// Stores the post, then generates creative image variations asynchronously.
router.post('/ingest/linkedin', ingestAuth, async (req: Request, res: Response) => {
  const { title, content, source } = req.body ?? {};

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  try {
    const [post] = await db
      .insert(linkedinPosts)
      .values({
        title: title ?? null,
        content: content.trim(),
        source: source ?? 'claude-routine',
        status: 'pending',
      })
      .returning();

    const [job] = await db
      .insert(agentJobs)
      .values({
        agentName: 'linkedin-creatives',
        title: title ?? content.trim().slice(0, 120),
        status: 'pending',
        source: 'ingest',
      })
      .returning();

    await db.update(linkedinPosts).set({ lastJobId: job.id }).where(eq(linkedinPosts.id, post.id));

    log.info({ postId: post.id, jobId: job.id }, 'LinkedIn post ingested');
    res.json({ status: 'accepted', postId: post.id, jobId: job.id });

    runLinkedinCreatives(post.id, job.id).catch((err: Error) => {
      log.error({ postId: post.id, jobId: job.id, err: err.message }, 'LinkedIn creatives run failed');
    });

  } catch (err: any) {
    log.error({ err: err.message }, 'LinkedIn ingest failed');
    res.status(500).json({ error: err.message });
  }
});

export default router;
