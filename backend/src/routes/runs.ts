import { Router } from 'express';
import { db } from '../core/db';
import { runs, agents } from '../core/db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

router.get('/runs', async (req, res) => {
  try {
    const allRuns = await db
      .select({
        run: runs,
        agentName: agents.name,
      })
      .from(runs)
      .innerJoin(agents, eq(runs.agentId, agents.id))
      .orderBy(desc(runs.createdAt));
      
    const formatted = allRuns.map(({ run, agentName }) => {
      // Format started string based on startedAt
      // For the mock it's just 'Today, 09:12', but we'll return ISO in the real API
      
      return {
        id: run.slug,
        title: run.title,
        agent: agentName,
        status: run.status,
        started: run.startedAt.toISOString(),
        duration: run.duration,
        model: run.model,
        summary: run.summary,
        metrics: run.metrics,
        sections: run.sections,
        sources: run.sources,
        attachments: run.attachments,
        comments: run.comments,
      };
    });
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/runs/:slug', async (req, res) => {
  try {
    const [row] = await db
      .select({
        run: runs,
        agentName: agents.name,
      })
      .from(runs)
      .innerJoin(agents, eq(runs.agentId, agents.id))
      .where(eq(runs.slug, req.params.slug));
      
    if (!row) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    
    const { run, agentName } = row;
    
    res.json({
      id: run.slug,
      title: run.title,
      agent: agentName,
      status: run.status,
      started: run.startedAt.toISOString(),
      duration: run.duration,
      model: run.model,
      summary: run.summary,
      metrics: run.metrics,
      sections: run.sections,
      sources: run.sources,
      attachments: run.attachments,
      comments: run.comments,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
