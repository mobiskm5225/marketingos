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
  total: number;
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
  window.location.replace('/');
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `${res.status} ${res.statusText}` }));
    throw new Error(err.error ?? `${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
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

// ─── Review types ─────────────────────────────────────────────────────────────

export interface JobReview {
  id: string;
  jobId: string;
  groupName: string;
  status: 'pending_review' | 'under_review' | 'reviewed' | 'approved' | 'rejected' | 'needs_changes';
  reviewerId: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  leadId: string | null;
  leadName: string | null;
  leadComment: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  jobTitle?: string | null;
  jobAgentName?: string;
  jobStatus?: string;
}

export interface TeamMember {
  userId: string;
  username: string;
  email: string | null;
  isActive: boolean;
  groupName: string;
  groupRole: 'member' | 'manager';
}

export interface BlogDraft {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  source: string | null;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  reviewerId: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  username: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
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
  getJobs: (params?: { limit?: number; offset?: number; agent?: string; status?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit)  sp.set('limit',  String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    if (params?.agent)  sp.set('agent',  params.agent);
    if (params?.status) sp.set('status', params.status);
    if (params?.q)      sp.set('q',      params.q);
    const qs = sp.toString();
    return get<JobsResponse>(`/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob:   (id: string) => get<JobDetail>(`/jobs/${id}`),
  getStats: () => get<Stats>('/stats'),

  getNotifications: () => get<NotificationsResponse>('/notifications'),
  getUnreadCount:   () => get<{ count: number }>('/notifications/unread-count'),
  markRead:         (id: string) => apiPatch<{ ok: boolean }>(`/notifications/${id}/read`, {}),
  markAllRead:      () => apiPost<{ ok: boolean }>('/notifications/read-all', {}),
  deleteNotification:     (id: string) => apiDelete<{ ok: boolean }>(`/notifications/${id}`),
  clearReadNotifications: () => apiDelete<{ ok: boolean }>('/notifications'),

  // Admin
  listUsers:       () => get<{ users: AdminUser[] }>('/admin/users'),
  createUser:      (body: { username: string; password: string; email?: string }) =>
    apiPost<{ user: AdminUser }>('/admin/users', body),
  setUserGroups:   (userId: string, groupIds: string[], groupRoles?: Record<string, 'member' | 'manager'>) =>
    apiPatch<{ ok: boolean; groups: string[]; permissions: string[] }>(`/admin/users/${userId}/groups`, { groupIds, groupRoles }),
  setUserActive:   (userId: string, isActive: boolean) =>
    apiPatch<{ ok: boolean }>(`/admin/users/${userId}/active`, { isActive }),
  listGroups:      () => get<{ groups: AdminGroup[] }>('/admin/groups'),

  // Reviews
  getReviews:       (status?: string) => get<{ reviews: JobReview[] }>(`/reviews${status ? `?status=${status}` : ''}`),
  getJobReview:     (jobId: string) => get<{ review: JobReview }>(`/jobs/${jobId}/review`),
  claimReview:      (jobId: string) => apiPost<{ review: JobReview }>(`/jobs/${jobId}/review/claim`, {}),
  submitReview:     (jobId: string, reviewNote: string) => apiPost<{ review: JobReview }>(`/jobs/${jobId}/review/submit`, { reviewNote }),
  approveReview:    (jobId: string, leadComment?: string) => apiPost<{ review: JobReview }>(`/jobs/${jobId}/review/approve`, { leadComment }),
  rejectReview:     (jobId: string, leadComment?: string) => apiPost<{ review: JobReview }>(`/jobs/${jobId}/review/reject`, { leadComment }),
  needsChanges:     (jobId: string, leadComment: string) => apiPost<{ review: JobReview }>(`/jobs/${jobId}/review/needs-changes`, { leadComment }),

  // Team management (group managers)
  getTeam: () => get<{ members: TeamMember[]; managedGroups: string[] }>('/team'),
  getTeamCandidates: (groupName: string) => get<{ candidates: { id: string; username: string; email: string | null }[] }>(`/team/candidates/${encodeURIComponent(groupName)}`),
  addTeamMember:    (groupName: string, userId: string, role: 'member' | 'manager') =>
    apiPost<{ ok: boolean }>(`/team/${encodeURIComponent(groupName)}/members`, { userId, role }),
  setTeamRole:      (groupName: string, userId: string, role: 'member' | 'manager') =>
    apiPatch<{ ok: boolean }>(`/team/${encodeURIComponent(groupName)}/members/${userId}/role`, { role }),
  removeTeamMember: (groupName: string, userId: string) =>
    apiDelete<{ ok: boolean }>(`/team/${encodeURIComponent(groupName)}/members/${userId}`),

  // Blog Drafts
  getBlogDrafts:   (params?: { status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.limit)  q.set('limit',  String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    const qs = q.toString();
    return get<{ drafts: BlogDraft[] }>(`/blog-drafts${qs ? `?${qs}` : ''}`);
  },
  getBlogDraft:    (id: string) => get<{ draft: BlogDraft }>(`/blog-drafts/${id}`),
  updateBlogDraft: (id: string, body: { status?: string; reviewNote?: string }) =>
    apiPatch<{ draft: BlogDraft }>(`/blog-drafts/${id}`, body),

  // Audit
  getAuditLogs:    (params?: { limit?: number; offset?: number; action?: string; username?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit)    q.set('limit',    String(params.limit));
    if (params?.offset)   q.set('offset',   String(params.offset));
    if (params?.action)   q.set('action',   params.action);
    if (params?.username) q.set('username', params.username);
    const qs = q.toString();
    return get<{ logs: AuditLog[] }>(`/admin/audit${qs ? `?${qs}` : ''}`);
  },
};
