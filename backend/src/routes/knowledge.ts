import { Router } from 'express';
import { db } from '../core/db';
import { knowledgeBases, agentKnowledgeBases, agents } from '../core/db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/knowledge-bases', async (req, res) => {
  try {
    const allKbs = await db
      .select()
      .from(knowledgeBases)
      .orderBy(knowledgeBases.createdAt);

    // Fetch agents linked to each KB
    const linkedAgents = await db
      .select({
        kbId: agentKnowledgeBases.kbId,
        agentName: agents.name,
      })
      .from(agentKnowledgeBases)
      .innerJoin(agents, eq(agentKnowledgeBases.agentId, agents.id));

    const usedByByKb: Record<string, string[]> = {};
    for (const row of linkedAgents) {
      if (!usedByByKb[row.kbId]) {
        usedByByKb[row.kbId] = [];
      }
      usedByByKb[row.kbId].push(row.agentName);
    }

    const formattedKbs = allKbs.map((kb) => {
      return {
        id: kb.slug,
        name: kb.name,
        type: kb.type,
        source: kb.source,
        docs: kb.docsCount,
        chunks: kb.chunksCount,
        updated: kb.updatedAt.toISOString(), // Frontend expects string like '12m ago', we'll return ISO for now
        usedBy: usedByByKb[kb.id] || [],
        icon: kb.icon,
      };
    });

    res.json(formattedKbs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
