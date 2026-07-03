import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, type Job } from '../lib/api';
import { useAuth } from '../lib/auth';
import { timeAgo } from '../lib/format';

export default function BlogReviewerJobs() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE = 25;

  if (!hasPermission('agents:trigger:blog-reviewer') && !hasPermission('*')) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#697a82' }}>Access denied.</div>;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', 'blog-reviewer', statusFilter, page],
    queryFn: () => api.getJobs({ agent: 'blog-reviewer', status: statusFilter || undefined, limit: PAGE, offset: page * PAGE }),
    refetchInterval: 15_000,
  });

  const jobs  = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const hasNext = (page + 1) * PAGE < total;

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>Existing Blog Reviewer</strong></div>
        <div className="record-actions">
          <select className="sn-input" style={{ padding: '5px 10px', fontSize: 12, minWidth: 140 }}
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="done">Done</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Agent · Content</div>
          <h1 className="page-title">Existing Blog Reviewer Jobs</h1>
          <p className="page-sub">All runs of the Existing Blog Reviewer agent. Click a row to view output.</p>
        </div>
        <div className="title-meta">
          <span className="tag">
            <span className="tag-dot" style={{ background: '#1a56a4' }} />
            {data?.jobs?.filter(j => j.status === 'processing').length ?? 0} active
          </span>
        </div>
      </div>

      <div className="sn-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#697a82', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
            No Existing Blog Reviewer jobs{statusFilter ? ` with status "${statusFilter}"` : ''}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8edf0', background: '#f5f7f8' }}>
                {['Title / Page', 'Status', 'Source', 'Tokens', 'Cost', 'Age', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#697a82', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: Job) => (
                <tr key={job.id} style={{ borderBottom: '1px solid #f0f3f5', cursor: 'pointer' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#fafcff')}
                  onMouseOut={e => (e.currentTarget.style.background = '')}
                  onClick={() => navigate(`/jobs/${job.id}`)}>
                  <td style={{ padding: '10px 14px', maxWidth: 340 }}>
                    <div style={{ fontWeight: 700, color: '#1a2f38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.title ?? 'Untitled'}
                    </div>
                    {job.notionPageId && (
                      <div style={{ fontSize: 11, color: '#9badb5', marginTop: 1 }}>{job.notionPageId}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`status ${job.status}`}>{job.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#697a82', fontSize: 12 }}>{job.source ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#697a82', fontSize: 12 }}>
                    {job.inputTokens != null ? `${(job.inputTokens + (job.outputTokens ?? 0)).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#697a82', fontSize: 12 }}>
                    {job.costUsd ? `$${Number(job.costUsd).toFixed(4)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#9badb5', fontSize: 11 }}>{timeAgo(job.createdAt)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, color: 'var(--sn-link)', fontWeight: 700 }}>View →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(page > 0 || hasNext) && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 18px', borderTop: '1px solid #e8edf0', justifyContent: 'flex-end' }}>
            <button className="sn-btn" style={{ fontSize: 12 }} disabled={page === 0}
              onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 12, color: '#697a82', alignSelf: 'center' }}>
              Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE))}
            </span>
            <button className="sn-btn" style={{ fontSize: 12 }} disabled={!hasNext}
              onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
