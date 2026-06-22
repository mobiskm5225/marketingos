import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, type Job } from '../lib/api';
import FilterBar, { type FilterCondition, type ColumnDef } from '../components/FilterBar';
import { applyFilters } from '../lib/filterUtils';

const AGENT_OPTIONS = [
  { value: 'seo-analyzer',  label: 'SEO Analyzer' },
  { value: 'blog-reviewer', label: 'Existing Blog Reviewer' },
];

const COLUMNS: ColumnDef[] = [
  { key: 'id',           label: 'Number',        type: 'text' },
  { key: 'agentName',    label: 'Agent',          type: 'select', options: AGENT_OPTIONS },
  { key: 'title',        label: 'Title',          type: 'text' },
  { key: 'errorMessage', label: 'Error message',  type: 'text' },
  { key: 'source',       label: 'Source',         type: 'text' },
  { key: 'createdAt',    label: 'Created',        type: 'date' },
];

function agentLabel(name: string) {
  return AGENT_OPTIONS.find(o => o.value === name)?.label ?? name;
}
function jobIdDisplay(id: string) {
  return id.replace('job-', 'J-').toUpperCase();
}

const PAGE_SIZE = 20;

export default function Errors() {
  const navigate = useNavigate();
  const [page, setPage]       = useState(0);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', 'errors', page],
    queryFn: () => api.getJobs({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, status: 'error' }),
    refetchInterval: 15_000,
  });

  const rawJobs = (data?.jobs ?? []) as Job[];
  const hasNext = rawJobs.length === PAGE_SIZE;
  const jobs = applyFilters(rawJobs as unknown as Record<string, unknown>[], filters, COLUMNS) as unknown as Job[];

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb">
          <span>MI OS</span><span>/</span><strong>Errors</strong>
        </div>
        <div className="record-actions">
          <button className="sn-btn" onClick={() => refetch()}>Refresh</button>
          <NavLink to="/trigger" className="sn-btn sn-btn-primary">+ New Run</NavLink>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Error log</div>
          <h1 className="page-title">Failed Runs</h1>
          <p className="page-sub">Agent jobs that encountered errors. Review messages and re-trigger as needed.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" /> Error view</span>
          <span>Auto-refreshes every 15s</span>
        </div>
      </div>

      <div className="sn-card">
        <div className="list-toolbar">
          <div className="list-title">
            Errors
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
            <div className="empty">No errors found — all agent runs completed successfully.</div>
          ) : (
            <table className="sn-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Agent</th>
                  <th>Title</th>
                  <th>Error message</th>
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
                    <td style={{ maxWidth: 220 }} onClick={e => e.stopPropagation()}>
                      <NavLink to={`/jobs/${job.id}`} className="record-link"
                        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.title || '—'}
                      </NavLink>
                    </td>
                    <td style={{ maxWidth: 340 }}>
                      <span className="mono" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.errorMessage ?? 'No message captured'}
                      </span>
                    </td>
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
