export interface BlogReviewerAgent {
  agentName: string;
  statusProperty: string;
  run(pageId: string, jobId: string, source?: string): Promise<void>;
}
