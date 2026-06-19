import { Router, Request, Response } from 'express';
import { verifyNotionSignature } from '../middleware/auth';
import { agentRegistry } from '../registry';
import { db } from '../core/db';
import { agentJobs } from '../core/db/schema';
import {
  retrievePage,
  getPageContent,
  extractNotionPageId,
  getPageTitle,
  queryDatabase,
} from '../core/notion/reader';
import { createDatabaseEntry } from '../core/notion/writer';
import log from '../logger';

const router = Router();

const NOTION_DB_ID = (process.env.NOTION_DATABASE_ID ?? '').replace(/-/g, '');
const BLOG_TRACKER_DB_ID = (process.env.BLOG_TRACKER_DATABASE_ID ?? '').replace(/-/g, '');
const ACCEPTED_EVENTS = new Set(['page.created', 'page.updated', 'page.content_updated', 'page.properties_updated']);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processPageWithDbCheck(pageId: string): Promise<void> {
  let page: any;

  // 3 retries — Notion eventual consistency
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      page = await retrievePage(pageId);
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      log.warn({ pageId, attempt }, 'Page not ready, retrying in 2s');
      await sleep(2000);
    }
  }

  if (page.archived || page.in_trash) {
    log.info({ pageId }, 'Page archived/trashed, skipping');
    return;
  }

  const dbId = (page.parent?.database_id ?? '').replace(/-/g, '');

  // Blog Tracker special handling — extracts URL, creates SEO Reviews entry
  if (BLOG_TRACKER_DB_ID && dbId === BLOG_TRACKER_DB_ID) {
    await processBriefUrlTrigger(page, pageId);
    return;
  }

  // Route by registry — any registered agent DB is handled here
  const agent = agentRegistry.get(dbId);
  if (!agent) {
    log.info({ pageId, dbId }, 'Not in target database, skipping');
    return;
  }

  const statusValue = page.properties?.[agent.statusProperty]?.select?.name ?? '';
  if (statusValue !== 'Pending') {
    log.info({ pageId, statusValue, agent: agent.agentName }, 'Status not Pending, skipping');
    return;
  }

  await dispatchAgent(dbId, pageId, 'webhook');
}

async function processBriefUrlTrigger(page: any, briefPageId: string): Promise<void> {
  const url: string = page.properties?.URL?.url ?? '';
  if (!url) {
    log.info({ briefPageId }, 'Brief has no URL, skipping');
    return;
  }

  const blogPageId = extractNotionPageId(url);
  if (!blogPageId) {
    log.warn({ url }, 'Cannot extract page ID from URL');
    return;
  }

  let title: string;
  try {
    title = await getPageTitle(blogPageId);
  } catch (err: any) {
    log.error({ blogPageId, err: err.message }, 'Could not fetch blog page');
    return;
  }

  if (!title) {
    log.warn({ blogPageId }, 'Blog page has no title');
    return;
  }

  // Dedup: skip if SEO review already exists for this title (status != Error)
  const existing = await queryDatabase(NOTION_DB_ID, {
    property: 'Name',
    title: { equals: title },
  });
  const hasNonError = existing.some(
    (e: any) => e.properties?.['SEO Status']?.select?.name !== 'Error'
  );
  if (hasNonError) {
    log.info({ title }, 'SEO review already exists, skipping');
    return;
  }

  const content = await getPageContent(blogPageId);
  if (!content.trim()) {
    log.warn({ blogPageId }, 'Blog page has no content');
    return;
  }

  log.info({ title }, 'Creating SEO review entry');
  const seoPage = await createDatabaseEntry(
    NOTION_DB_ID,
    title,
    content,
    'SEO Status',
    'Pending'
  );

  await dispatchAgent(NOTION_DB_ID, seoPage.id, 'webhook');
}

async function dispatchAgent(dbId: string, pageId: string, source: string): Promise<void> {
  const agent = agentRegistry.get(dbId);
  if (!agent) {
    log.warn({ dbId }, 'No agent registered for database');
    return;
  }

  const [job] = await db
    .insert(agentJobs)
    .values({
      agentName: agent.agentName,
      notionPageId: pageId,
      status: 'pending',
      source,
    })
    .returning();

  // Fire and forget — don't await
  agent.run(pageId, job.id, source).catch((err: Error) => {
    log.error({ pageId, jobId: job.id, err: err.message }, 'Agent run failed');
  });
}

router.post('/webhook', async (req: Request, res: Response) => {
  const rawBody: Buffer = (req as any).rawBody;
  const signature = req.headers['x-notion-signature'] as string ?? '';

  if (!verifyNotionSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const payload = JSON.parse(rawBody.toString());

  // Notion verification handshake
  if (payload.verification_token) {
    res.json({ verification_token: payload.verification_token });
    return;
  }

  const eventType: string = payload.type ?? '';
  log.info({ eventType }, 'Webhook received');

  if (!ACCEPTED_EVENTS.has(eventType)) {
    res.json({ status: 'ignored', reason: `event type: ${eventType}` });
    return;
  }

  const pageId: string = payload.entity?.id ?? '';
  if (!pageId) {
    res.status(400).json({ error: 'Missing entity.id' });
    return;
  }

  // Return immediately, process in background
  res.json({ status: 'accepted' });
  processPageWithDbCheck(pageId).catch((err: Error) => {
    log.error({ pageId, err: err.message }, 'processPageWithDbCheck failed');
  });
});

export default router;
