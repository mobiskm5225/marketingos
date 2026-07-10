import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api, fetchImageUrl, type LinkedinPost, type LinkedinCreative } from '../lib/api';
import { useToast } from '../lib/toast';
import { timeAgo } from '../lib/format';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', generating: 'Generating', done: 'Done', error: 'Error',
};

function statusClass(status: string): string {
  // reuse job status badge styles: pending/processing/done/error
  return status === 'generating' ? 'processing' : status;
}

interface PreviewData {
  url: string;
  creativeId: string;
  title: string;
  caption: string | null;
}

// Fullscreen lightbox — Esc or backdrop click closes, download stays available
function Lightbox({ preview, onClose }: { preview: PreviewData; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(5, 20, 65, 0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview.title}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a href={preview.url} download={`linkedin-creative-${preview.creativeId}.png`}
              className="sn-btn" style={{ fontSize: 12 }}>
              ⬇ Download
            </a>
            <button className="sn-btn" style={{ fontSize: 12 }} onClick={onClose} title="Close (Esc)">✕ Close</button>
          </div>
        </div>
        <img src={preview.url} alt={preview.title}
          style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 110px)', objectFit: 'contain', borderRadius: 8, background: '#fff' }} />
        {preview.caption && (
          <div style={{ color: '#D6E0FB', fontSize: 13, marginTop: 10, maxWidth: 900, lineHeight: 1.5 }}>
            {preview.caption}
          </div>
        )}
      </div>
    </div>
  );
}

function CreativeImage({ creativeId, alt, caption, onPreview }: {
  creativeId: string;
  alt: string;
  caption: string | null;
  onPreview: (p: PreviewData) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    fetchImageUrl(`/linkedin/creatives/${creativeId}/image`)
      .then(u => { revoked = u; setUrl(u); })
      .catch(() => setError(true));
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, [creativeId]);

  if (error) return <div className="empty" style={{ padding: 20 }}>Image unavailable</div>;
  if (!url) return <span className="skeleton" style={{ width: '100%', height: 180, display: 'block' }} />;
  return (
    <div style={{ position: 'relative', cursor: 'zoom-in' }}
      title="Click to preview"
      onClick={() => onPreview({ url, creativeId, title: alt, caption })}>
      <img src={url} alt={alt} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
      <span style={{
        position: 'absolute', right: 8, bottom: 8,
        background: 'rgba(5,20,65,.65)', color: '#fff', borderRadius: 4,
        fontSize: 11, fontWeight: 700, padding: '3px 8px', pointerEvents: 'none',
      }}>
        🔍 Preview
      </span>
    </div>
  );
}

function PostRow({ post, expanded, onToggle, onUpdated, onPreview }: {
  post: LinkedinPost;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: () => void;
  onPreview: (p: PreviewData) => void;
}) {
  const { toast } = useToast();

  const { data } = useQuery({
    queryKey: ['linkedin-post', post.id],
    queryFn: () => api.getLinkedinPost(post.id),
    enabled: expanded,
    refetchInterval: post.status === 'generating' ? 5000 : false,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateLinkedinCreatives(post.id),
    onSuccess: () => { toast('Creative generation started', 'success'); onUpdated(); },
    onError: (err: Error) => { toast(err.message, 'error'); onUpdated(); },
  });

  const creatives: LinkedinCreative[] = data?.creatives ?? [];

  return (
    <div style={{ borderBottom: '1px solid #f0f3f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer' }}
        onClick={onToggle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
              {post.title || post.content.slice(0, 70)}
            </span>
            <span className={`status ${statusClass(post.status)}`}>{STATUS_LABEL[post.status] ?? post.status}</span>
            {(post.creativeCount ?? 0) > 0 && (
              <span className="tag">{post.creativeCount} creatives</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: '#9badb5' }}>{timeAgo(post.createdAt)}</span>
            {post.source && <span style={{ fontSize: 10, color: '#9badb5', fontFamily: 'monospace' }}>source: {post.source}</span>}
          </div>
        </div>
        <div style={{ color: '#697a82', fontSize: 16, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</div>
      </div>

      {expanded && (
        <div style={{ padding: '0 18px 18px' }}>
          {post.errorMessage && <div className="alert error">{post.errorMessage}</div>}

          <div style={{
            background: '#f9fbfc', border: '1px solid #e8edf0', borderRadius: 6,
            padding: '12px 14px', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            maxHeight: 220, overflowY: 'auto', marginBottom: 14,
          }}>
            {post.content}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className="sn-btn sn-btn-primary" style={{ fontSize: 12 }}
              disabled={generateMutation.isPending || post.status === 'generating'}
              onClick={() => generateMutation.mutate()}>
              {post.status === 'generating'
                ? <><span className="spinner" /> Generating...</>
                : creatives.length > 0 ? '↺ Regenerate creatives' : '▶ Generate creatives'}
            </button>
            {post.lastJobId && (
              <NavLink to={`/jobs/${post.lastJobId}`} className="sn-btn" style={{ fontSize: 12 }}>
                View job →
              </NavLink>
            )}
          </div>

          {post.status === 'generating' && creatives.length === 0 && (
            <div className="alert running"><span className="pulse" /> Designing concepts and rendering images — usually 1–2 minutes.</div>
          )}

          {creatives.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {creatives.map(c => (
                <div key={c.id} className="sn-card" style={{ padding: 12 }}>
                  <CreativeImage creativeId={c.id} alt={c.concept ?? `Variant ${c.variant}`}
                    caption={c.caption} onPreview={onPreview} />
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1a2f38', margin: '10px 0 4px' }}>
                    V{c.variant} — {c.concept}
                  </div>
                  {c.caption && (
                    <div style={{ fontSize: 12, color: '#42535b', lineHeight: 1.5 }}>{c.caption}</div>
                  )}
                  <div style={{ fontSize: 11, color: '#9badb5', marginTop: 6, fontFamily: 'var(--sn-mono)' }}>
                    {c.costUsd ? `$${Number(c.costUsd).toFixed(4)}` : ''} · {timeAgo(c.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LinkedinCreatives() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['linkedin-posts'],
    queryFn: api.getLinkedinPosts,
    refetchInterval: 15_000,
  });

  const posts = data?.posts ?? [];
  const generating = posts.filter(p => p.status === 'generating').length;

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>LinkedIn Creatives</strong></div>
      </div>

      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Social</div>
          <h1 className="page-title">LinkedIn Creatives</h1>
          <p className="page-sub">Posts arrive from Claude routines via the ingest API. Each post gets 3 AI-generated image variations.</p>
        </div>
        <div className="title-meta">
          {generating > 0 && <span className="tag"><span className="pulse" style={{ color: 'var(--sn-blue)' }} /> {generating} generating</span>}
          <span className="tag"><span className="tag-dot" /> {posts.length} posts</span>
        </div>
      </div>

      <div className="sn-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#697a82', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📣</div>
            <div style={{ marginBottom: 6 }}>No LinkedIn posts yet.</div>
            <div>Point your Claude routine at <code style={{ background: '#f0f3f5', padding: '2px 6px', borderRadius: 4 }}>POST /ingest/linkedin</code> to get started.</div>
          </div>
        ) : (
          posts.map(post => (
            <PostRow
              key={post.id}
              post={post}
              expanded={expandedId === post.id}
              onToggle={() => setExpandedId(id => id === post.id ? null : post.id)}
              onUpdated={() => qc.invalidateQueries({ queryKey: ['linkedin-posts'] })}
              onPreview={setPreview}
            />
          ))
        )}
      </div>

      {preview && <Lightbox preview={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
