export interface AgentHandler {
  agentName: string;
  statusProperty: string;
  run(pageId: string, jobId: string, source?: string): Promise<void>;
}
