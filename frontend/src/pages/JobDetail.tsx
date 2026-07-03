import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { agentLabel, jobIdDisplay } from '../lib/format';
import { Skeleton } from '../components/Skeleton';

const REVIEW_STATUS_COLOR: Record<string, string> = {
  pending_review: '#f0a500', under_review: '#1a56a4', reviewed: '#6b7280',
  approved: '#1f6f35', rejected: '#b42318', needs_changes: '#92400e',
};
const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending Review', under_review: 'Under Review', reviewed: 'Reviewed',
  approved: 'Approved', rejected: 'Rejected', needs_changes: 'Needs Changes',
};

function ReviewPanel({ jobId, jobStatus }: { jobId: string; jobStatus: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, hasPermission, isManagerInGroup } = useAuth();
  const [reviewNote, setReviewNote] = useState('');
  const [leadComment, setLeadComment] = useState('');
  const [showDecidePanel, setShowDecidePanel] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['review', jobId],
    queryFn: () => api.getJobReview(jobId),
    enabled: jobStatus === 'done',
    retry: false,
  });

  const review = data?.review;
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['review', jobId] }); qc.invalidateQueries({ queryKey: ['reviews'] }); };
  // On failure (e.g. 409 when someone else claimed first) surface the backend
  // message and refetch so stale action buttons disappear.
  const onError = (err: Error) => { toast(err.message, 'error'); invalidate(); };

  const claimMutation    = useMutation({ mutationFn: () => api.claimReview(jobId),    onSuccess: invalidate, onError });
  const submitMutation   = useMutation({ mutationFn: () => api.submitReview(jobId, reviewNote), onSuccess: () => { invalidate(); setReviewNote(''); }, onError });
  const approveMutation  = useMutation({ mutationFn: () => api.approveReview(jobId, leadComment || undefined), onSuccess: () => { invalidate(); setLeadComment(''); setShowDecidePanel(false); }, onError });
  const rejectMutation   = useMutation({ mutationFn: () => api.rejectReview(jobId, leadComment || undefined), onSuccess: () => { invalidate(); setLeadComment(''); setShowDecidePanel(false); }, onError });
  const changesMutation  = useMutation({ mutationFn: () => api.needsChanges(jobId, leadComment), onSuccess: () => { invalidate(); setLeadComment(''); setShowDecidePanel(false); }, onError });

  if (jobStatus !== 'done') {
    return <div className="empty">Review available once job completes.</div>;
  }
  if (isLoading) return <div className="empty" style={{ padding: 20 }}>Loading review...</div>;
  if (!review) return <div className="empty">No review record for this job.</div>;

  const isMyReview  = review.reviewerName === user?.username;
  const canClaim    = hasPermission('jobs:review') && (review.status === 'pending_review' || review.status === 'needs_changes');
  const canSubmit   = isMyReview && review.status === 'under_review';
  const isManager   = hasPermission('jobs:approve') && isManagerInGroup(review.groupName);
  const canDecide   = isManager && review.status === 'reviewed';

  return (
    <div style={{ padding: 20 }}>
      {/* Status header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{
          fontWeight: 800, fontSize: 13, padding: '4px 12px', borderRadius: 6,
          background: review.status === 'approved' ? '#f0faf3' : review.status === 'rejected' ? '#fff0f0' : '#f5f7f8',
          color: REVIEW_STATUS_COLOR[review.status] ?? '#697a82',
          border: `1px solid ${REVIEW_STATUS_COLOR[review.status] ?? '#e8edf0'}22`,
        }}>
          {REVIEW_STATUS_LABEL[review.status] ?? review.status}
        </span>
        <span style={{ fontSize: 12, color: '#697a82' }}>Group: <strong>{review.groupName}</strong></span>
      </div>

      {/* Reviewer step */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: ['under_review','reviewed','approved','rejected','needs_changes'].includes(review.status) ? '#e8f4ea' : '#f0f3f5',
            color: ['under_review','reviewed','approved','rejected','needs_changes'].includes(review.status) ? '#1f6f35' : '#9badb5',
            fontSize: 13, fontWeight: 800,
          }}>1</div>
          <div style={{ width: 2, flex: 1, background: '#e8edf0', margin: '4px 0' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38', marginBottom: 4 }}>
            Member Review
            {review.reviewerName && <span style={{ marginLeft: 8, fontWeight: 400, color: '#697a82', fontSize: 12 }}>by {review.reviewerName}</span>}
          </div>
          {review.reviewNote && (
            <div style={{ background: '#f5f7f8', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#1a2f38', marginBottom: 10, border: '1px solid #e8edf0' }}>
              {review.reviewNote}
            </div>
          )}
          {canClaim && (
            <button className="sn-btn sn-btn-primary" style={{ fontSize: 12 }}
              disabled={claimMutation.isPending}
              onClick={() => claimMutation.mutate()}>
              {claimMutation.isPending ? 'Claiming...' : 'Claim for Review'}
            </button>
          )}
          {canSubmit && (
            <div>
              <textarea
                className="sn-textarea"
                placeholder="Add your review notes — observations, issues found, suggestions..."
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                style={{ minHeight: 100, marginBottom: 8 }}
              />
              <button className="sn-btn sn-btn-primary" style={{ fontSize: 12 }}
                disabled={!reviewNote.trim() || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lead/Manager step */}
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: ['approved','rejected'].includes(review.status) ? '#e8f4ea' : '#f0f3f5',
            color: ['approved','rejected'].includes(review.status) ? '#1f6f35' : '#9badb5',
            fontSize: 13, fontWeight: 800,
          }}>2</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38', marginBottom: 4 }}>
            Manager Decision
            {review.leadName && <span style={{ marginLeft: 8, fontWeight: 400, color: '#697a82', fontSize: 12 }}>by {review.leadName}</span>}
          </div>
          {review.leadComment && (
            <div style={{ background: '#fffbeb', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#1a2f38', marginBottom: 10, border: '1px solid #f0a50033' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginRight: 8 }}>Manager comment:</span>
              {review.leadComment}
            </div>
          )}
          {canDecide && !showDecidePanel && (
            <button className="sn-btn" style={{ fontSize: 12 }} onClick={() => setShowDecidePanel(true)}>
              Make Decision
            </button>
          )}
          {canDecide && showDecidePanel && (
            <div>
              <textarea
                className="sn-textarea"
                placeholder="Optional comment for the reviewer..."
                value={leadComment}
                onChange={e => setLeadComment(e.target.value)}
                style={{ minHeight: 80, marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sn-btn" style={{ fontSize: 12, color: '#1f6f35', borderColor: '#1f6f35', fontWeight: 700 }}
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate()}>
                  Approve
                </button>
                <button className="sn-btn" style={{ fontSize: 12, color: '#92400e', borderColor: '#f0a500', fontWeight: 700 }}
                  disabled={!leadComment.trim() || changesMutation.isPending}
                  onClick={() => changesMutation.mutate()}>
                  Request Changes
                </button>
                <button className="sn-btn" style={{ fontSize: 12, color: '#b42318', borderColor: '#b42318', fontWeight: 700 }}
                  disabled={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate()}>
                  Reject
                </button>
                <button className="sn-btn" style={{ fontSize: 12 }} onClick={() => setShowDecidePanel(false)}>Cancel</button>
              </div>
            </div>
          )}
          {review.status === 'pending_review' && (
            <div style={{ color: '#9badb5', fontSize: 12 }}>Waiting for member review...</div>
          )}
          {review.status === 'under_review' && !isManager && (
            <div style={{ color: '#9badb5', fontSize: 12 }}>Waiting for reviewer to submit...</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline markdown: `code`, **bold**, *italic*, ~~strike~~, [text](url).
// Bold content is parsed recursively so nested italic/code render too.
function renderInline(text: string, keyPrefix = ''): React.ReactNode[] {
  const re = /(`[^`]+`)|(\*\*(.+?)\*\*)|(\*([^*\n]+)\*)|(~~(.+?)~~)|(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}${k++}`;
    if (m[1]) {
      nodes.push(<code key={key}>{m[1].slice(1, -1)}</code>);
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={key}>{renderInline(m[3], `${key}-`)}</strong>);
    } else if (m[5] !== undefined) {
      nodes.push(<em key={key}>{m[5]}</em>);
    } else if (m[7] !== undefined) {
      nodes.push(<del key={key}>{m[7]}</del>);
    } else if (m[9] !== undefined) {
      nodes.push(<a key={key} href={m[10]} target="_blank" rel="noreferrer">{m[9]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let tableRows: React.ReactNode[] = [];
  let keyCount = 0;

  function flushList() {
    if (!listItems.length) return;
    const key = `list-${keyCount++}`;
    elements.push(listType === 'ul' ? <ul key={key}>{listItems}</ul> : <ol key={key}>{listItems}</ol>);
    listItems = [];
    listType = null;
  }

  function flushTable() {
    if (!tableRows.length) return;
    elements.push(<table key={`tbl-${keyCount++}`}><tbody>{tableRows}</tbody></table>);
    tableRows = [];
  }

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      flushList(); flushTable();
      const checked = line.startsWith('- [x] ');
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
          <input type="checkbox" checked={checked} readOnly style={{ accentColor: '#08763c' }} />
          <span>{renderInline(line.slice(6), `cb${i}-`)}</span>
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushTable();
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(<li key={i}>{renderInline(line.slice(2), `li${i}-`)}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      flushTable();
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(<li key={i}>{renderInline(line.replace(/^\d+\.\s/, ''), `li${i}-`)}</li>);
    } else if (line.startsWith('|') && !line.replace(/[\|\s\-:]/g, '').length) {
      // table separator — skip without flushing
    } else if (line.startsWith('|')) {
      flushList();
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      const nextLine = lines[i + 1] ?? '';
      const isHeader = nextLine.startsWith('|--') || nextLine.startsWith('| --');
      tableRows.push(<tr key={i}>{cells.map((c, ci) => isHeader ? <th key={ci}>{renderInline(c, `th${i}-${ci}-`)}</th> : <td key={ci}>{renderInline(c, `td${i}-${ci}-`)}</td>)}</tr>);
    } else {
      flushList(); flushTable();
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i}>{renderInline(line.slice(2), `h${i}-`)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i}>{renderInline(line.slice(3), `h${i}-`)}</h2>);
      } else if (line.startsWith('### ')) {
        const text = line.slice(4);
        const calloutMap: Record<string, string> = { '🔴': 'red', '🟡': 'amber', '🔵': 'blue', '🟢': 'green' };
        const emoji = Object.keys(calloutMap).find(e => text.startsWith(e));
        if (emoji) {
          elements.push(<div key={i} className={`callout ${calloutMap[emoji]}`}>{renderInline(text, `co${i}-`)}</div>);
        } else {
          elements.push(<h3 key={i}>{renderInline(text, `h${i}-`)}</h3>);
        }
      } else if (line.startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
        elements.push(<pre key={i}><code>{codeLines.join('\n')}</code></pre>);
      } else if (line.startsWith('---')) {
        elements.push(<hr key={i} />);
      } else if (line.startsWith('> ')) {
        elements.push(<blockquote key={i}>{renderInline(line.slice(2), `bq${i}-`)}</blockquote>);
      } else if (line.trim()) {
        elements.push(<p key={i}>{renderInline(line, `p${i}-`)}</p>);
      }
    }
    i++;
  }

  flushList();
  flushTable();

  return <div>{elements}</div>;
}

function JobDetailSkeleton() {
  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><NavLink to="/jobs">Jobs</NavLink><span>/</span><Skeleton width={90} /></div>
      </div>
      <div className="record-head">
        <div style={{ flex: 1 }}>
          <Skeleton width={160} height={12} style={{ marginBottom: 8 }} />
          <Skeleton width="55%" height={22} style={{ display: 'block', marginBottom: 10 }} />
          <Skeleton width={240} height={12} />
        </div>
        <Skeleton width={80} height={28} />
      </div>
      <div className="record-metrics">
        {[0, 1, 2, 3].map(n => (
          <div key={n} className="mini-metric">
            <Skeleton width={70} height={10} style={{ display: 'block', marginBottom: 8 }} />
            <Skeleton width={54} height={18} />
          </div>
        ))}
      </div>
      <div className="sn-card" style={{ padding: 20 }}>
        <Skeleton width="90%" height={13} style={{ display: 'block', marginBottom: 10 }} />
        <Skeleton width="75%" height={13} style={{ display: 'block', marginBottom: 10 }} />
        <Skeleton width="85%" height={13} style={{ display: 'block' }} />
      </div>
    </>
  );
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(
    (location.state as { openReview?: boolean } | null)?.openReview ? 'review' : 'output'
  );
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

  if (isLoading) return <JobDetailSkeleton />;
  if (error || !job) {
    return (
      <div className="empty">
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2f38', marginBottom: 8 }}>Record not found</div>
        <div style={{ marginBottom: 16 }}>This job may have been removed, or the link is incorrect.</div>
        <NavLink to="/jobs" className="sn-btn" style={{ display: 'inline-flex' }}>Back to Jobs</NavLink>
      </div>
    );
  }

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

  function handleRunAgain() {
    navigate('/trigger', { state: { agent: job!.agentName } });
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
            <button className={`tab-btn${activeTab === 'review' ? ' active' : ''}`} onClick={() => setActiveTab('review')}>
              Review
            </button>
          </div>
          {activeTab === 'output' && (
            <div className="md">
              {job.results?.length > 0
                ? <MarkdownView content={job.results[0].content} />
                : <div className="empty">
                    {job.status === 'done'
                      ? <>
                          <div style={{ marginBottom: 10 }}>The full analysis was written to the linked Notion page.</div>
                          {notionUrl && (
                            <a href={notionUrl} target="_blank" rel="noreferrer" className="sn-btn" style={{ display: 'inline-flex' }}>
                              Open analysis in Notion ↗
                            </a>
                          )}
                        </>
                      : 'Output will appear once the job completes.'}
                  </div>
              }
            </div>
          )}
          {activeTab === 'review' && id && (
            <ReviewPanel jobId={id} jobStatus={job.status} />
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
