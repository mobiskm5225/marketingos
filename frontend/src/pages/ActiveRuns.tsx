import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api, type Job, type Stats } from '../lib/api';

function agentLabel(name: string) {
  const map: Record<string, string> = {
    'seo-analyzer':  'SEO Analyzer',
    'blog-reviewer': 'Blog Reviewer',
  };
  return map[name] ?? name;
}

function jobIdDisplay(id: string) {
  return id.replace('job-', 'J-').toUpperCase();
}

function elapsed(createdAt: string, now: number): string {
  const diff = Math.max(0, now - new Date(createdAt).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function sourceLabel(src: string) {
  const map: Record<string, string> = { api: 'API', webhook: 'Webhook', ingest: 'Ingest' };
  return map[src] ?? src;
}

export default function ActiveRuns() {
  const [now, setNow] = useState(Date.now());

  // Live clock — updates every second for elapsed timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: processingData, isLoading: loadingP } = useQuery({
    queryKey: ['jobs', 'processing'],
    queryFn: () => api.getJobs({ limit: 50, status: 'processing' }),
    refetchInterval: 5_000,
  });

  const { data: pendingData, isLoading: loadingQ } = useQuery({
    queryKey: ['jobs', 'pending'],
    queryFn: () => api.getJobs({ limit: 50, status: 'pending' }),
    refetchInterval: 5_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 10_000,
  });

  const s        = statsData as Stats | undefined;
  const running  = (processingData?.jobs ?? []) as Job[];
  const queued   = (pendingData?.jobs   ?? []) as Job[];
  const statuses = (s as any)?.byStatus ?? {};

  const processingCount = statuses.processing ?? running.length;
  const pendingCount    = statuses.pending    ?? queued.length;
  const errorRate       = (s as any)?.errorRate ?? 0;
  const monthCost       = (s as any)?.thisMonthCostUsd ?? 0;

  const isIdle = processingCount === 0 && pendingCount === 0;

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb">
          <span>MI OS</span><span>/</span><strong>Active Runs</strong>
        </div>
        <div className="record-actions">
          <span className="tag">
            <span className="pulse" style={{ color: isIdle ? 'var(--sn-muted)' : 'var(--sn-green)' }} />
            {isIdle ? 'Idle' : 'Live'}
          </span>
          <NavLink to="/trigger" className="sn-btn sn-btn-primary">+ New Run</NavLink>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Live monitor</div>
          <h1 className="page-title">Active Runs</h1>
          <p className="page-sub">Real-time view of processing and queued agent jobs. Refreshes every 5s.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" /> Auto-refresh 5s</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats" style={{ marginBottom: 14 }}>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Now Running</div>
            <div className="metric-icon">▶</div>
          </div>
          <div className="metric-value">{processingCount}</div>
          <div className="metric-sub">agents active</div>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Queued</div>
            <div className="metric-icon">⏳</div>
          </div>
          <div className="metric-value">{pendingCount}</div>
          <div className="metric-sub">waiting to start</div>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Error Rate</div>
            <div className="metric-icon">!</div>
          </div>
          <div className="metric-value">{errorRate}%</div>
          <div className="metric-sub">all time</div>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <div className="metric-label">Month Cost</div>
            <div className="metric-icon">$</div>
          </div>
          <div className="metric-value">${Number(monthCost).toFixed(2)}</div>
          <div className="metric-sub">this month</div>
        </div>
      </div>

      {/* Per-agent live breakdown */}
      {running.length > 0 && (() => {
        const byAgent: Record<string, number> = {};
        running.forEach(j => { byAgent[j.agentName] = (byAgent[j.agentName] ?? 0) + 1; });
        return (
          <div className="sn-card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <div className="card-title">Agent Activity</div>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(byAgent).map(([name, count]) => (
                <div key={name} className="tag" style={{ height: 'auto', padding: '6px 12px', gap: 8 }}>
                  <span className="pulse" style={{ color: 'var(--sn-green)' }} />
                  <span>{agentLabel(name)}</span>
                  <span style={{ fontWeight: 800 }}>{count} running</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Running jobs */}
      <div className="sn-card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div className="card-title">
            Now Running
            <span className="count">{running.length}</span>
          </div>
        </div>

        {loadingP ? (
          <div className="empty">Loading...</div>
        ) : running.length === 0 ? (
          <div className="empty">No agents currently running.</div>
        ) : (
          <div style={{ display: 'grid', gap: 1, background: 'var(--sn-border)' }}>
            {running.map(job => (
              <div key={job.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 14px', background: '#fff',
              }}>
                {/* Pulsing indicator */}
                <span className="pulse" style={{ color: 'var(--sn-green)', flexShrink: 0 }} />

                {/* Agent badge */}
                <span className="tag" style={{ flexShrink: 0 }}>{agentLabel(job.agentName)}</span>

                {/* Title */}
                <span style={{
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: 13, color: '#243841',
                }}>
                  {job.title || '—'}
                </span>

                {/* Elapsed */}
                <span className="mono" style={{ flexShrink: 0, color: 'var(--sn-green-dark)', fontWeight: 700 }}>
                  {elapsed(job.createdAt, now)}
                </span>

                {/* Source */}
                <span className="tag" style={{ flexShrink: 0 }}>{sourceLabel(job.source ?? '')}</span>

                {/* Link */}
                <NavLink to={`/jobs/${job.id}`} className="record-link" style={{ flexShrink: 0 }}>
                  {jobIdDisplay(job.id)}
                </NavLink>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queued jobs */}
      <div className="sn-card">
        <div className="card-header">
          <div className="card-title">
            Queued
            <span className="count">{queued.length}</span>
          </div>
        </div>

        {loadingQ ? (
          <div className="empty">Loading...</div>
        ) : queued.length === 0 ? (
          <div className="empty">Queue is empty.</div>
        ) : (
          <table className="sn-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Agent</th>
                <th>Title</th>
                <th>Source</th>
                <th>Waiting</th>
              </tr>
            </thead>
            <tbody>
              {queued.map(job => (
                <tr key={job.id}>
                  <td>
                    <NavLink to={`/jobs/${job.id}`} className="record-link">{jobIdDisplay(job.id)}</NavLink>
                  </td>
                  <td>{agentLabel(job.agentName)}</td>
                  <td style={{ maxWidth: 300 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {job.title || '—'}
                    </span>
                  </td>
                  <td><span className="tag">{sourceLabel(job.source ?? '')}</span></td>
                  <td className="mono muted">{elapsed(job.createdAt, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
