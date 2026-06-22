import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import { api, type Job } from '../lib/api';

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

type SortKey = 'id' | 'agent' | 'title' | 'status' | 'cost' | 'created';

const PAGE_SIZE = 20;

export default function Jobs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [page, setPage]           = useState(0);
  const [agentFilter, setAgentFilter] = useState(searchParams.get('agent') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [listSearch, setListSearch]   = useState(searchParams.get('q') ?? '');
  const [sortBy, setSortBy]       = useState<SortKey | null>(null);
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    setAgentFilter(searchParams.get('agent') ?? '');
    setStatusFilter(searchParams.get('status') ?? '');
    setListSearch(searchParams.get('q') ?? '');
    setPage(0);
  }, [searchParams.toString()]);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', page, agentFilter, statusFilter],
    queryFn: () => api.getJobs({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, agent: agentFilter || undefined, status: statusFilter || undefined }),
    refetchInterval: 15_000,
  });

  const rawJobs = (data?.jobs ?? []) as Job[];
  const hasNext = rawJobs.length === PAGE_SIZE;

  const searched = rawJobs.filter(j => {
    if (!listSearch) return true;
    const q = listSearch.toLowerCase();
    return (
      (j.title ?? '').toLowerCase().includes(q) ||
      agentLabel(j.agentName).toLowerCase().includes(q) ||
      j.status.includes(q) ||
      (j.source ?? '').toLowerCase().includes(q)
    );
  });

  const jobs = sortBy
    ? [...searched].sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        if (sortBy === 'id')      { av = a.id;             bv = b.id;             }
        if (sortBy === 'agent')   { av = a.agentName;      bv = b.agentName;      }
        if (sortBy === 'title')   { av = a.title ?? '';    bv = b.title ?? '';    }
        if (sortBy === 'status')  { av = a.status;         bv = b.status;         }
        if (sortBy === 'cost')    { av = Number(a.costUsd ?? 0); bv = Number(b.costUsd ?? 0); }
        if (sortBy === 'created') { av = a.createdAt;      bv = b.createdAt;      }
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : searched;

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
      jobIdDisplay(j.id),
      agentLabel(j.agentName),
      j.title ?? '',
      j.status,
      j.inputTokens ?? '',
      j.outputTokens ?? '',
      j.costUsd ? Number(j.costUsd).toFixed(4) : '',
      j.source ?? '',
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

  const hasFilter = agentFilter || statusFilter || listSearch;

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
            <span className="count">{jobs.length}{hasNext && !listSearch ? '+' : ''}</span>
          </div>
          {/* List search */}
          <div className="list-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.2-4.2"/></svg>
            <input
              placeholder="Search jobs..."
              value={listSearch}
              onChange={e => { setListSearch(e.target.value); setPage(0); }}
            />
          </div>
          {/* Agent filter */}
          <select className="sn-select" value={agentFilter}
            onChange={e => { setAgentFilter(e.target.value); setPage(0); }}
            style={{ width: 200 }}>
            <option value="">All Agents</option>
            <option value="seo-analyzer">SEO Analyzer</option>
            <option value="blog-reviewer">Existing Blog Reviewer</option>
          </select>
          {/* Status filter */}
          <select className="sn-select" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            style={{ width: 150 }}>
            <option value="">All Statuses</option>
            <option value="done">Done</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
          {hasFilter && (
            <button className="toolbar-icon" onClick={() => { setAgentFilter(''); setStatusFilter(''); setListSearch(''); setPage(0); }}>
              × Clear
            </button>
          )}
          <div className="toolbar-spacer" />
          <button className="toolbar-icon" onClick={exportCSV}>Export</button>
        </div>
        <div className="filter-strip">
          <span>Breadcrumb:</span>
          <span className="condition"><strong>Active</strong> is true</span>
          {sortBy && <span className="condition"><strong>Order</strong> by {sortBy} {sortDir}</span>}
          {!sortBy && <span className="condition"><strong>Order</strong> by Created descending</span>}
        </div>

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
                    Agent
                    <span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('agent')}</span>
                  </th>
                  <th style={thStyle('title')} onClick={() => handleSort('title')}>
                    Short description
                    <span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('title')}</span>
                  </th>
                  <th style={thStyle('status')} onClick={() => handleSort('status')}>
                    Status
                    <span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('status')}</span>
                  </th>
                  <th>Tokens in</th>
                  <th>Tokens out</th>
                  <th style={thStyle('cost')} onClick={() => handleSort('cost')}>
                    Cost
                    <span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('cost')}</span>
                  </th>
                  <th>Source</th>
                  <th style={thStyle('created')} onClick={() => handleSort('created')}>
                    Created
                    <span style={{ fontSize: 10, marginLeft: 3, color: '#7b8a91' }}>{sortIcon('created')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/jobs/${job.id}`)}>
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
                    <td className="mono">{job.inputTokens != null ? job.inputTokens.toLocaleString() : '—'}</td>
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
