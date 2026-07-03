import { Router } from 'express';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { db } from '../core/db';
import { jobReviews, agentJobs } from '../core/db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { logAudit } from '../core/audit';

const router = Router();

// Agent → review group mapping
export const AGENT_REVIEW_GROUP: Record<string, string> = {
  'seo-analyzer':  'seo-analysts',
  'blog-reviewer': 'seo-analysts',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function userGroups(req: any): string[] {
  return (req.user?.groupMemberships ?? []).map((m: any) => m.group);
}

function isManagerInGroup(req: any, groupName: string): boolean {
  const perms: string[] = req.user?.permissions ?? [];
  if (perms.includes('*')) return true;
  const memberships: any[] = req.user?.groupMemberships ?? [];
  return memberships.some(m => m.group === groupName && m.role === 'manager');
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/reviews — queue for current user's groups (pending_review + under_review + reviewed)
router.get('/reviews', requireAuth, async (req, res) => {
  const perms: string[] = req.user?.permissions ?? [];
  const isAdmin = perms.includes('*');
  const groups = userGroups(req);

  if (!isAdmin && groups.length === 0) {
    res.json({ reviews: [] });
    return;
  }

  const statusFilter = ['pending_review', 'under_review', 'reviewed', 'approved', 'rejected', 'needs_changes'];
  const qStatusParam = req.query.status as string | undefined;
  const statuses = qStatusParam ? [qStatusParam] : statusFilter;

  let rows = await db
    .select({
      review: jobReviews,
      jobTitle:     agentJobs.title,
      jobAgentName: agentJobs.agentName,
      jobStatus:    agentJobs.status,
    })
    .from(jobReviews)
    .innerJoin(agentJobs, eq(agentJobs.id, jobReviews.jobId))
    .where(inArray(jobReviews.status, statuses))
    .orderBy(desc(jobReviews.createdAt))
    .limit(100);

  if (!isAdmin) {
    rows = rows.filter(r => groups.includes(r.review.groupName));
  }

  res.json({
    reviews: rows.map(r => ({
      ...r.review,
      jobTitle:     r.jobTitle,
      jobAgentName: r.jobAgentName,
      jobStatus:    r.jobStatus,
    })),
  });
});

// GET /api/jobs/:id/review
router.get('/jobs/:id/review', requireAuth, async (req, res) => {
  const [review] = await db
    .select()
    .from(jobReviews)
    .where(eq(jobReviews.jobId, String(req.params.id)))
    .limit(1);

  if (!review) {
    res.status(404).json({ error: 'No review record for this job' });
    return;
  }
  res.json({ review });
});

// POST /api/jobs/:id/review/claim — member claims the review
router.post('/jobs/:id/review/claim', requireAuth, requirePermission('jobs:review'), async (req, res) => {
  const jobId = String(req.params.id);
  const [review] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId)).limit(1);

  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }

  const groups = userGroups(req);
  if (!req.user!.permissions.includes('*') && !groups.includes(review.groupName)) {
    res.status(403).json({ error: 'Not a member of the group responsible for this review' });
    return;
  }

  // Atomic claim: WHERE includes status check to prevent race conditions
  const claimed = await db.update(jobReviews).set({
    status:       'under_review',
    reviewerId:   req.user!.userId === 'env-admin' ? undefined : req.user!.userId,
    reviewerName: req.user!.username,
    updatedAt:    new Date(),
  }).where(
    and(
      eq(jobReviews.jobId, jobId),
      inArray(jobReviews.status, ['pending_review', 'needs_changes'])
    )
  ).returning();

  if (claimed.length === 0) {
    res.status(409).json({ error: `Cannot claim — review is already ${review.status}` });
    return;
  }

  await logAudit(req.user!.userId, req.user!.username, 'job.review.claimed', 'job', jobId);
  res.json({ review: claimed[0] });
});

