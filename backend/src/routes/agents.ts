import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../core/db';
import { agentJobs } from '../core/db/schema';
import { runSeoAnalyzerDirect } from '../agents/seo-analyzer';
import { runBlogReviewerDirect } from '../agents/blog-reviewer';
import { requirePermission } from '../middleware/requirePermission';
import { logAudit } from '../core/audit';
import log from '../logger';

const router = Router();

export const agentTriggerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.userId ?? req.ip ?? 'unknown',
  message: { error: 'Agent trigger limit reached. Maximum 20 triggers per hour per user.' },
});

// POST /api/agents/seo-analyzer
// Body: { title: string, content: string, url?: string }
router.post('/agents/seo-analyzer', requirePermission('agents:trigger:seo-analyzer'), agentTriggerLimiter, async (req: Request, res: Response) => {
  const { title, content, url } = req.body ?? {};

  if (!title || !content) {
    res.status(400).json({ error: 'title and content are required' });
    return;
  }

  try {
    const [job] = await db
      .insert(agentJobs)
      .values({
        agentName: 'seo-analyzer',
        title,
        status: 'pending',
        source: 'api',
      })
      .returning();

    res.json({ jobId: job.id, status: 'accepted' });
    logAudit(req.user!.userId, req.user!.username, 'agent.trigger', 'job', job.id, { agent: 'seo-analyzer', title });

    runSeoAnalyzerDirect(title, content, url, job.id).catch((err: Error) => {
      log.error({ jobId: job.id, err: err.message }, 'SEO Analyzer direct run failed');
    });

  } catch (err: any) {
    log.error({ err: err.message }, 'Failed to create SEO Analyzer job');
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/blog-reviewer
// Body: { title: string, url: string }
router.post('/agents/blog-reviewer', requirePermission('agents:trigger:blog-reviewer'), agentTriggerLimiter, async (req: Request, res: Response) => {
  const { title, url } = req.body ?? {};

  if (!title || !url) {
    res.status(400).json({ error: 'title and url are required' });
    return;
  }

  try {
    const [job] = await db
      .insert(agentJobs)
      .values({
        agentName: 'blog-reviewer',
        title,
        status: 'pending',
        source: 'api',
      })
      .returning();

    res.json({ jobId: job.id, status: 'accepted' });
    logAudit(req.user!.userId, req.user!.username, 'agent.trigger', 'job', job.id, { agent: 'blog-reviewer', title });

    runBlogReviewerDirect(title, url, job.id).catch((err: Error) => {
      log.error({ jobId: job.id, err: err.message }, 'Blog Reviewer direct run failed');
    });

  } catch (err: any) {
    log.error({ err: err.message }, 'Failed to create Blog Reviewer job');
    res.status(500).json({ error: err.message });
  }
});

export default router;
