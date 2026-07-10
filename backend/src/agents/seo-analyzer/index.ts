import { db } from '../../core/db';
import { agentJobs, agentResults } from '../../core/db/schema';
import { getPageContent, getPageProperties } from '../../core/notion/reader';
import { replaceSubpage, updateStatus } from '../../core/notion/writer';
import { callOpenAI } from '../../core/ai/openai';
import { createNotification } from '../../core/notifications';
import { createReviewForJob } from '../../core/reviews';
import { SEO_SYSTEM_PROMPT } from './prompt';
import { eq } from 'drizzle-orm';
import log from '../../logger';

const AGENT_NAME = 'seo-analyzer';
const STATUS_PROP = 'SEO Status';
const METADATA_MARKERS = ['Meta Elements', 'Schema Markup', 'Visual Suggestions'];

function stripMetadata(content: string): string {
  for (const marker of METADATA_MARKERS) {
    const idx = content.indexOf(marker);
    if (idx !== -1) return content.slice(0, idx).trim();
  }
  return content;
}

export async function runSeoAnalyzer(
  pageId: string,
  jobId: string,
  source = 'webhook'
): Promise<void> {
  log.info({ pageId, jobId }, 'SEO Analyzer starting');

  try {
    await updateStatus(pageId, STATUS_PROP, 'Processing');
    await db.update(agentJobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));

    const rawContent = await getPageContent(pageId);
    if (!rawContent.trim()) {
      log.warn({ pageId }, 'Page has no content');
      await updateStatus(pageId, STATUS_PROP, 'Error');
      await db.update(agentJobs).set({ status: 'error', errorMessage: 'Empty content', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));
      return;
    }

    const reviewContent = stripMetadata(rawContent);
    const { blogUrl, title: pageTitle } = await getPageProperties(pageId);

    // Backfill job title from the Notion page so listings never show "Untitled"
    if (pageTitle) {
      await db.update(agentJobs).set({ title: pageTitle }).where(eq(agentJobs.id, jobId));
    }

    const urlLine = blogUrl ? `Blog URL: ${blogUrl}\n\n` : '';
    const userMessage = `${urlLine}Blog Content:\n\n${reviewContent}`;

    log.info({ pageId }, 'Calling OpenAI GPT-4o');
    const result = await callOpenAI(SEO_SYSTEM_PROMPT, userMessage);

    await replaceSubpage(pageId, 'SEO Analysis', result.text);
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
      resultType: 'seo_analysis',
      content: result.text,
    });

    const [job] = await db.select({ title: agentJobs.title }).from(agentJobs).where(eq(agentJobs.id, jobId));
    await createNotification(
      'job_done',
      'SEO Analysis complete',
      `"${job?.title ?? 'Untitled'}" — $${result.costUsd.toFixed(4)}`,
      jobId,
    );
    await createReviewForJob(jobId, AGENT_NAME);

    log.info({ pageId, jobId, costUsd: result.costUsd.toFixed(6) }, 'SEO Analyzer done');

  } catch (err: any) {
    log.error({ pageId, jobId, err: err.message }, 'SEO Analyzer failed');
    await createNotification('job_error', 'SEO Analysis failed', err.message, jobId);
    try {
      await updateStatus(pageId, STATUS_PROP, 'Error');
    } catch { /* swallow */ }
    try {
      await db.update(agentJobs).set({
        status: 'error',
        errorMessage: err.message,
        updatedAt: new Date(),
      }).where(eq(agentJobs.id, jobId));
    } catch { /* swallow */ }
  }
}