// POST /api/jobs/:id/review/submit — member submits review note
router.post('/jobs/:id/review/submit', requireAuth, requirePermission('jobs:review'), async (req, res) => {
  const jobId = String(req.params.id);
  const { reviewNote } = req.body ?? {};
  if (!reviewNote?.trim()) {
    res.status(400).json({ error: 'reviewNote is required' });
    return;
  }

  const [review] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId)).limit(1);
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  if (review.status !== 'under_review') {
    res.status(409).json({ error: `Cannot submit — claim the review first` });
    return;
  }
  if (review.reviewerId && review.reviewerId !== req.user!.userId && !req.user!.permissions.includes('*')) {
    res.status(403).json({ error: 'This review was claimed by another reviewer' });
    return;
  }

  await db.update(jobReviews).set({
    status:      'reviewed',
    reviewNote,
    reviewedAt:  new Date(),
    updatedAt:   new Date(),
  }).where(eq(jobReviews.jobId, jobId));

  await logAudit(req.user!.userId, req.user!.username, 'job.review.submitted', 'job', jobId, { note: reviewNote });
  const [updated] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId));
  res.json({ review: updated });
});

// POST /api/jobs/:id/review/approve — manager approves
router.post('/jobs/:id/review/approve', requireAuth, requirePermission('jobs:approve'), async (req, res) => {
  const jobId = String(req.params.id);
  const { leadComment } = req.body ?? {};

  const [review] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId)).limit(1);
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  if (review.status !== 'reviewed') {
    res.status(409).json({ error: `Cannot approve — status is ${review.status}. Reviewer must submit first.` });
    return;
  }
  if (!isManagerInGroup(req, review.groupName)) {
    res.status(403).json({ error: 'Must be a manager in the responsible group to approve' });
    return;
  }

  await db.update(jobReviews).set({
    status:      'approved',
    leadId:      req.user!.userId === 'env-admin' ? undefined : req.user!.userId,
    leadName:    req.user!.username,
    leadComment: leadComment ?? null,
    decidedAt:   new Date(),
    updatedAt:   new Date(),
  }).where(eq(jobReviews.jobId, jobId));

  await logAudit(req.user!.userId, req.user!.username, 'job.review.approved', 'job', jobId, { comment: leadComment });
  const [updated] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId));
  res.json({ review: updated });
});

// POST /api/jobs/:id/review/reject — manager rejects
router.post('/jobs/:id/review/reject', requireAuth, requirePermission('jobs:approve'), async (req, res) => {
  const jobId = String(req.params.id);
  const { leadComment } = req.body ?? {};

  const [review] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId)).limit(1);
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  if (!['reviewed', 'under_review'].includes(review.status)) {
    res.status(409).json({ error: `Cannot reject — status is ${review.status}` });
    return;
  }
  if (!isManagerInGroup(req, review.groupName)) {
    res.status(403).json({ error: 'Must be a manager in the responsible group to reject' });
    return;
  }

  await db.update(jobReviews).set({
    status:      'rejected',
    leadId:      req.user!.userId === 'env-admin' ? undefined : req.user!.userId,
    leadName:    req.user!.username,
    leadComment: leadComment ?? null,
    decidedAt:   new Date(),
    updatedAt:   new Date(),
  }).where(eq(jobReviews.jobId, jobId));

  await logAudit(req.user!.userId, req.user!.username, 'job.review.rejected', 'job', jobId, { comment: leadComment });
  const [updated] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId));
  res.json({ review: updated });
});

// POST /api/jobs/:id/review/needs-changes — manager sends back
router.post('/jobs/:id/review/needs-changes', requireAuth, requirePermission('jobs:approve'), async (req, res) => {
  const jobId = String(req.params.id);
  const { leadComment } = req.body ?? {};
  if (!leadComment?.trim()) {
    res.status(400).json({ error: 'leadComment required when requesting changes' });
    return;
  }

  const [review] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId)).limit(1);
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  if (review.status !== 'reviewed') {
    res.status(409).json({ error: `Cannot request changes — status is ${review.status}` });
    return;
  }
  if (!isManagerInGroup(req, review.groupName)) {
    res.status(403).json({ error: 'Must be a manager in the responsible group' });
    return;
  }

  await db.update(jobReviews).set({
    status:      'needs_changes',
    leadId:      req.user!.userId === 'env-admin' ? undefined : req.user!.userId,
    leadName:    req.user!.username,
    leadComment,
    decidedAt:   new Date(),
    reviewNote:  null,
    reviewedAt:  null,
    reviewerId:  null,
    reviewerName: null,
    updatedAt:   new Date(),
  }).where(eq(jobReviews.jobId, jobId));

  await logAudit(req.user!.userId, req.user!.username, 'job.review.needs_changes', 'job', jobId, { comment: leadComment });
  const [updated] = await db.select().from(jobReviews).where(eq(jobReviews.jobId, jobId));
  res.json({ review: updated });
});

export default router;
