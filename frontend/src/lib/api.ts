import { getToken, clearToken } from './auth';

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

export interface Notification {
  id: string;
  type: 'job_done' | 'job_error' | 'job_started' | 'system';
  title: string;
  message: string | null;
  jobId: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

const BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized(): void {
  clearToken();
  window.location.reload();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function apiPatch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

// ─── Admin types ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  groups: string[];
}

export interface AdminGroup {
  id: string;
  name: string;
  description: string | null;
  permissions: { name: string; description: string | null }[];
}

export const api = {
  getJobs: (params?: { limit?: number; offset?: number; agent?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit)  q.set('limit',  String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    if (params?.agent)  q.set('agent',  params.agent);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return get<JobsResponse>(`/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob:   (id: string) => get<JobDetail>(`/jobs/${id}`),
  getStats: () => get<Stats>('/stats'),

  getNotifications: () => get<NotificationsResponse>('/notifications'),
  getUnreadCount:   () => get<{ count: number }>('/notifications/unread-count'),
  markRead:         (id: string) => apiPost<{ ok: boolean }>(`/notifications/${id}/read`, {}),
  markAllRead:      () => apiPost<{ ok: boolean }>('/notifications/read-all', {}),
  deleteNotification: (id: string) => fetch(`/api/notifications/${id}`, {
    method: 'DELETE',
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
  }).then(r => r.json()),
  clearReadNotifications: () => fetch('/api/notifications', {
    method: 'DELETE',
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
  }).then(r => r.json()),

  // Admin
  listUsers:       () => get<{ users: AdminUser[] }>('/admin/users'),
  createUser:      (body: { username: string; password: string; email?: string }) =>
    apiPost<{ user: AdminUser }>('/admin/users', body),
  setUserGroups:   (userId: string, groupIds: string[]) =>
    apiPatch<{ ok: boolean; groups: string[]; permissions: string[] }>(`/admin/users/${userId}/groups`, { groupIds }),
  setUserActive:   (userId: string, isActive: boolean) =>
    apiPatch<{ ok: boolean }>(`/admin/users/${userId}/active`, { isActive }),
  listGroups:      () => get<{ groups: AdminGroup[] }>('/admin/groups'),
};
