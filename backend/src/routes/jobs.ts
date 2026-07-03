import { Router } from 'express';
import { db } from '../core/db';
import { agentJobs, agentResults } from '../core/db/schema';
import { eq, desc, sql, count, sum, and, ilike } from 'drizzle-orm';

const router = Router();

router.get('/jobs', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);
    const agentFilter = req.query.agent as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const q = req.query.q as string | undefined;

    const conditions: ReturnType<typeof eq>[] = [];
    if (agentFilter) conditions.push(eq(agentJobs.agentName, agentFilter));
    if (statusFilter) conditions.push(eq(agentJobs.status, statusFilter as any));
    if (q)           conditions.push(ilike(agentJobs.title, `%${q}%`) as any);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const selectFields = {
      id: agentJobs.id,
      agentName: agentJobs.agentName,
      notionPageId: agentJobs.notionPageId,
      title: agentJobs.title,
      status: agentJobs.status,
      inputTokens: agentJobs.inputTokens,
      outputTokens: agentJobs.outputTokens,
      costUsd: agentJobs.costUsd,
      errorMessage: agentJobs.errorMessage,
      source: agentJobs.source,
      createdAt: agentJobs.createdAt,
      updatedAt: agentJobs.updatedAt,
    };

    const [jobs, [totals]] = await Promise.all([
      db.select(selectFields).from(agentJobs).where(where).orderBy(desc(agentJobs.createdAt)).limit(limit).offset(offset),
      db.select({ total: count(agentJobs.id) }).from(agentJobs).where(where),
    ]);

    res.json({ jobs, limit, offset, total: Number(totals.total) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const [job] = await db
      .select()
      .from(agentJobs)
      .where(eq(agentJobs.id, req.params.id));

    if (!job) { res.status(404).json({ error: 'Not found' }); return; }

    const results = await db
      .select()
      .from(agentResults)
      .where(eq(agentResults.jobId, req.params.id));

    res.json({ ...job, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    // Total counts and cost
    const [totals] = await db
      .select({
        total: count(agentJobs.id),
        totalCost: sum(agentJobs.costUsd),
      })
      .from(agentJobs);

    // Count by status
    const byStatus = await db
      .select({
        status: agentJobs.status,
        cnt: count(agentJobs.id),
      })
      .from(agentJobs)
      .groupBy(agentJobs.status);

    // Count by agent
    const byAgent = await db
      .select({
        agentName: agentJobs.agentName,
        cnt: count(agentJobs.id),
        cost: sum(agentJobs.costUsd),
      })
      .from(agentJobs)
      .groupBy(agentJobs.agentName);

    // This month's cost
    const [monthCost] = await db
      .select({ cost: sum(agentJobs.costUsd) })
      .from(agentJobs)
      .where(sql`created_at >= date_trunc('month', now())`);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((r: any) => { statusMap[r.status] = Number(r.cnt); });

    const agentMap: Record<string, { jobs: number; costUsd: number }> = {};
    byAgent.forEach((r: any) => {
      agentMap[r.agentName] = {
        jobs: Number(r.cnt),
        costUsd: Number(r.cost ?? 0),
      };
    });

    const total = Number(totals.total);
    const errorCount = statusMap['error'] ?? 0;

    res.json({
      totalJobs: total,
      totalCostUsd: Number(totals.totalCost ?? 0),
      thisMonthCostUsd: Number(monthCost.cost ?? 0),
      errorRate: total > 0 ? Math.round((errorCount / total) * 100) : 0,
      byStatus: statusMap,
      byAgent: agentMap,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
