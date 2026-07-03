import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiPost } from '../lib/api';
import { useAuth } from '../lib/auth';

type AgentTab = 'seo' | 'blog';

function agentToTab(agentName?: string, canSeo?: boolean): AgentTab {
  if (agentName === 'blog-reviewer') return 'blog';
  if (!canSeo) return 'blog';
  return 'seo';
}

export default function Trigger() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  const initialAgent = (location.state as { agent?: string } | null)?.agent;

  const canSeo  = hasPermission('agents:trigger:seo-analyzer');
  const canBlog = hasPermission('agents:trigger:blog-reviewer');

  const [tab, setTab] = useState<AgentTab>(agentToTab(initialAgent, canSeo));

  const [seoTitle, setSeoTitle]     = useState('');
  const [seoContent, setSeoContent] = useState('');
  const [seoUrl, setSeoUrl]         = useState('');
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError]     = useState('');

  const [blogTitle, setBlogTitle]   = useState('');
  const [blogUrl, setBlogUrl]       = useState('');
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError]   = useState('');

  const wordCount = seoContent.trim() ? seoContent.trim().split(/\s+/).length : 0;
  const warnWords = wordCount > 0 && wordCount < 300;

  function clearActiveForm() {
    if (tab === 'seo') { setSeoTitle(''); setSeoContent(''); setSeoUrl(''); setSeoError(''); }
    else { setBlogTitle(''); setBlogUrl(''); setBlogError(''); }
  }

  function handleSeoKey(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      document.getElementById('seo-submit')?.click();
    }
  }

  function handleBlogKey(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      document.getElementById('blog-submit')?.click();
    }
  }

  async function handleSeoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSeoError('');
    setSeoLoading(true);
    try {
      const { jobId } = await apiPost<{ jobId: string }>('/agents/seo-analyzer', { title: seoTitle, content: seoContent, url: seoUrl || undefined });
      navigate(`/jobs/${jobId}`);
    } catch (err: unknown) {
      setSeoError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSeoLoading(false);
    }
  }

  async function handleBlogSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBlogError('');
    setBlogLoading(true);
    try {
      const { jobId } = await apiPost<{ jobId: string }>('/agents/blog-reviewer', { title: blogTitle, url: blogUrl });
      navigate(`/jobs/${jobId}`);
    } catch (err: unknown) {
      setBlogError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBlogLoading(false);
    }
  }

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>Trigger Agent</strong></div>
        <div className="record-actions">
          <button className="sn-btn" type="button" onClick={clearActiveForm}>
            Clear form
          </button>
          <button className="sn-btn sn-btn-primary" form={tab === 'seo' ? 'seo-form' : 'blog-form'} type="submit">
            Submit
          </button>
        </div>
      </div>
      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Record producer</div>
          <h1 className="page-title">Trigger Agent</h1>
          <p className="page-sub">Run directly from the workspace &mdash; no Notion webhook needed.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" /> Direct API</span>
          <span>~30&ndash;60s per run</span>
          <span style={{ color: '#697a82', fontSize: 12 }}>Tip: Ctrl+Enter to submit</span>
        </div>
      </div>

      <div className="sn-card">
        {(canSeo && canBlog) && (
          <div className="tab-buttons">
            <button className={`tab-btn${tab === 'seo' ? ' active' : ''}`} type="button" onClick={() => setTab('seo')}>
              SEO Analyzer
            </button>
            <button className={`tab-btn${tab === 'blog' ? ' active' : ''}`} type="button" onClick={() => setTab('blog')}>
              Existing Blog Reviewer
            </button>
          </div>
        )}

        <div className="card-body">
          {(tab === 'seo' && canSeo) ? (
            <>
              <div className="info-message">
                <strong>Info</strong>
                <span>Paste draft blog content for a 5-layer pre-publish SEO review. No Notion required.</span>
              </div>
              <form id="seo-form" onSubmit={handleSeoSubmit} onKeyDown={handleSeoKey}>
                <div className="form-grid">
                  <div className="field-label">Draft title <span className="req">*</span></div>
                  <div className="field-control">
                    <input className="sn-input" type="text" required value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      placeholder="Cloud Telephony Pricing in 2025" />
                  </div>
                  <div className="field-label">Blog URL</div>
                  <div className="field-control">
                    <input className="sn-input" type="url" value={seoUrl}
                      onChange={e => setSeoUrl(e.target.value)}
                      placeholder="https://acefone.com/blog/..." />
                    <div className="help-text">Optional &mdash; used for canonical link analysis.</div>
                  </div>
                  <div className="field-label">Draft content <span className="req">*</span></div>
                  <div className="field-control">
                    <textarea className="sn-textarea" id="content" required value={seoContent}
                      onChange={e => setSeoContent(e.target.value)}
                      placeholder="Paste your draft markdown or plain text..." />
                    <div className="word-count">
                      <span className={warnWords ? 'warn' : ''}>{seoContent.length} characters</span>
                      <span className={warnWords ? 'warn' : ''}>{wordCount} words{warnWords ? ' — minimum 300 recommended' : ''}</span>
                    </div>
                  </div>
                </div>
                {seoError && <div className="alert error" style={{ marginTop: 12 }}>{seoError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <button type="button" className="sn-btn" onClick={() => navigate('/')}>Cancel</button>
                  <button id="seo-submit" type="submit" className="sn-btn sn-btn-primary" disabled={seoLoading || !seoTitle || !seoContent}>
                    {seoLoading ? <><span className="spinner" /> Running analysis...</> : 'Run SEO Analysis'}
                  </button>
                </div>
              </form>
            </>
          ) : canBlog ? (
            <>
              <div className="info-message">
                <strong>Info</strong>
                <span>Enter a live blog URL &mdash; the workspace will crawl the page and run a full post-publish audit.</span>
              </div>
              <form id="blog-form" onSubmit={handleBlogSubmit} onKeyDown={handleBlogKey}>
                <div className="form-grid">
                  <div className="field-label">Published blog title <span className="req">*</span></div>
                  <div className="field-control">
                    <input className="sn-input" type="text" required value={blogTitle}
                      onChange={e => setBlogTitle(e.target.value)}
                      placeholder="How VoIP cuts call center costs" />
                  </div>
                  <div className="field-label">Live blog URL <span className="req">*</span></div>
                  <div className="field-control">
                    <input className="sn-input" type="url" required value={blogUrl}
                      onChange={e => setBlogUrl(e.target.value)}
                      placeholder="https://acefone.com/blog/..." />
                    <div className="help-text">Must be publicly accessible for crawling.</div>
                  </div>
                </div>
                {blogError && <div className="alert error" style={{ marginTop: 12 }}>{blogError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <button type="button" className="sn-btn" onClick={() => navigate('/')}>Cancel</button>
                  <button id="blog-submit" type="submit" className="sn-btn sn-btn-primary" disabled={blogLoading || !blogTitle || !blogUrl}>
                    {blogLoading ? <><span className="spinner" /> Crawling & analysing...</> : 'Run Blog Review'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#697a82', fontSize: 13 }}>
              You don't have permission to trigger any agents.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
