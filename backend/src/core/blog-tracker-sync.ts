import { eq, isNotNull } from 'drizzle-orm';
import { db } from './db';
import { blogDrafts } from './db/schema';
import { queryDatabaseAll, getPageContent, titleFromPage, listChildPages } from './notion/reader';
import log from '../logger';

const TRACKER_DB_ID = (process.env.BLOG_TRACKER_DATABASE_ID ?? '').replace(/-/g, '');

// Notion tracker Status → review workflow status.
// Published blogs are live — nothing left to review. Anything else waits.
const NOTION_TO_REVIEW_STATUS: Record<string, string> = {
  'Published': 'approved',
  'In Review': 'in_review',
};

export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

function richText(prop: any): string {
  return (prop?.rich_text ?? []).map((t: any) => t.plain_text ?? '').join('').trim();
}

// Map a Notion Blog Tracker page to blog_drafts columns.
// Tracker properties: Title (title), URL / SEO Keywords / Brief (rich_text),
// Category (select), Status (status), Publication Date (date).
function mapTrackerPage(page: any) {
  const props = page.properties ?? {};
  const dateStart = props['Publication Date']?.date?.start;
  return {
    notionPageId:    String(page.id ?? '').replace(/-/g, ''),
    title:           titleFromPage(page),
    url:             richText(props['URL']) || null,
    seoKeywords:     richText(props['SEO Keywords']) || null,
    brief:           richText(props['Brief']) || null,
    category:        props['Category']?.select?.name ?? null,
    notionStatus:    props['Status']?.status?.name ?? null,
    publicationDate: dateStart ? new Date(dateStart) : null,
  };
}

// The written blog lives as a child page nested under the tracker row —
// that full draft is what reviewers need, not just the brief.
async function fetchDraftContent(page: any, brief: string | null): Promise<string | null> {
  try {
    const children = await listChildPages(page.id);
    if (children.length > 0) {
      const body = (await getPageContent(children[0].id)).trim();
      if (body) return body;
    }
  } catch (err: any) {
    log.warn({ pageId: page.id, err: err.message }, 'Could not fetch child blog page');
  }
  if (brief) return brief;
  try {
    return (await getPageContent(page.id)).trim() || null;
  } catch {
    return null;
  }
}

// Insert or refresh one tracker page as a blog draft.
// A human review decision (reviewerId set) is never overwritten.
export async function upsertTrackerPage(page: any): Promise<'created' | 'updated' | 'skipped'> {
  const mapped = mapTrackerPage(page);

  if (!mapped.title) {
    log.info({ notionPageId: mapped.notionPageId }, 'Tracker page has no title, skipping');
    return 'skipped';
  }

  const content = await fetchDraftContent(page, mapped.brief);
  const reviewStatus = NOTION_TO_REVIEW_STATUS[mapped.notionStatus ?? ''] ?? 'pending';

  const [existing] = await db
    .select({ id: blogDrafts.id, reviewerId: blogDrafts.reviewerId })
    .from(blogDrafts)
    .where(eq(blogDrafts.notionPageId, mapped.notionPageId))
    .limit(1);

  if (existing) {
    await db.update(blogDrafts).set({
      title:           mapped.title,
      url:             mapped.url,
      seoKeywords:     mapped.seoKeywords,
      content,
      category:        mapped.category,
      notionStatus:    mapped.notionStatus,
      publicationDate: mapped.publicationDate,
      // Only follow Notion's status while no human has reviewed the draft
      ...(existing.reviewerId ? {} : { status: reviewStatus }),
      updatedAt:       new Date(),
    }).where(eq(blogDrafts.id, existing.id));
    return 'updated';
  }

  await db.insert(blogDrafts).values({
    notionPageId:    mapped.notionPageId,
    title:           mapped.title,
    url:             mapped.url,
    seoKeywords:     mapped.seoKeywords,
    content,
    category:        mapped.category,
    notionStatus:    mapped.notionStatus,
    publicationDate: mapped.publicationDate,
    source:          'notion-blog-tracker',
    status:          reviewStatus,
  });
  return 'created';
}

// Full sync: pull every page from the Notion Blog Tracker into blog_drafts.
// Idempotent — safe to run repeatedly.
export async function syncBlogTracker(): Promise<SyncResult> {
  if (!TRACKER_DB_ID) {
    throw new Error('BLOG_TRACKER_DATABASE_ID is not configured');
  }

  log.info({ trackerDbId: TRACKER_DB_ID }, 'Blog Tracker sync starting');
  const pages = await queryDatabaseAll(TRACKER_DB_ID);

  const result: SyncResult = { total: pages.length, created: 0, updated: 0, skipped: 0 };

  for (const page of pages) {
    try {
      const outcome = await upsertTrackerPage(page);
      result[outcome]++;
    } catch (err: any) {
      log.error({ pageId: page.id, err: err.message }, 'Failed to sync tracker page');
      result.skipped++;
    }
  }

  // Pages deleted/archived in Notion are left in place — review history is preserved.
  const notionIds = new Set(pages.map(p => String(p.id ?? '').replace(/-/g, '')));
  const stale = await db
    .select({ id: blogDrafts.id, notionPageId: blogDrafts.notionPageId })
    .from(blogDrafts)
    .where(isNotNull(blogDrafts.notionPageId));
  const staleIds = stale.filter(d => d.notionPageId && !notionIds.has(d.notionPageId)).map(d => d.id);
  if (staleIds.length > 0) {
    log.info({ count: staleIds.length }, 'Drafts whose Notion pages no longer exist (kept, not deleted)');
  }

  log.info(result, 'Blog Tracker sync done');
  return result;
}
