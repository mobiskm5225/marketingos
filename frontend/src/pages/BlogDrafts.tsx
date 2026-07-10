import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api, type BlogDraft } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { timeAgo } from '../lib/format';

const STATUS_COLOR: Record<string, string> = {
  pending:   '#f0a500',
  in_review: '#1a56a4',
  approved:  '#1f6f35',
  rejected:  '#b42318',
};
const STATUS_BG: Record<string, string> = {
  pending:   '#fffbeb',
  in_review: '#eff6ff',
  approved:  '#f0faf3',
  rejected:  '#fff0f0',
};
const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  in_review: 'In Review',
  approved:  'Approved',
  rejected:  'Rejected',
};

export default function BlogDrafts() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!hasPermission('blog-drafts:manage') && !hasPermission('*')) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#697a82' }}>Access denied — content team only.</div>;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['blog-drafts', statusFilter],
    queryFn: () => api.getBlogDrafts({ status: statusFilter || undefined }),
    refetchInterval: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: api.syncBlogDrafts,
    onSuccess: (r) => {
      toast(`Synced from Notion: ${r.created} new, ${r.updated} updated${r.skipped ? `, ${r.skipped} skipped` : ''}`, 'success');
      qc.invalidateQueries({ queryKey: ['blog-drafts'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const drafts = data?.drafts ?? [];
  const pending   = drafts.filter(d => d.status === 'pending').length;
  const inReview  = drafts.filter(d => d.status === 'in_review').length;

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>Blog Drafts</strong></div>
        <div className="record-actions">
          <select className="sn-input" style={{ padding: '5px 10px', fontSize: 12, minWidth: 150 }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button className="sn-btn sn-btn-primary"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}>
            {syncMutation.isPending ? <><span className="spinner" /> Syncing...</> : '⟳ Sync from Notion'}
          </button>
        </div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Content Team</div>
          <h1 className="page-title">New Blog Drafts</h1>
          <p className="page-sub">Drafts synced from the Notion Blog Tracker. Review before passing to agents.</p>
        </div>
        <div className="title-meta">
          {pending > 0 && <span className="tag"><span className="tag-dot" style={{ background: '#f0a500' }} /> {pending} pending</span>}
          {inReview > 0 && <span className="tag"><span className="tag-dot" style={{ background: '#1a56a4' }} /> {inReview} in review</span>}
        </div>
      </div>

      <div className="sn-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
        ) : drafts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#697a82', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div style={{ marginBottom: 12 }}>No drafts{statusFilter ? ` with status "${STATUS_LABEL[statusFilter] ?? statusFilter}"` : ''}.</div>
            {!statusFilter && (
              <button className="sn-btn" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                {syncMutation.isPending ? 'Syncing...' : '⟳ Sync from Notion Blog Tracker'}
              </button>
            )}
          </div>
        ) : (
          drafts.map(draft => (
            <DraftRow
              key={draft.id}
              draft={draft}
              expanded={expandedId === draft.id}
              onToggle={() => setExpandedId(id => id === draft.id ? null : draft.id)}
              onUpdated={() => qc.invalidateQueries({ queryKey: ['blog-drafts'] })}
            />
          ))
        )}
      </div>
    </>
  );
}

