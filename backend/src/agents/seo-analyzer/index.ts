import { db } from '../../core/db';
import { agentJobs, agentResults } from '../../core/db/schema';
import { getPageContent, getPageProperties } from '../../core/notion/reader';
import { createSubpage, updateStatus } from '../../core/notion/writer';
import { callOpenAI } from '../../core/ai/openai';
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
    const { blogUrl } = await getPageProperties(pageId);

    const urlLine = blogUrl ? `Blog URL: ${blogUrl}\n\n` : '';
    const userMessage = `${urlLine}Blog Content:\n\n${reviewContent}`;

    log.info({ pageId }, 'Calling OpenAI GPT-4o');
    const result = await callOpenAI(SEO_SYSTEM_PROMPT, userMessage);

    await createSubpage(pageId, 'SEO Analysis', result.text);
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

    log.info({ pageId, jobId, costUsd: result.costUsd.toFixed(6) }, 'SEO Analyzer done');

  } catch (err: any) {
    log.error({ pageId, jobId, err: err.message }, 'SEO Analyzer failed');
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

    log.info({ jobId, costUsd: result.costUsd.toFixed(6) }, 'SEO Analyzer direct done');

  } catch (err: any) {
    log.error({ jobId, err: err.message }, 'SEO Analyzer direct failed');
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
