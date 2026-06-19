import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, type Stats, type Job } from '../lib/api';

function agentLabel(name: string) {
  const map: Record<string, string> = {
    'seo-analyzer':  'SEO Analyzer',
    'blog-reviewer': 'Existing Blog Reviewer',
  };
  return map[name] ?? name;
}

function jobIdDisplay(id: string) {
  return id.replace('job-', 'J-').toUpperCase();
}

export default function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: api.getStats, refetchInterval: 30_000 });
  const { data: jobsRes, isLoading: jl } = useQuery({ queryKey: ['jobs', 'recent'], queryFn: () => api.getJobs({ limit: 5 }), refetchInterval: 15_000 });

  const s = stats as Stats | undefined;
  const jobs = (jobsRes?.jobs ?? []) as Job[];
  const agentEntries = Object.entries(s?.byAgent ?? {});

  async function handleRefresh() {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  }

  function toggleAll(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedIds(e.target.checked ? new Set(jobs.map(j => j.id)) : new Set());
  }

  function toggleRow(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  const allChecked = jobs.length > 0 && jobs.every(j => selectedIds.has(j.id));

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>Acefone MI</span><span>/</span><strong>Dashboard</strong></div>
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
            <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs?status=error')}>
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
              {selectedIds.size > 0 && (
                <span style={{ fontSize: 12, color: '#365ec9', fontWeight: 700 }}>
                  {selectedIds.size} selected
                </span>
              )}
              <div className="toolbar-spacer" />
              <NavLink to="/jobs" style={{ fontSize: 13, fontWeight: 700, color: 'var(--sn-link)' }}>View all →</NavLink>
            </div>
            <div className="filter-strip">
              <span>Conditions:</span>
              <span className="condition"><strong>Created</strong> on Today</span>
              <span className="condition"><strong>Order</strong> by Created desc</span>
            </div>
            <div className="table-wrap">
              {jl ? (
                <div className="empty">Loading...</div>
              ) : jobs.length === 0 ? (
                <div className="empty">No jobs yet.</div>
              ) : (
                <table className="sn-table">
                  <thead>
                    <tr>
                      <th className="sel">
                        <input type="checkbox" aria-label="Select all"
                          checked={allChecked} onChange={toggleAll} />
                      </th>
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
                      <tr key={job.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/jobs/${job.id}`)}>
                        <td className="sel" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" aria-label="Select row"
                            checked={selectedIds.has(job.id)}
                            onChange={e => toggleRow(job.id, e)} />
                        </td>
                        <td><NavLink to={`/jobs/${job.id}`} className="record-link" onClick={e => e.stopPropagation()}>{jobIdDisplay(job.id)}</NavLink></td>
                        <td>{agentLabel(job.agentName)}</td>
                        <td>
                          <NavLink to={`/jobs/${job.id}`} className="record-link" onClick={e => e.stopPropagation()}>
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
              <span>Rows 1 to {jobs.length} of {jobs.length}</span>
              <div className="pager">
                <button disabled>‹</button>
                <span>Page 1</span>
                <button disabled>›</button>
              </div>
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
            <div className="kv"><span>Open errors</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs?status=error')}>
                <span style={{ color: (s?.byStatus?.['error'] ?? 0) > 0 ? 'var(--sn-red)' : 'inherit', fontWeight: 700 }}>
                  {s?.byStatus?.['error'] ?? 0}
                </span>
              </span>
            </div>
            <div className="kv"><span>Processing</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs?status=processing')}>
                {s?.byStatus?.['processing'] ?? 0}
              </span>
            </div>
            <div className="kv"><span>Pending</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs?status=pending')}>
                {s?.byStatus?.['pending'] ?? 0}
              </span>
            </div>
          </div>
          {agentEntries.length > 0 && (
            <div className="side-section">
              <div className="side-label">Agent breakdown</div>
              <div className="mini-list">
                {agentEntries.map(([name, data]) => (
                  <div key={name} className="mini-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/jobs?agent=${name}`)}>
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
              <NavLink to="/jobs?status=error" className="mini-item">
                <div><strong>View Errors</strong><small>Failed runs only</small></div>
                <span>›</span>
              </NavLink>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
