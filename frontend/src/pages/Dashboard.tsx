import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, type Stats, type Job } from '../lib/api';
import FilterBar, { type FilterCondition, type ColumnDef } from '../components/FilterBar';
import { applyFilters } from '../lib/filterUtils';

const AGENT_OPTIONS = [
  { value: 'seo-analyzer',  label: 'SEO Analyzer' },
  { value: 'blog-reviewer', label: 'Existing Blog Reviewer' },
];
const STATUS_OPTIONS = [
  { value: 'done',       label: 'Done'       },
  { value: 'processing', label: 'Processing' },
  { value: 'pending',    label: 'Pending'    },
  { value: 'error',      label: 'Error'      },
];

const COLUMNS: ColumnDef[] = [
  { key: 'id',        label: 'Number',           type: 'text' },
  { key: 'agentName', label: 'Agent',             type: 'select', options: AGENT_OPTIONS },
  { key: 'title',     label: 'Short description', type: 'text' },
  { key: 'status',    label: 'Status',            type: 'select', options: STATUS_OPTIONS },
  { key: 'costUsd',   label: 'Cost ($)',           type: 'number' },
  { key: 'source',    label: 'Source',            type: 'text' },
  { key: 'createdAt', label: 'Created',           type: 'date' },
];

function agentLabel(name: string) {
  return AGENT_OPTIONS.find(o => o.value === name)?.label ?? name;
}
function jobIdDisplay(id: string) {
  return id.replace('job-', 'J-').toUpperCase();
}

export default function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 30_000,
  });

  const { data: jobsRes, isLoading: jl } = useQuery({
    queryKey: ['jobs', 'recent'],
    queryFn: () => api.getJobs({ limit: 20 }),
    refetchInterval: 15_000,
  });

  const s = stats as Stats | undefined;
  const rawJobs = (jobsRes?.jobs ?? []) as Job[];
  const jobs = applyFilters(rawJobs as unknown as Record<string, unknown>[], filters, COLUMNS) as unknown as Job[];
  const agentEntries = Object.entries(s?.byAgent ?? {});

  async function handleRefresh() {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>Dashboard</strong></div>
        <div className="record-actions">
          <button className="sn-btn" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <><span className="spinner" /> Refreshing...</> : 'Refresh'}
          </button>
          <NavLink to="/trigger" className="sn-btn sn-btn-primary">+ Trigger Agent</NavLink>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Workspace overview</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Agent runs, cost tracking, system health, and recent activity.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" style={{ background: '#63cc66' }} /> Live</span>
          <span>Auto-refreshes every 30s</span>
        </div>
      </div>

      <div className="layout-grid">
        <div>
          <div className="stats">
            <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs')}>
              <div>
                <div className="metric-head">
                  <div className="metric-label">Total Jobs</div>
                  <div className="metric-icon">↗</div>
                </div>
                <div className="metric-value">{s?.totalJobs ?? '—'}</div>
              </div>
              <div className="metric-sub">All records</div>
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-head">
                  <div className="metric-label">This Month</div>
                  <div className="metric-icon">$</div>
                </div>
                <div className="metric-value">${(s?.thisMonthCostUsd ?? 0).toFixed(2)}</div>
              </div>
              <div className="metric-sub">Total ${(s?.totalCostUsd ?? 0).toFixed(4)}</div>
            </div>
            <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/errors')}>
              <div>
                <div className="metric-head">
                  <div className="metric-label">Error Rate</div>
                  <div className="metric-icon">!</div>
                </div>
                <div className="metric-value">{s?.errorRate ?? 0}%</div>
              </div>
              <div className="metric-sub">{s?.byStatus?.['error'] ?? 0} failed</div>
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-head">
                  <div className="metric-label">Active Agents</div>
                  <div className="metric-icon">✓</div>
                </div>
                <div className="metric-value">{agentEntries.length}</div>
              </div>
              <div className="metric-sub">Operational</div>
            </div>
          </div>

          <div className="sn-card">
            <div className="list-toolbar">
              <div className="list-title">
                Recent Jobs
                <span className="table-name">x_acf_mi_job</span>
                <span className="count">{jobs.length}</span>
              </div>
              <div className="toolbar-spacer" />
              <NavLink to="/jobs" style={{ fontSize: 13, fontWeight: 700, color: 'var(--sn-link)' }}>View all →</NavLink>
            </div>

            <FilterBar columns={COLUMNS} value={filters} onChange={setFilters} />

            <div className="table-wrap">
              {jl ? (
                <div className="empty">Loading...</div>
              ) : jobs.length === 0 ? (
                <div className="empty">No jobs match the current filter.</div>
              ) : (
                <table className="sn-table">
                  <thead>
                    <tr>
                      <th><span className="sort">Number</span></th>
                      <th>Agent</th>
                      <th>Short description</th>
                      <th>Status</th>
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
                        <td>{agentLabel(job.agentName)}</td>
                        <td style={{ maxWidth: 260 }} onClick={e => e.stopPropagation()}>
                          <NavLink to={`/jobs/${job.id}`} className="record-link"
                            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {job.title || job.notionPageId || '—'}
                          </NavLink>
                        </td>
                        <td><span className={`status ${job.status}`}>{job.status}</span></td>
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
              <span>Showing {jobs.length} of {rawJobs.length} recent records</span>
            </div>
          </div>
        </div>

        <aside className="side-panel">
          <div className="card-header">
            <div className="card-title">Workspace context</div>
          </div>
          <div className="side-section">
            <div className="side-label">System health</div>
            <div className="kv"><span>Queue status</span><span>Normal</span></div>
            <div className="kv">
              <span>Open errors</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/errors')}>
                <span style={{ color: (s?.byStatus?.['error'] ?? 0) > 0 ? 'var(--sn-red)' : 'inherit', fontWeight: 700 }}>
                  {s?.byStatus?.['error'] ?? 0}
                </span>
              </span>
            </div>
            <div className="kv">
              <span>Processing</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs/active')}>
                {s?.byStatus?.['processing'] ?? 0}
              </span>
            </div>
            <div className="kv">
              <span>Pending</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs/active')}>
                {s?.byStatus?.['pending'] ?? 0}
              </span>
            </div>
          </div>
          {agentEntries.length > 0 && (
            <div className="side-section">
              <div className="side-label">Agent breakdown</div>
              <div className="mini-list">
                {agentEntries.map(([name, data]) => (
                  <div key={name} className="mini-item" style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/jobs`)}>
                    <div>
                      <strong>{agentLabel(name)}</strong>
                      <small>{data.jobs} jobs · Operational</small>
                    </div>
                    <span className="mono">${data.costUsd.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="side-section">
            <div className="side-label">Quick links</div>
            <div className="mini-list">
              <NavLink to="/trigger" className="mini-item">
                <div><strong>Trigger Agent</strong><small>Create a new job</small></div>
                <span>›</span>
              </NavLink>
              <NavLink to="/jobs" className="mini-item">
                <div><strong>All Jobs</strong><small>Open record list</small></div>
                <span>›</span>
              </NavLink>
              <NavLink to="/errors" className="mini-item">
                <div><strong>View Errors</strong><small>Failed runs only</small></div>
                <span>›</span>
              </NavLink>
              <NavLink to="/jobs/active" className="mini-item">
                <div><strong>Active Runs</strong><small>Live monitor</small></div>
                <span>›</span>
              </NavLink>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