function DraftRow({
  draft,
  expanded,
  onToggle,
  onUpdated,
}: {
  draft: BlogDraft;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [reviewNote, setReviewNote] = useState(draft.reviewNote ?? '');
  const [deciding, setDeciding] = useState(false);

  const mutation = useMutation({
    mutationFn: (body: { status?: string; reviewNote?: string }) =>
      api.updateBlogDraft(draft.id, body),
    onSuccess: () => { onUpdated(); setDeciding(false); },
    onError: (err: Error) => { toast(err.message, 'error'); onUpdated(); },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeBlogDraft(draft.id),
    onSuccess: () => {
      toast('SEO analysis started — result will also appear in Notion', 'success');
      onUpdated();
    },
    onError: (err: Error) => { toast(err.message, 'error'); onUpdated(); },
  });

  const canAnalyze  = hasPermission('agents:trigger:seo-analyzer') || hasPermission('*');
  const wordCount   = draft.content ? draft.content.trim().split(/\s+/).length : 0;
  const contentOk   = wordCount >= 300;
  const analyzable  = (draft.status === 'pending' || draft.status === 'in_review') && canAnalyze;

  function claim() { mutation.mutate({ status: 'in_review' }); }
  function approve() { mutation.mutate({ status: 'approved', reviewNote: reviewNote || undefined }); }
  function reject()  { mutation.mutate({ status: 'rejected',  reviewNote: reviewNote || undefined }); }

  return (
    <div style={{ borderBottom: '1px solid #f0f3f5' }}>
      {/* Row header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer' }}
        onClick={onToggle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
              {draft.title}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              background: STATUS_BG[draft.status] ?? '#f5f7f8',
              color: STATUS_COLOR[draft.status] ?? '#697a82',
            }}>
              {STATUS_LABEL[draft.status] ?? draft.status}
            </span>
            {draft.category && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#f0f4ff', color: '#1a4fa0' }}>
                {draft.category}
              </span>
            )}
            {draft.notionStatus && (
              <span style={{ fontSize: 10, color: '#697a82', border: '1px solid #d5dadd', borderRadius: 999, padding: '1px 7px' }}>
                Notion: {draft.notionStatus}
              </span>
            )}
            {draft.source && (
              <span style={{ fontSize: 10, color: '#9badb5', fontFamily: 'monospace' }}>source: {draft.source}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 3, flexWrap: 'wrap' }}>
            {draft.url && (
              <a href={draft.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: 'var(--sn-link)', textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}>
                {draft.url.length > 60 ? draft.url.slice(0, 60) + '…' : draft.url}
              </a>
            )}
            {draft.publicationDate && (
              <span style={{ fontSize: 11, color: '#697a82' }}>publish: {new Date(draft.publicationDate).toLocaleDateString()}</span>
            )}
            <span style={{ fontSize: 11, color: '#9badb5' }}>{timeAgo(draft.createdAt)}</span>
            {draft.reviewerName && (
              <span style={{ fontSize: 11, color: '#697a82' }}>reviewer: {draft.reviewerName}</span>
            )}
          </div>
        </div>
        <div style={{ color: '#697a82', fontSize: 16, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</div>
      </div>

      {/* Expanded content + actions */}
      {expanded && (
        <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid #f0f3f5' }}>
          {draft.seoKeywords && (
            <div style={{
              background: '#f0f4ff', border: '1px solid #d9e4ff', borderRadius: 6,
              padding: '8px 12px', fontSize: 12, color: '#1a4fa0', marginTop: 12,
              whiteSpace: 'pre-wrap',
            }}>
              <span style={{ fontWeight: 700, marginRight: 6 }}>SEO Keywords:</span>
              {draft.seoKeywords}
            </div>
          )}
          {draft.content ? (
            <div style={{
              background: '#f9fbfc', border: '1px solid #e8edf0', borderRadius: 6,
              padding: '14px 16px', fontSize: 13, color: '#1a2f38', lineHeight: 1.6,
              maxHeight: 320, overflowY: 'auto', marginTop: 12, marginBottom: 16,
              whiteSpace: 'pre-wrap', fontFamily: 'inherit',
            }}>
              {draft.content}
            </div>
          ) : (
            <div style={{ color: '#9badb5', fontSize: 13, padding: '14px 0', marginBottom: 12 }}>
              No content body — URL only draft.
            </div>
          )}

          {/* Existing review note */}
          {draft.reviewNote && !deciding && (
            <div style={{ background: '#fffbeb', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 12, border: '1px solid #f0a50033' }}>
              <span style={{ fontSize: 11, fontWeight: 700, marginRight: 8 }}>Review note:</span>
              {draft.reviewNote}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {analyzable && (
              <button className="sn-btn" style={{ fontSize: 12, color: '#08763c', borderColor: '#08763c', fontWeight: 700 }}
                disabled={analyzeMutation.isPending || !contentOk}
                title={contentOk ? 'Run SEO Analyzer on this draft' : `Needs 300+ words of draft content (has ${wordCount})`}
                onClick={() => analyzeMutation.mutate()}>
                {analyzeMutation.isPending ? <><span className="spinner" /> Starting...</> : '▶ Run SEO Analysis'}
              </button>
            )}
            {draft.lastSeoJobId && (
              <NavLink to={`/jobs/${draft.lastSeoJobId}`} className="sn-btn" style={{ fontSize: 12 }}>
                View analysis →
              </NavLink>
            )}
            {draft.status === 'pending' && (
              <button className="sn-btn sn-btn-primary" style={{ fontSize: 12 }}
                disabled={mutation.isPending}
                onClick={claim}>
                {mutation.isPending ? 'Claiming...' : 'Claim for Review'}
              </button>
            )}

            {draft.status === 'in_review' && !deciding && (
              <button className="sn-btn" style={{ fontSize: 12 }} onClick={() => setDeciding(true)}>
                Decide
              </button>
            )}

            {draft.status === 'in_review' && deciding && (
              <div style={{ width: '100%' }}>
                <textarea
                  className="sn-textarea"
                  placeholder="Add a review note (optional)..."
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  style={{ minHeight: 80, marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="sn-btn" style={{ fontSize: 12, color: '#1f6f35', borderColor: '#1f6f35', fontWeight: 700 }}
                    disabled={mutation.isPending} onClick={approve}>
                    Approve
                  </button>
                  <button className="sn-btn" style={{ fontSize: 12, color: '#b42318', borderColor: '#b42318', fontWeight: 700 }}
                    disabled={mutation.isPending} onClick={reject}>
                    Reject
                  </button>
                  <button className="sn-btn" style={{ fontSize: 12 }} onClick={() => setDeciding(false)}>Cancel</button>
                </div>
              </div>
            )}

            {(draft.status === 'approved' || draft.status === 'rejected') && (
              <span style={{ fontSize: 12, color: '#697a82' }}>
                {draft.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                {draft.reviewedAt ? ` · ${new Date(draft.reviewedAt).toLocaleDateString()}` : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
