import { Router } from 'express';
import { db } from '../core/db';
import { agents, agentKnowledgeBases, knowledgeBases, runs } from '../core/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

const router = Router();

router.get('/agents', async (req, res) => {
  try {
    // 1. Fetch all agents
    const allAgents = await db
      .select()
      .from(agents)
      .orderBy(agents.createdAt);

    // 2. Fetch linked knowledge bases for each agent
    const agentKbs = await db
      .select({
        agentId: agentKnowledgeBases.agentId,
        kbName: knowledgeBases.name,
      })
      .from(agentKnowledgeBases)
      .innerJoin(knowledgeBases, eq(agentKnowledgeBases.kbId, knowledgeBases.id));

    // 3. Compute runs stats per agent
    const stats = await db
      .select({
        agentId: runs.agentId,
        totalRuns: count(runs.id),
        lastRunAt: sql<string>`MAX(${runs.createdAt})`,
        successCount: sql<number>`SUM(CASE WHEN ${runs.status} = 'complete' THEN 1 ELSE 0 END)`,
      })
      .from(runs)
      .groupBy(runs.agentId);

    // Group KB names by agent
    const kbsByAgent: Record<string, string[]> = {};
    for (const row of agentKbs) {
      if (!kbsByAgent[row.agentId]) {
        kbsByAgent[row.agentId] = [];
      }
      kbsByAgent[row.agentId].push(row.kbName);
    }

    // Group stats by agent
    const statsByAgent: Record<string, any> = {};
    for (const row of stats) {
      statsByAgent[row.agentId] = {
        runs: Number(row.totalRuns),
        successRate: row.totalRuns > 0 ? Math.round((Number(row.successCount) / Number(row.totalRuns)) * 100) : 0,
        lastRun: row.lastRunAt, // A proper API would format this, but we'll return raw for now
      };
    }

    // Map into frontend format
    const formattedAgents = allAgents.map((a) => {
      const s = statsByAgent[a.id] || { runs: 0, successRate: 0, lastRun: "never" };
      return {
        id: a.slug, // Frontend expects 'atlas' not uuid
        name: a.name,
        role: a.role,
        description: a.description,
        status: a.status,
        icon: a.icon, // Needs to map to Lucide icon on frontend
        model: a.model,
        skills: a.skills,
        knowledgeBases: kbsByAgent[a.id] || [],
        runs: s.runs,
        successRate: s.successRate,
        lastRun: s.lastRun, 
      };
    });

    res.json(formattedAgents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
