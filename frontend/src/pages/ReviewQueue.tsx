import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { agentLabel, timeAgo } from '../lib/format';

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending Review',
  under_review:   'Under Review',
  reviewed:       'Reviewed',
  approved:       'Approved',
  rejected:       'Rejected',
  needs_changes:  'Needs Changes',
};

const STATUS_COLOR: Record<string, string> = {
  pending_review: '#f0a500',
  under_review:   '#1a56a4',
  reviewed:       '#6b7280',
  approved:       '#1f6f35',
  rejected:       '#b42318',
  needs_changes:  '#92400e',
};

const STATUS_BG: Record<string, string> = {
  pending_review: '#fffbeb',
  under_review:   '#eff6ff',
  reviewed:       '#f5f7f8',
  approved:       '#f0faf3',
  rejected:       '#fff0f0',
  needs_changes:  '#fff7ed',
};

export default function ReviewQueue() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, hasPermission, isManagerInGroup } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', statusFilter],
    queryFn: () => api.getReviews(statusFilter || undefined),
    refetchInterval: 15_000,
  });

  const reviews = data?.reviews ?? [];

  const claimMutation = useMutation({
    mutationFn: (jobId: string) => api.claimReview(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
    // e.g. 409 when another reviewer claimed it first — show why, then refetch
    // so the stale Claim button disappears.
    onError: (err: Error) => {
      toast(err.message, 'error');
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const pendingCount  = reviews.filter(r => r.status === 'pending_review').length;
  const reviewedCount = reviews.filter(r => r.status === 'reviewed').length;
  const myActive      = reviews.filter(r => r.reviewerName === user?.username && r.status === 'under_review').length;

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>Review Queue</strong></div>
        <div className="record-actions">
          <select
            className="sn-input"
            style={{ padding: '5px 10px', fontSize: 12, minWidth: 160 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Workflow</div>
          <h1 className="page-title">Review Queue</h1>
          <p className="page-sub">AI agent outputs awaiting human review and approval.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" style={{ background: '#f0a500' }} /> {pendingCount} pending</span>
          {reviewedCount > 0 && <span className="tag"><span className="tag-dot" style={{ background: '#6b7280' }} /> {reviewedCount} awaiting approval</span>}
          {myActive > 0 && <span className="tag"><span className="tag-dot" style={{ background: '#1a56a4' }} /> {myActive} claimed by you</span>}
        </div>
      </div>

      <div className="sn-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#697a82', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            No reviews in queue{statusFilter ? ` with status "${STATUS_LABEL[statusFilter]}"` : ''}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8edf0', background: '#f5f7f8' }}>
                {['Job', 'Agent', 'Group', 'Status', 'Reviewer', 'Lead', 'Age', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#697a82', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => {
                const canClaim   = hasPermission('jobs:review') && (r.status === 'pending_review' || r.status === 'needs_changes');
                const isMyReview = r.reviewerName === user?.username;
                const canApprove = hasPermission('jobs:approve') && isManagerInGroup(r.groupName) && r.status === 'reviewed';

                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0f3f5' }}
                    onMouseOver={e => (e.currentTarget.style.background = '#fafcff')}
                    onMouseOut={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--sn-link)', fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}
                        onClick={() => navigate(`/jobs/${r.jobId}`)}>
                        {r.jobTitle ?? r.jobId.slice(0, 8) + '…'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#697a82' }}>{agentLabel(r.jobAgentName ?? '')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#f0f4ff', color: '#1a4fa0' }}>{r.groupName}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: STATUS_BG[r.status] ?? '#f5f7f8',
                        color: STATUS_COLOR[r.status] ?? '#697a82',
                      }}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#697a82' }}>{r.reviewerName ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#697a82' }}>{r.leadName ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#9badb5', fontSize: 11 }}>{timeAgo(r.createdAt)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="sn-btn" style={{ padding: '3px 10px', fontSize: 11 }}
                          onClick={() => navigate(`/jobs/${r.jobId}`)}>
                          View
                        </button>
                        {canClaim && (
                          <button className="sn-btn sn-btn-primary" style={{ padding: '3px 10px', fontSize: 11 }}
                            disabled={claimMutation.isPending}
                            onClick={() => claimMutation.mutate(r.jobId)}>
                            Claim
                          </button>
                        )}
                        {isMyReview && r.status === 'under_review' && (
                          <button className="sn-btn" style={{ padding: '3px 10px', fontSize: 11, color: '#1a56a4', borderColor: '#1a56a4' }}
                            onClick={() => navigate(`/jobs/${r.jobId}`, { state: { openReview: true } })}>
                            Submit
                          </button>
                        )}
                        {canApprove && (
                          <button className="sn-btn" style={{ padding: '3px 10px', fontSize: 11, color: '#1f6f35', borderColor: '#1f6f35' }}
                            onClick={() => navigate(`/jobs/${r.jobId}`, { state: { openReview: true } })}>
                            Decide
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
