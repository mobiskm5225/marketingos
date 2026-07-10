import { Router, Request, Response } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../core/db';
import { linkedinPosts, linkedinCreatives, agentJobs } from '../core/db/schema';
import { runLinkedinCreatives } from '../agents/linkedin-creatives';
import { agentTriggerLimiter } from './agents';
import { logAudit } from '../core/audit';
import log from '../logger';

const router = Router();

// GET /api/linkedin/posts — newest first, with creative counts
router.get('/linkedin/posts', async (req: Request, res: Response) => {
  const limit  = Math.min(Math.max(parseInt(String(req.query.limit  || '50'), 10) || 50, 1), 200);
  const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

  const posts = await db
    .select({
      id:            linkedinPosts.id,
      title:         linkedinPosts.title,
      content:       linkedinPosts.content,
      source:        linkedinPosts.source,
      status:        linkedinPosts.status,
      errorMessage:  linkedinPosts.errorMessage,
      lastJobId:     linkedinPosts.lastJobId,
      createdAt:     linkedinPosts.createdAt,
      updatedAt:     linkedinPosts.updatedAt,
      creativeCount: sql<number>`(SELECT count(*) FROM linkedin_creatives c WHERE c.post_id = ${linkedinPosts.id})`,
    })
    .from(linkedinPosts)
    .orderBy(desc(linkedinPosts.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ posts });
});

// GET /api/linkedin/posts/:id — post + creative metadata (images fetched separately)
router.get('/linkedin/posts/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const [post] = await db.select().from(linkedinPosts).where(eq(linkedinPosts.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: 'Post not found' }); return; }

  const creatives = await db
    .select({
      id:          linkedinCreatives.id,
      variant:     linkedinCreatives.variant,
      concept:     linkedinCreatives.concept,
      imagePrompt: linkedinCreatives.imagePrompt,
      caption:     linkedinCreatives.caption,
      costUsd:     linkedinCreatives.costUsd,
      createdAt:   linkedinCreatives.createdAt,
    })
    .from(linkedinCreatives)
    .where(eq(linkedinCreatives.postId, id))
    .orderBy(desc(linkedinCreatives.createdAt), linkedinCreatives.variant);

  res.json({ post, creatives });
});

// GET /api/linkedin/creatives/:id/image — PNG binary
router.get('/linkedin/creatives/:id/image', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const [creative] = await db
    .select({ imageB64: linkedinCreatives.imageB64 })
    .from(linkedinCreatives)
    .where(eq(linkedinCreatives.id, id))
    .limit(1);

  if (!creative?.imageB64) { res.status(404).json({ error: 'Image not found' }); return; }

  const buf = Buffer.from(creative.imageB64, 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', buf.length);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.send(buf);
});

// POST /api/linkedin/posts/:id/generate — (re)run creative generation
router.post('/linkedin/posts/:id/generate', agentTriggerLimiter, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const [post] = await db.select().from(linkedinPosts).where(eq(linkedinPosts.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: 'Post not found' }); return; }

  if (post.status === 'generating') {
    res.status(409).json({ error: 'Creative generation is already running for this post' });
    return;
  }

  try {
    const [job] = await db
      .insert(agentJobs)
      .values({
        agentName: 'linkedin-creatives',
        title: post.title ?? post.content.slice(0, 120),
        status: 'pending',
        source: 'api',
      })
      .returning();

    await db.update(linkedinPosts).set({ lastJobId: job.id, updatedAt: new Date() }).where(eq(linkedinPosts.id, id));

    res.json({ jobId: job.id, status: 'accepted' });
    await logAudit(req.user!.userId, req.user!.username, 'linkedin.generate', 'linkedin_post', id, { jobId: job.id });

    runLinkedinCreatives(id, job.id).catch((err: Error) => {
      log.error({ postId: id, jobId: job.id, err: err.message }, 'LinkedIn creatives rerun failed');
    });
  } catch (err: any) {
    log.error({ postId: id, err: err.message }, 'Failed to start LinkedIn generation');
    res.status(500).json({ error: 'Failed to start generation' });
  }
});

export default router;
