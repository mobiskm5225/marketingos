import { Router, Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../core/db';
import { blogDrafts } from '../core/db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { logAudit } from '../core/audit';

const router = Router();
const PERM = 'blog-drafts:manage';
const VALID_STATUSES = ['pending', 'in_review', 'approved', 'rejected'] as const;

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
