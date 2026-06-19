export interface Job {
  id: string;
  agentName: string;
  notionPageId: string | null;
  title: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: string | null;
  errorMessage: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobResult {
  id: string;
  jobId: string;
  resultType: string;
  content: string;
  createdAt: string;
}

export interface JobDetail extends Job {
  results: JobResult[];
}

export interface Stats {
  totalJobs: number;
  totalCostUsd: number;
  thisMonthCostUsd: number;
  errorRate: number;
  byStatus: Record<string, number>;
  byAgent: Record<string, { jobs: number; costUsd: number }>;
}

export interface JobsResponse {
  jobs: Job[];
  limit: number;
  offset: number;
}

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  getJobs: (params?: { limit?: number; offset?: number; agent?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    if (params?.agent) q.set('agent', params.agent);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return get<JobsResponse>(`/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob: (id: string) => get<JobDetail>(`/jobs/${id}`),
  getStats: () => get<Stats>('/stats'),
};
