import { Router, Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../core/db';
import { blogDrafts, agentJobs } from '../core/db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { logAudit } from '../core/audit';
import { syncBlogTracker } from '../core/blog-tracker-sync';
import { runSeoAnalyzerForDraft } from '../agents/seo-analyzer';
import { agentTriggerLimiter } from './agents';
import log from '../logger';

const router = Router();
const PERM = 'blog-drafts:manage';
const VALID_STATUSES = ['pending', 'in_review', 'approved', 'rejected'] as const;

// POST /api/blog-drafts/sync — pull all pages from the Notion Blog Tracker
router.post('/blog-drafts/sync', requireAuth, requirePermission(PERM), async (req: Request, res: Response) => {
  try {
    const result = await syncBlogTracker();
    await logAudit(
      req.user!.userId, req.user!.username,
      'blog-draft.sync', 'blog_draft', undefined,
      { ...result },
    );
    res.json(result);
  } catch (err: any) {
    log.error({ err: err.message }, 'Blog Tracker sync failed');
    res.status(500).json({ error: err.message ?? 'Sync failed' });
  }
});

// GET /api/blog-drafts
router.get('/blog-drafts', requireAuth, requirePermission(PERM), async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const limitNum = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
  const offsetNum = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

  if (status && !VALID_STATUSES.includes(status as any)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }

  const rows = await db
    .select()
    .from(blogDrafts)
    .where(status ? eq(blogDrafts.status, status) : undefined)
    .orderBy(desc(blogDrafts.createdAt))
    .limit(limitNum)
    .offset(offsetNum);

  res.json({ drafts: rows });
});

// POST /api/blog-drafts/:id/analyze — run SEO Analyzer on a draft.
// Result lands in agent_results + as an "SEO Analysis" child page under the
// draft's Notion tracker row.
router.post('/blog-drafts/:id/analyze',
  requireAuth,
  requirePermission('agents:trigger:seo-analyzer'),
  agentTriggerLimiter,
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const [draft] = await db.select().from(blogDrafts).where(eq(blogDrafts.id, id)).limit(1);
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }

    const wordCount = draft.content ? draft.content.trim().split(/\s+/).length : 0;
    if (wordCount < 300) {
      res.status(400).json({ error: `Draft content too short for SEO analysis (${wordCount} words, need 300+). Sync the full draft from Notion first.` });
      return;
    }

    // One active analysis per draft
    if (draft.lastSeoJobId) {
      const [lastJob] = await db
        .select({ status: agentJobs.status })
        .from(agentJobs)
        .where(eq(agentJobs.id, draft.lastSeoJobId))
        .limit(1);
      if (lastJob && (lastJob.status === 'pending' || lastJob.status === 'processing')) {
        res.status(409).json({ error: 'An SEO analysis is already running for this draft' });
        return;
      }
    }

    try {
      const [job] = await db
        .insert(agentJobs)
        .values({
          agentName: 'seo-analyzer',
          notionPageId: draft.notionPageId,
          title: draft.title,
          status: 'pending',
          source: 'blog-draft',
        })
        .returning();

      await db.update(blogDrafts)
        .set({ lastSeoJobId: job.id, updatedAt: new Date() })
        .where(eq(blogDrafts.id, id));

      res.json({ jobId: job.id, status: 'accepted' });
      await logAudit(req.user!.userId, req.user!.username, 'blog-draft.analyze', 'blog_draft', id, { jobId: job.id, title: draft.title });

      runSeoAnalyzerForDraft({
        id: draft.id,
        title: draft.title,
        content: draft.content!,
        url: draft.url,
        seoKeywords: draft.seoKeywords,
        notionPageId: draft.notionPageId,
      }, job.id).catch((err: Error) => {
        log.error({ draftId: id, jobId: job.id, err: err.message }, 'Draft SEO analysis failed');
      });
    } catch (err: any) {
      log.error({ draftId: id, err: err.message }, 'Failed to create draft analysis job');
      res.status(500).json({ error: 'Failed to start analysis' });
    }
  });

// GET /api/blog-drafts/:id
router.get('/blog-drafts/:id', requireAuth, requirePermission(PERM), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const [draft] = await db.select().from(blogDrafts).where(eq(blogDrafts.id, id)).limit(1);
  if (!draft) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ draft });
});

// PATCH /api/blog-drafts/:id — update status + review note
router.patch('/blog-drafts/:id', requireAuth, requirePermission(PERM), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status, reviewNote } = req.body as { status?: string; reviewNote?: string };

  if (status && !VALID_STATUSES.includes(status as any)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }

  const now = new Date();
  const update: Record<string, unknown> = { updatedAt: now };

  if (status)                update.status       = status;
  if (reviewNote !== undefined) update.reviewNote = reviewNote;

  if (status && status !== 'pending') {
    update.reviewerId   = req.user!.userId;
    update.reviewerName = req.user!.username;
    if (status === 'approved' || status === 'rejected') update.reviewedAt = now;
  }

  const [updated] = await db
    .update(blogDrafts)
    .set(update)
    .where(eq(blogDrafts.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: 'Not found' }); return; }

  await logAudit(
    req.user!.userId, req.user!.username,
    `blog-draft.${status ?? 'updated'}`,
    'blog_draft', id,
    { status, reviewNote },
  );

  res.json({ draft: updated });
});

export default router;
