import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import { api, type Job } from '../lib/api';
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
  { key: 'id',           label: 'Number',           type: 'text' },
  { key: 'agentName',    label: 'Agent',             type: 'select', options: AGENT_OPTIONS },
  { key: 'title',        label: 'Short description', type: 'text' },
  { key: 'status',       label: 'Status',            type: 'select', options: STATUS_OPTIONS },
  { key: 'inputTokens',  label: 'Tokens in',         type: 'number' },
  { key: 'outputTokens', label: 'Tokens out',        type: 'number' },
  { key: 'costUsd',      label: 'Cost ($)',           type: 'number' },
  { key: 'source',       label: 'Source',            type: 'text' },
  { key: 'createdAt',    label: 'Created',           type: 'date' },
];

function agentLabel(name: string) {
  return AGENT_OPTIONS.find(o => o.value === name)?.label ?? name;
}
function jobIdDisplay(id: string) {
  return id.replace('job-', 'J-').toUpperCase();
}

type SortKey = 'id' | 'agent' | 'title' | 'status' | 'cost' | 'created';

const PAGE_SIZE = 20;

function initFilters(searchParams: URLSearchParams, initialStatus: string): FilterCondition[] {
  const out: FilterCondition[] = [];
  const agent  = searchParams.get('agent');
  const status = searchParams.get('status') ?? initialStatus;
  const q      = searchParams.get('q');
  if (agent)  out.push({ id: crypto.randomUUID(), col: 'agentName', op: 'is', val: agent });
  if (status) out.push({ id: crypto.randomUUID(), col: 'status',    op: 'is', val: status });
  if (q)      out.push({ id: crypto.randomUUID(), col: 'title',     op: 'contains', val: q });
  return out;
}

export default function Jobs({ initialStatus = '' }: { initialStatus?: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [page, setPage]       = useState(0);
  const [filters, setFilters] = useState<FilterCondition[]>(() => initFilters(searchParams, initialStatus));
  const [sortBy, setSortBy]   = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const newFilters = initFilters(searchParams, '');
    if (newFilters.length) { setFilters(newFilters); setPage(0); }
  }, [searchParams.toString()]);

  // Extract backend-compatible params (only exact 'is' matches)
  const backendAgent  = filters.find(f => f.col === 'agentName' && f.op === 'is')?.val;
  const backendStatus = filters.find(f => f.col === 'status'    && f.op === 'is')?.val;

  // Filters that cannot be pushed to backend — applied client-side
  const clientFilters = filters.filter(f =>
    !(f.col === 'agentName' && f.op === 'is') &&
    !(f.col === 'status'    && f.op === 'is')
  );

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', page, backendAgent, backendStatus],
    queryFn: () => api.getJobs({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      agent:  backendAgent  || undefined,
      status: backendStatus || undefined,
    }),
    refetchInterval: 15_000,
  });

  const rawJobs = (data?.jobs ?? []) as Job[];
  const hasNext = rawJobs.length === PAGE_SIZE;

  const filtered = applyFilters(rawJobs as unknown as Record<string, unknown>[], clientFilters, COLUMNS) as unknown as Job[];

  const jobs = sortBy
    ? [...filtered].sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        if (sortBy === 'id')      { av = a.id;                      bv = b.id; }
        if (sortBy === 'agent')   { av = a.agentName;               bv = b.agentName; }
        if (sortBy === 'title')   { av = a.title ?? '';             bv = b.title ?? ''; }
        if (sortBy === 'status')  { av = a.status;                  bv = b.status; }
        if (sortBy === 'cost')    { av = Number(a.costUsd ?? 0);    bv = Number(b.costUsd ?? 0); }
        if (sortBy === 'created') { av = a.createdAt;               bv = b.createdAt; }
        const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  function handleSort(col: SortKey) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  function sortIcon(col: SortKey) {
    if (sortBy !== col) return '⇅';
    return sortDir === 'asc' ? '▲' : '▼';
  }

  function exportCSV() {
    const headers = ['ID', 'Agent', 'Title', 'Status', 'Tokens In', 'Tokens Out', 'Cost', 'Source', 'Created'];
    const rows = jobs.map(j => [
      jobIdDisplay(j.id), agentLabel(j.agentName), j.title ?? '', j.status,
      j.inputTokens ?? '', j.outputTokens ?? '',
      j.costUsd ? Number(j.costUsd).toFixed(4) : '', j.source ?? '',
      new Date(j.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'jobs.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function thStyle(col: SortKey): React.CSSProperties {
    return { cursor: 'pointer', userSelect: 'none', background: sortBy === col ? '#e8ecf0' : undefined };
  }

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>Acefone MI</span><span>/</span><strong>Jobs</strong></div>
        <div className="record-actions">
          <NavLink to="/trigger" className="sn-btn sn-btn-primary">+ New</NavLink>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Record list</div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-sub">All agent run records — newest first.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" /> Workspace</span>
          <span>Refreshes every 15s</span>
        </div>
      </div>

      <div className="sn-card">
        <div className="list-toolbar">
          <div className="list-title">
            Jobs
            <span className="table-name">x_acf_mi_job</span>
            <span className="count">{jobs.length}{hasNext && !clientFilters.length ? '+' : ''}</span>
          </div>
          <div className="toolbar-spacer" />
          <button className="toolbar-icon" onClick={exportCSV}>Export</button>
        </div>

        <FilterBar columns={COLUMNS} value={filters} onChange={f => { setFilters(f); setPage(0); }} />

        <div className="table-wrap">
          {isLoading ? (
            <div className="empty">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="empty">No records match the current filter.</div>
          ) : (
            <table className="sn-table">
              <thead>
                <tr>
                  <th style={thStyle('id')} onClick={() => handleSort('id')}>
                    <span className="sort">Number</span>
                    <span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('id')}</span>
                  </th>
                  <th style={thStyle('agent')} onClick={() => handleSort('agent')}>
                    Agent<span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('agent')}</span>
                  </th>
                  <th style={thStyle('title')} onClick={() => handleSort('title')}>
                    Short description<span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('title')}</span>
                  </th>
                  <th style={thStyle('status')} onClick={() => handleSort('status')}>
                    Status<span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('status')}</span>
                  </th>
                  <th>Tokens in</th>
                  <th>Tokens out</th>
                  <th style={thStyle('cost')} onClick={() => handleSort('cost')}>
                    Cost<span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('cost')}</span>
                  </th>
                  <th>Source</th>
                  <th style={thStyle('created')} onClick={() => handleSort('created')}>
                    Created<span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('created')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                    <td onClick={e => e.stopPropagation()}>
                      <NavLink to={`/jobs/${job.id}`} className="record-link">{jobIdDisplay(job.id)}</NavLink>
                    </td>
                    <td>{agentLabel(job.agentName)}</td>
                    <td style={{ maxWidth: 280 }} onClick={e => e.stopPropagation()}>
                      <NavLink to={`/jobs/${job.id}`} className="record-link"
                        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.title || job.notionPageId || '—'}
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
