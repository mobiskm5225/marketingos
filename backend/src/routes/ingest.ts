import { Router, Request, Response } from 'express';
import { ingestAuth } from '../middleware/auth';
import { createDatabaseEntry } from '../core/notion/writer';
import { agentRegistry } from '../registry';
import { db } from '../core/db';
import { agentJobs } from '../core/db/schema';
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

export default router;
