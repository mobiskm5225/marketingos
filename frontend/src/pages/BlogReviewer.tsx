import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, type Job, type Stats } from '../lib/api';
import FilterBar, { type FilterCondition, type ColumnDef } from '../components/FilterBar';
import { applyFilters } from '../lib/filterUtils';

const STATUS_OPTIONS = [
  { value: 'done',       label: 'Done'       },
  { value: 'processing', label: 'Processing' },
  { value: 'pending',    label: 'Pending'    },
  { value: 'error',      label: 'Error'      },
];

const COLUMNS: ColumnDef[] = [
  { key: 'id',           label: 'Number',     type: 'text' },
  { key: 'title',        label: 'Blog title', type: 'text' },
  { key: 'status',       label: 'Status',     type: 'select', options: STATUS_OPTIONS },
  { key: 'inputTokens',  label: 'Tokens in',  type: 'number' },
  { key: 'outputTokens', label: 'Tokens out', type: 'number' },
  { key: 'costUsd',      label: 'Cost ($)',    type: 'number' },
  { key: 'source',       label: 'Source',     type: 'text' },
  { key: 'createdAt',    label: 'Created',    type: 'date' },
];

function jobIdDisplay(id: string) {
  return id.replace('job-', 'J-').toUpperCase();
}

const PAGE_SIZE = 20;

export default function BlogReviewer() {
  const navigate = useNavigate();
  const [page, setPage]       = useState(0);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Extract backend-compatible status filter
  const backendStatus = filters.find(f => f.col === 'status' && f.op === 'is')?.val;
  const clientFilters = filters.filter(f => !(f.col === 'status' && f.op === 'is'));

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', 'blog', page, backendStatus],
    queryFn: () => api.getJobs({
      limit: PAGE_SIZE, offset: page * PAGE_SIZE,
      agent: 'blog-reviewer', status: backendStatus || undefined,
    }),
    refetchInterval: 15_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 30_000,
  });

  const s = statsData as Stats | undefined;
  const blogStats = s?.byAgent?.['blog-reviewer'];

  const rawJobs = (data?.jobs ?? []) as Job[];
  const hasNext = rawJobs.length === PAGE_SIZE;
  const jobs = applyFilters(rawJobs as unknown as Record<string, unknown>[], clientFilters, COLUMNS) as unknown as Job[];

  const doneCount   = jobs.filter(j => j.status === 'done').length;
  const errorCount  = jobs.filter(j => j.status === 'error').length;
  const activeCount = jobs.filter(j => j.status === 'processing' || j.status === 'pending').length;

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb">
          <span>MI OS</span><span>/</span><strong>Existing Blog Reviewer</strong>
        </div>
        <div className="record-actions">
          <NavLink to="/trigger" state={{ agent: 'blog-reviewer' }} className="sn-btn sn-btn-primary">
            + Run Blog Review
          </NavLink>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Agent view</div>
          <h1 className="page-title">Existing Blog Reviewer</h1>
          <p className="page-sub">Post-publish audit — crawls live URLs and runs a full content, SEO, and conversion review.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" /> blog-reviewer</span>
          <span>Auto-refreshes every 15s</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Total Reviews</div>
            <div className="metric-icon">↗</div>
          </div>
          <div className="metric-value">{blogStats?.jobs ?? '—'}</div>
          <div className="metric-sub">All time</div>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Total Cost</div>
            <div className="metric-icon">$</div>
          </div>
          <div className="metric-value">${(blogStats?.costUsd ?? 0).toFixed(2)}</div>
          <div className="metric-sub">Accumulated</div>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Completed</div>
            <div className="metric-icon">✓</div>
          </div>
          <div className="metric-value">{doneCount}</div>
          <div className="metric-sub">This page</div>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Active / Errors</div>
            <div className="metric-icon">!</div>
          </div>
          <div className="metric-value">{activeCount} / {errorCount}</div>
          <div className="metric-sub">This page</div>
        </div>
      </div>

      <div className="sn-card">
        <div className="list-toolbar">
          <div className="list-title">
            Blog Reviewer Jobs
            <span className="table-name">x_acf_mi_job</span>
            <span className="count">{jobs.length}{hasNext ? '+' : ''}</span>
          </div>
          <div className="toolbar-spacer" />
        </div>

        <FilterBar columns={COLUMNS} value={filters} onChange={f => { setFilters(f); setPage(0); }} />

        <div className="table-wrap">
          {isLoading ? (
            <div className="empty">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="empty">
              No blog reviews yet.{' '}
              <NavLink to="/trigger" state={{ agent: 'blog-reviewer' }} className="record-link">
                Run first review →
              </NavLink>
            </div>
          ) : (
            <table className="sn-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Blog title</th>
                  <th>Status</th>
                  <th>Tokens in</th>
                  <th>Tokens out</th>
                  <th>Cost</th>
                  <th>Source</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                    <td onClick={e => e.stopPropagation()}>
                      <NavLink to={`/jobs/${job.id}`} className="record-link">{jobIdDisplay(job.id)}</NavLink>
                    </td>
                    <td style={{ maxWidth: 300 }} onClick={e => e.stopPropagation()}>
                      <NavLink to={`/jobs/${job.id}`} className="record-link"
                        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.title || '—'}
                      </NavLink>
                    </td>
                    <td><span className={`status ${job.status}`}>{job.status}</span></td>
                    <td className="mono">{job.inputTokens  != null ? job.inputTokens.toLocaleString()  : '—'}</td>
                    <td className="mono">{job.outputTokens != null ? job.outputTokens.toLocaleString() : '—'}</td>
                    <td className="mono">{job.costUsd ? `$${Number(job.costUsd).toFixed(4)}` : '—'}</td>
                    <td><span className="tag">{job.source ?? '—'}</span></td>
                    <td className="muted">{new Date(job.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="list-footer">
          <span>Rows {page * PAGE_SIZE + 1} to {page * PAGE_SIZE + jobs.length}</span>
          <div className="pager">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
            <span>Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!hasNext}>›</button>
          </div>
        </div>
      </div>
    </>
  );
}
