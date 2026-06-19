import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';

function agentLabel(name: string) {
  const map: Record<string, string> = { 'seo-analyzer': 'SEO Analyzer', 'blog-reviewer': 'Existing Blog Reviewer' };
  return map[name] ?? name;
}

function jobIdDisplay(id: string) { return id.replace('job-', 'J-').toUpperCase(); }

function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (line.startsWith('# ')) {
      elements.push(<h2 key={i}>{line.slice(2)}</h2>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      const text = line.slice(4);
      const calloutMap: Record<string, string> = { '🔴': 'red', '🟡': 'amber', '🔵': 'blue', '🟢': 'green' };
      const emoji = Object.keys(calloutMap).find(e => text.startsWith(e));
      if (emoji) {
        elements.push(<div key={i} className={`callout ${calloutMap[emoji]}`}>{text}</div>);
      } else {
        elements.push(<h3 key={i}>{text}</h3>);
      }
    } else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(<pre key={i}><code>{codeLines.join('\n')}</code></pre>);
    } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      const checked = line.startsWith('- [x] ');
      elements.push(<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}><input type="checkbox" checked={checked} readOnly style={{ accentColor: '#08763c' }} /><span>{line.slice(6)}</span></div>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i}>{line.slice(2)}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<li key={i}>{line.replace(/^\d+\.\s/, '')}</li>);
    } else if (line.startsWith('|') && !line.replace(/[\|\s\-:]/g, '').length) {
      // skip separator rows
    } else if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      const isHeader = (lines[i + 1] ?? '').startsWith('|--') || (lines[i + 1] ?? '').startsWith('| --');
      elements.push(
        <tr key={i}>{cells.map((c, ci) => isHeader ? <th key={ci}>{c}</th> : <td key={ci}>{c}</td>)}</tr>
      );
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} />);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i}>{line.slice(2)}</blockquote>);
    } else if (line.trim()) {
      elements.push(<p key={i}>{line}</p>);
    }
    i++;
  }
  return <div>{elements}</div>;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('output');
  const [following, setFollowing] = useState(false);
  const [copying, setCopying] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.getJob(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const d = query.state.data;
      return (d?.status === 'processing' || d?.status === 'pending') ? 3000 : false;
    },
  });

  if (isLoading) return <div className="empty">Loading...</div>;
  if (error || !job) return <div className="empty">Record not found.</div>;

  const notionUrl = job.notionPageId ? `https://notion.so/${job.notionPageId.replace(/-/g, '')}` : null;
  const isRunning = job.status === 'processing' || job.status === 'pending';
  const displayId = jobIdDisplay(job.id);

  function handleCopyLink() {
    const url = window.location.href;
    setCopying(true);
    navigator.clipboard.writeText(url).then(() => {
      toast('Record link copied to clipboard', 'success');
    }).catch(() => {
      toast('Failed to copy link', 'error');
    }).finally(() => {
      setTimeout(() => setCopying(false), 1000);
    });
  }

  function handleFollow() {
    setFollowing(f => !f);
    toast(following ? 'Unfollowed this record' : 'Following this record — you\'ll be notified on changes', 'info');
  }

  function handleRunAgain() {
    navigate('/trigger', { state: { agent: job.agentName } });
  }

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb">
          <NavLink to="/jobs">Jobs</NavLink>
          <span>/</span>
          <strong>{displayId}</strong>
        </div>
        <div className="record-actions">
          <button className="sn-btn" onClick={handleFollow} style={following ? { borderColor: '#08763c', color: '#08763c' } : {}}>
            {following ? '★ Following' : '☆ Follow'}
          </button>
          <button className="sn-btn" onClick={() => toast('Update panel — coming soon', 'info')}>Update</button>
          <button className="sn-btn sn-btn-primary" onClick={handleRunAgain}>Run again</button>
        </div>
      </div>

      <div className="record-head">
        <div>
          <div className="record-number">{displayId} · {agentLabel(job.agentName)}</div>
          <h1 className="record-title">{job.title || job.notionPageId || 'Job Detail'}</h1>
          <div className="record-meta">
            <span>Created {new Date(job.createdAt).toLocaleString()}</span>
            {job.source && <span>Source: {job.source}</span>}
          </div>
        </div>
        <span className={`status ${job.status} lg`}>{job.status}</span>
      </div>

      <div className="record-metrics">
        <div className="mini-metric">
          <div className="label">Input Tokens</div>
          <div className="value">{job.inputTokens != null ? job.inputTokens.toLocaleString() : '—'}</div>
        </div>
        <div className="mini-metric">
          <div className="label">Output Tokens</div>
          <div className="value">{job.outputTokens != null ? job.outputTokens.toLocaleString() : '—'}</div>
        </div>
        <div className="mini-metric">
          <div className="label">Cost</div>
          <div className="value">{job.costUsd ? `$${Number(job.costUsd).toFixed(4)}` : '—'}</div>
        </div>
        <div className="mini-metric">
          <div className="label">Source</div>
          <div className="value" style={{ fontFamily: 'var(--sn-font)', fontSize: 16 }}>{job.source ?? '—'}</div>
        </div>
      </div>

      {job.status === 'error' && job.errorMessage && (
        <div className="alert error">Error: {job.errorMessage}</div>
      )}
      {isRunning && (
        <div className="alert running">
          <span className="pulse" />
          Agent is running. This page auto-refreshes every 3 seconds.
        </div>
      )}

      <div className="layout-grid">
        <div className="sn-card">
          <div className="tab-buttons">
            <button className={`tab-btn${activeTab === 'output' ? ' active' : ''}`} onClick={() => setActiveTab('output')}>
              Analysis Output
            </button>
            <button className={`tab-btn${activeTab === 'activity' ? ' active' : ''}`} onClick={() => setActiveTab('activity')}>
              Activity
            </button>
            <button className={`tab-btn${activeTab === 'related' ? ' active' : ''}`} onClick={() => setActiveTab('related')}>
              Related Records
            </button>
          </div>
          {activeTab === 'output' && (
            <div className="md">
              {job.results?.length > 0
                ? <MarkdownView content={job.results[0].content} />
                : <div className="empty">
                    {job.status === 'done'
                      ? 'Analysis written to Notion — no local copy stored for this job.'
                      : 'Output will appear once the job completes.'}
                  </div>
              }
            </div>
          )}
          {activeTab === 'activity' && (
            <div className="empty">
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              Activity log — coming in a future update.
            </div>
          )}
          {activeTab === 'related' && (
            <div className="empty">
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
              No related records found.
            </div>
          )}
        </div>

        <aside className="side-panel">
          <div className="card-header">
            <div className="card-title">Record information</div>
          </div>
          <div className="side-section">
            <div className="kv"><span>State</span><span><span className={`status ${job.status}`}>{job.status}</span></span></div>
            <div className="kv"><span>Agent</span><span>{agentLabel(job.agentName)}</span></div>
            <div className="kv"><span>Source</span><span>{job.source ?? '—'}</span></div>
            <div className="kv"><span>Created</span><span>{new Date(job.createdAt).toLocaleDateString()}</span></div>
            <div className="kv"><span>Updated</span><span>{new Date(job.updatedAt).toLocaleDateString()}</span></div>
          </div>
          <div className="side-section">
            <div className="side-label">Actions</div>
            {notionUrl && (
              <a href={notionUrl} target="_blank" rel="noreferrer"
                className="sn-btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 8, display: 'flex' }}>
                Open in Notion ↗
              </a>
            )}
            <button
              className="sn-btn"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
              onClick={handleCopyLink}
              disabled={copying}>
              {copying ? '✓ Copied!' : 'Copy record link'}
            </button>
            <button
              className="sn-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleRunAgain}>
              ↺ Run again with same agent
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
