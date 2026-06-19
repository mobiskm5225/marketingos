import 'dotenv/config';
import {
  extractNotionPageId,
  getPageContent,
  getPageTitle,
  queryDatabase,
} from '../src/core/notion/reader';
import { createDatabaseEntry } from '../src/core/notion/writer';
import { runSeoAnalyzer } from '../src/agents/seo-analyzer';
import { db } from '../src/core/db';
import { agentJobs } from '../src/core/db/schema';
import log from '../src/logger';

const BLOG_TRACKER_DB = (process.env.BLOG_TRACKER_DATABASE_ID ?? '').replace(/-/g, '');
const SEO_REVIEWS_DB = (process.env.NOTION_DATABASE_ID ?? '').replace(/-/g, '');

async function getBlogTrackerEntries(): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  const token = process.env.NOTION_API_KEY;
  const url = `https://api.notion.com/v1/databases/${BLOG_TRACKER_DB}/query`;

  while (true) {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'URL', url: { is_not_empty: true } },
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });
    const data = await resp.json() as any;
    results.push(...(data.results ?? []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return results;
}

async function seoEntryExists(title: string): Promise<boolean> {
  const results = await queryDatabase(SEO_REVIEWS_DB, {
    property: 'Name',
    title: { equals: title },
  });
  return results.some(
    (e: any) => e.properties?.['SEO Status']?.select?.name !== 'Error'
  );
}

async function processEntry(brief: any): Promise<void> {
  const url: string = brief.properties?.URL?.url ?? '';
  if (!url) return;

  const blogPageId = extractNotionPageId(url);
  if (!blogPageId) {
    log.warn({ url }, 'Cannot extract page ID');
    return;
  }

  let title: string;
  try {
    title = await getPageTitle(blogPageId);
  } catch (err: any) {
    log.error({ blogPageId, err: err.message }, 'Could not fetch blog page');
    return;
  }

  if (!title) { log.warn({ blogPageId }, 'No title'); return; }

  if (await seoEntryExists(title)) {
    log.info({ title }, 'SKIP — SEO entry exists');
    return;
  }

  const content = await getPageContent(blogPageId);
  if (!content.trim()) { log.warn({ blogPageId }, 'No content'); return; }

  log.info({ title }, 'Processing...');

  const seoPage = await createDatabaseEntry(SEO_REVIEWS_DB, title, content, 'SEO Status', 'Pending');

  const [job] = await db
    .insert(agentJobs)
    .values({ agentName: 'seo-analyzer', notionPageId: seoPage.id, title, status: 'pending', source: 'backfill' })
    .returning();

  await runSeoAnalyzer(seoPage.id, job.id, 'backfill');
  log.info({ title }, 'DONE');
}

async function main() {
  log.info('Fetching Blog Tracker entries...');
  const entries = await getBlogTrackerEntries();
  log.info({ count: entries.length }, 'Found entries');

  for (const entry of entries) {
    await processEntry(entry);
  }

  log.info('Backfill complete');
  await db.$client.end();
}

main().catch(err => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