// API-first direct runner — no Notion read/write, result stored in PG only
export async function runSeoAnalyzerDirect(
  title: string,
  content: string,
  url: string | undefined,
  jobId: string
): Promise<void> {
  log.info({ jobId, title }, 'SEO Analyzer direct starting');

  try {
    await db.update(agentJobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));

    const reviewContent = stripMetadata(content);
    if (!reviewContent.trim()) {
      await db.update(agentJobs).set({ status: 'error', errorMessage: 'Empty content', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));
      return;
    }

    const urlLine = url ? `Blog URL: ${url}\n\n` : '';
    const userMessage = `${urlLine}Blog Content:\n\n${reviewContent}`;

    log.info({ jobId }, 'Calling OpenAI GPT-4o');
    const result = await callOpenAI(SEO_SYSTEM_PROMPT, userMessage);

    await db.update(agentJobs).set({
      status: 'done',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd.toFixed(6),
      updatedAt: new Date(),
    }).where(eq(agentJobs.id, jobId));

    await db.insert(agentResults).values({
      jobId,
      resultType: 'seo_analysis',
      content: result.text,
    });

    await createNotification(
      'job_done',
      'SEO Analysis complete',
      `"${title}" — $${result.costUsd.toFixed(4)}`,
      jobId,
    );
    await createReviewForJob(jobId, AGENT_NAME);

    log.info({ jobId, costUsd: result.costUsd.toFixed(6) }, 'SEO Analyzer direct done');

  } catch (err: any) {
    log.error({ jobId, err: err.message }, 'SEO Analyzer direct failed');
    await createNotification('job_error', 'SEO Analysis failed', err.message, jobId);
    try {
      await db.update(agentJobs).set({
        status: 'error',
        errorMessage: err.message,
        updatedAt: new Date(),
      }).where(eq(agentJobs.id, jobId));
    } catch { /* swallow */ }
  }
}

// Blog-draft runner — analyzes a draft from blog_drafts and writes the result
// both to Postgres and as an "SEO Analysis" child page under the draft's
// Notion Blog Tracker row (so the team sees it next to the draft).
export async function runSeoAnalyzerForDraft(
  draft: {
    id: string;
    title: string;
    content: string;
    url: string | null;
    seoKeywords: string | null;
    notionPageId: string | null;
  },
  jobId: string
): Promise<void> {
  log.info({ draftId: draft.id, jobId }, 'SEO Analyzer draft run starting');

  try {
    await db.update(agentJobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));

    const parts: string[] = [];
    if (draft.url) parts.push(`Blog URL: ${draft.url}`);
    if (draft.seoKeywords) parts.push(`Target SEO Keywords:\n${draft.seoKeywords}`);
    parts.push(`Blog Content:\n\n${stripMetadata(draft.content)}`);
    const userMessage = parts.join('\n\n');

    log.info({ draftId: draft.id }, 'Calling OpenAI GPT-4o');
    const result = await callOpenAI(SEO_SYSTEM_PROMPT, userMessage);

    // Write analysis next to the draft in Notion — replaces the previous
    // "SEO Analysis" page on re-runs (old copy goes to Notion trash).
    // Non-fatal if it fails.
    if (draft.notionPageId) {
      try {
        await replaceSubpage(draft.notionPageId, 'SEO Analysis', result.text);
      } catch (err: any) {
        log.warn({ draftId: draft.id, err: err.message }, 'Could not write SEO Analysis subpage to Notion');
      }
    }

    await db.update(agentJobs).set({
      status: 'done',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd.toFixed(6),
      updatedAt: new Date(),
    }).where(eq(agentJobs.id, jobId));

    await db.insert(agentResults).values({
      jobId,
      resultType: 'seo_analysis',
      content: result.text,
    });

    await createNotification(
      'job_done',
      'SEO Analysis complete',
      `"${draft.title}" — $${result.costUsd.toFixed(4)}`,
      jobId,
    );
    await createReviewForJob(jobId, AGENT_NAME);

    log.info({ draftId: draft.id, jobId, costUsd: result.costUsd.toFixed(6) }, 'SEO Analyzer draft run done');

  } catch (err: any) {
    log.error({ draftId: draft.id, jobId, err: err.message }, 'SEO Analyzer draft run failed');
    await createNotification('job_error', 'SEO Analysis failed', err.message, jobId);
    try {
      await db.update(agentJobs).set({
        status: 'error',
        errorMessage: err.message,
        updatedAt: new Date(),
      }).where(eq(agentJobs.id, jobId));
    } catch { /* swallow */ }
  }
}

export const seoAnalyzerAgent = {
  agentName: AGENT_NAME,
  statusProperty: STATUS_PROP,
  run: runSeoAnalyzer,
};
