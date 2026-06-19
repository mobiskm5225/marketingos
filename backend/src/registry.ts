import { seoAnalyzerAgent } from './agents/seo-analyzer';
import { blogReviewerAgent } from './agents/blog-reviewer';

export interface AgentHandler {
  agentName: string;
  statusProperty: string;
  run(pageId: string, jobId: string, source?: string): Promise<void>;
}

// Maps normalized DB ID → agent handler
// Add new agent: one line here + new folder in agents/
function buildRegistry(): Map<string, AgentHandler> {
  const map = new Map<string, AgentHandler>();

  if (process.env.NOTION_DATABASE_ID) {
    map.set(process.env.NOTION_DATABASE_ID.replace(/-/g, ''), seoAnalyzerAgent);
  }

  if (process.env.BLOG_REVIEW_DB_ID) {
    map.set(process.env.BLOG_REVIEW_DB_ID.replace(/-/g, ''), blogReviewerAgent);
  }

  return map;
}

export const agentRegistry = buildRegistry();
