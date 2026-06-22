import { db } from '../../core/db';
import { agentJobs, agentResults } from '../../core/db/schema';
import { getPageProperties, retrievePage } from '../../core/notion/reader';
import { createSubpage, updateStatus } from '../../core/notion/writer';
import { callOpenAI } from '../../core/ai/openai';
import { crawlUrl } from '../../core/crawler';
import { createNotification } from '../../core/notifications';
import { createReviewForJob } from '../../core/reviews';
import { BLOG_REVIEW_SYSTEM_PROMPT } from './prompt';
import { eq } from 'drizzle-orm';
import log from '../../logger';

const AGENT_NAME = 'blog-reviewer';
const STATUS_PROP = 'Review Status';

export async function runBlogReviewer(
  pageId: string,
  jobId: string,
  source = 'webhook'
): Promise<void> {
  log.info({ pageId, jobId }, 'Blog Reviewer starting');

  try {
    // Check Review Status = Pending before processing
    const page = await retrievePage(pageId) as any;
    const reviewStatus = page.properties?.[STATUS_PROP]?.select?.name ?? '';
    if (reviewStatus !== 'Pending') {
      log.info({ pageId, reviewStatus }, 'Review Status not Pending, skipping');
      await db.update(agentJobs).set({ status: 'error', errorMessage: 'Status not Pending', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));
      return;
    }

    await updateStatus(pageId, STATUS_PROP, 'Processing');
    await db.update(agentJobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));

    // Get the live blog URL from 'Blog URL' property
    const props = await getPageProperties(pageId);
    const blogUrl = props.blogUrl;

    if (!blogUrl) {
      log.warn({ pageId }, 'No Blog URL set on entry');
      await updateStatus(pageId, STATUS_PROP, 'Error');
      await db.update(agentJobs).set({ status: 'error', errorMessage: 'No Blog URL set', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));
      return;
    }

    log.info({ pageId, blogUrl }, 'Crawling live URL');
    const crawlResult = await crawlUrl(blogUrl);

    // Build structured input for GPT-4o
    const userMessage = `
URL: ${crawlResult.url}
Title Tag: ${crawlResult.title}
Meta Description: ${crawlResult.metaDescription}
H1 Tags: ${crawlResult.h1.join(' | ') || 'None found'}
H2 Tags: ${crawlResult.h2.slice(0, 10).join(' | ') || 'None found'}
H3 Tags: ${crawlResult.h3.slice(0, 10).join(' | ') || 'None found'}
Word Count: ${crawlResult.wordCount}
Internal Links: ${crawlResult.internalLinks.length} (${crawlResult.internalLinks.slice(0, 5).join(', ')})
External Links: ${crawlResult.externalLinks.length} (${crawlResult.externalLinks.slice(0, 5).join(', ')})
Images with Alt Text: ${crawlResult.imageAlts.length}
Image Alt Texts: ${crawlResult.imageAlts.slice(0, 10).join(' | ') || 'None'}

--- ARTICLE CONTENT ---
${crawlResult.bodyText.slice(0, 12000)}
`.trim();

    log.info({ pageId }, 'Calling GPT-4o for blog review');
    const result = await callOpenAI(BLOG_REVIEW_SYSTEM_PROMPT, userMessage);

    await createSubpage(pageId, 'SEO Review', result.text);
    await updateStatus(pageId, STATUS_PROP, 'Done');

    await db.update(agentJobs).set({
      status: 'done',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd.toFixed(6),
      updatedAt: new Date(),
    }).where(eq(agentJobs.id, jobId));

    await db.insert(agentResults).values({
      jobId,
      resultType: 'blog_review',
      content: result.text,
    });

    const [job] = await db.select({ title: agentJobs.title }).from(agentJobs).where(eq(agentJobs.id, jobId));
    await createNotification(
      'job_done',
      'Blog review complete',
      `"${job?.title ?? 'Untitled'}" — $${result.costUsd.toFixed(4)}`,
      jobId,
    );
    await createReviewForJob(jobId, AGENT_NAME);

    log.info({ pageId, jobId, costUsd: result.costUsd.toFixed(6) }, 'Blog Reviewer done');

  } catch (err: any) {
    log.error({ pageId, jobId, err: err.message }, 'Blog Reviewer failed');
    await createNotification('job_error', 'Blog review failed', err.message, jobId);
    try { await updateStatus(pageId, STATUS_PROP, 'Error'); } catch { /* swallow */ }
    try {
      await db.update(agentJobs).set({
        status: 'error',
        errorMessage: err.message,
        updatedAt: new Date(),
      }).where(eq(agentJobs.id, jobId));
    } catch { /* swallow */ }
  }
}

// API-first direct runner — no Notion dependency, result stored in PG only
export async function runBlogReviewerDirect(
  title: string,
  url: string,
  jobId: string
): Promise<void> {
  log.info({ jobId, title, url }, 'Blog Reviewer direct starting');

  try {
    await db.update(agentJobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));

    log.info({ jobId, url }, 'Crawling live URL');
    const crawlResult = await crawlUrl(url);

    const userMessage = `
URL: ${crawlResult.url}
Title Tag: ${crawlResult.title}
Meta Description: ${crawlResult.metaDescription}
H1 Tags: ${crawlResult.h1.join(' | ') || 'None found'}
H2 Tags: ${crawlResult.h2.slice(0, 10).join(' | ') || 'None found'}
H3 Tags: ${crawlResult.h3.slice(0, 10).join(' | ') || 'None found'}
Word Count: ${crawlResult.wordCount}
Internal Links: ${crawlResult.internalLinks.length} (${crawlResult.internalLinks.slice(0, 5).join(', ')})
External Links: ${crawlResult.externalLinks.length} (${crawlResult.externalLinks.slice(0, 5).join(', ')})
Images with Alt Text: ${crawlResult.imageAlts.length}
Image Alt Texts: ${crawlResult.imageAlts.slice(0, 10).join(' | ') || 'None'}

--- ARTICLE CONTENT ---
${crawlResult.bodyText.slice(0, 12000)}
`.trim();

    log.info({ jobId }, 'Calling GPT-4o for blog review');
    const result = await callOpenAI(BLOG_REVIEW_SYSTEM_PROMPT, userMessage);

    await db.update(agentJobs).set({
      status: 'done',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd.toFixed(6),
      updatedAt: new Date(),
    }).where(eq(agentJobs.id, jobId));

    await db.insert(agentResults).values({
      jobId,
      resultType: 'blog_review',
      content: result.text,
    });

    await createNotification(
      'job_done',
      'Blog review complete',
      `"${title}" — $${result.costUsd.toFixed(4)}`,
      jobId,
    );
    await createReviewForJob(jobId, AGENT_NAME);

    log.info({ jobId, costUsd: result.costUsd.toFixed(6) }, 'Blog Reviewer direct done');

  } catch (err: any) {
    log.error({ jobId, err: err.message }, 'Blog Reviewer direct failed');
    await createNotification('job_error', 'Blog review failed', err.message, jobId);
    try {
      await db.update(agentJobs).set({
        status: 'error',
        errorMessage: err.message,
        updatedAt: new Date(),
      }).where(eq(agentJobs.id, jobId));
    } catch { /* swallow */ }
  }
}

export const blogReviewerAgent = {
  agentName: AGENT_NAME,
  statusProperty: STATUS_PROP,
  run: runBlogReviewer,
};
