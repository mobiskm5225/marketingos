import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fetchImageUrl } from '../lib/api';
import { useToast } from '../lib/toast';
import {
  useTheme, DEFAULT_THEME, TOKEN_GROUPS, FONT_OPTIONS, MONO_FONT_OPTIONS,
  GUIDELINE_SECTIONS, exportAsCss, exportAsW3cTokens, exportAsTailwind,
  type ThemeSettings,
} from '../lib/theme';

function downloadDesignSystemFile(theme: ThemeSettings) {
  const file = {
    $description: `${theme.workspaceName} design system — W3C Design Tokens format. Import into Figma with the Tokens Studio plugin, or consume directly.`,
    exportedAt: new Date().toISOString(),
    workspaceName: theme.workspaceName,
    tokens: JSON.parse(exportAsW3cTokens(theme)),
    guidelines: theme.guidelines,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'design-system.json';
  a.click();
  URL.revokeObjectURL(url);
}

// "Export design system ▾" dropdown — file download or direct Figma push
function ExportDropdown({ theme, onFigmaPush }: { theme: ThemeSettings; onFigmaPush: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const item: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
    border: 0, background: 'transparent', fontSize: 13, color: '#1c3038',
    fontWeight: 600, cursor: 'pointer',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="sn-btn" style={{ fontSize: 12 }} onClick={() => setOpen(o => !o)}>
        Export design system ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 36, minWidth: 250,
          background: '#fff', border: '1px solid var(--sn-border)', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,.14)', zIndex: 50, overflow: 'hidden',
        }}>
          <button style={item}
            onMouseOver={e => (e.currentTarget.style.background = '#eef2f4')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => { setOpen(false); downloadDesignSystemFile(theme); }}>
            ⬇ Download as file (.json)
            <div style={{ fontSize: 11, color: '#697a82', fontWeight: 400, marginTop: 2 }}>W3C tokens + guidelines — Figma via Tokens Studio</div>
          </button>
          <button style={{ ...item, borderTop: '1px solid #f0f3f5' }}
            onMouseOver={e => (e.currentTarget.style.background = '#eef2f4')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => { setOpen(false); onFigmaPush(); }}>
            ↗ Export to Figma
            <div style={{ fontSize: 11, color: '#697a82', fontWeight: 400, marginTop: 2 }}>Push as Figma Variables to the connected file</div>
          </button>
        </div>
      )}
    </div>
  );
}

const ALLOWED_LOGO_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];

// Org logo — stamped bottom-right onto every generated creative (LinkedIn etc.)
function LogoUploader() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let url: string | null = null;
    fetchImageUrl('/settings/logo')
      .then(u => { url = u; setPreview(u); })
      .catch(() => setPreview(null));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [refreshKey]);

  const saveMutation = useMutation({
    mutationFn: ({ b64, mime }: { b64: string; mime: string }) => api.saveLogo(b64, mime),
    onSuccess: () => { toast('Logo saved — new creatives will carry it', 'success'); setRefreshKey(k => k + 1); },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: api.deleteLogo,
    onSuccess: () => { toast('Logo removed — creatives go unbranded', 'success'); setPreview(null); setRefreshKey(k => k + 1); },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast('Logo must be PNG, SVG, JPEG, or WebP', 'error');
      return;
    }
    if (file.size > 1_000_000) {
      toast(`File too large (${Math.round(file.size / 1024)} KB, max 1000 KB)`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(',')[1];
      saveMutation.mutate({ b64, mime: file.type });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#697a82', display: 'block', marginBottom: 4 }}>
        Logo — stamped on every generated creative
      </label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          width: 150, height: 60, border: '1px dashed var(--sn-border-dark)', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'repeating-conic-gradient(#f0f2f5 0% 25%, #fff 0% 50%) 50% / 16px 16px',
          overflow: 'hidden',
        }}>
          {preview
            ? <img src={preview} alt="Org logo" style={{ maxWidth: '92%', maxHeight: '85%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 11, color: '#9badb5' }}>No logo</span>}
        </div>
        <input ref={fileRef} type="file" accept={ALLOWED_LOGO_TYPES.join(',')} style={{ display: 'none' }}
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
        <button className="sn-btn" style={{ fontSize: 12 }}
          disabled={saveMutation.isPending}
          onClick={() => fileRef.current?.click()}>
          {saveMutation.isPending ? 'Uploading...' : preview ? 'Replace logo' : 'Upload logo'}
        </button>
        {preview && (
          <button className="sn-btn" style={{ fontSize: 12, color: 'var(--sn-red)' }}
            disabled={removeMutation.isPending}
            onClick={() => removeMutation.mutate()}>
            Remove
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#9badb5', marginTop: 6 }}>
        PNG with transparency recommended, max 1 MB. Stamped top-right at ~13% of image width on every generated creative.
      </div>
    </div>
  );
}

// Figma connection card (Export section)
function FigmaConnectCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [token, setToken] = useState('');
  const [fileKey, setFileKey] = useState('');

  const { data } = useQuery({ queryKey: ['figma-settings'], queryFn: api.getFigmaSettings });

  const saveMutation = useMutation({
    mutationFn: () => api.saveFigmaSettings(token, fileKey),
    onSuccess: () => {
      toast('Figma connected', 'success');
      setToken(''); setFileKey('');
      qc.invalidateQueries({ queryKey: ['figma-settings'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <div style={{ border: '1px solid var(--sn-border)', borderRadius: 6, padding: 14, marginBottom: 16, background: '#fafbfc' }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38', marginBottom: 4 }}>
        Figma connection {data?.configured && <span className="status done" style={{ marginLeft: 8 }}>connected</span>}
      </div>
      <div style={{ fontSize: 12, color: '#697a82', marginBottom: 10, lineHeight: 1.5 }}>
        {data?.configured
          ? <>Target file: <code style={{ background: '#eef2f4', padding: '1px 6px', borderRadius: 4 }}>{data.fileKey}</code>. Update below to change.</>
          : 'Paste a Figma personal access token and the target file key (from the file URL). Direct variable push requires a Figma Enterprise token — on other plans use the file download + free Tokens Studio plugin.'}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="sn-input" type="password" placeholder="Personal access token" value={token}
          style={{ flex: 2, minWidth: 220 }} onChange={e => setToken(e.target.value)} />
        <input className="sn-input" placeholder="File key (e.g. Ab12Cd34...)" value={fileKey}
          style={{ flex: 1, minWidth: 160 }} onChange={e => setFileKey(e.target.value)} />
        <button className="sn-btn sn-btn-primary" style={{ fontSize: 12 }}
          disabled={!token.trim() || !fileKey.trim() || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? 'Saving...' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

type Section = 'tokens' | 'typography' | 'guidelines' | 'components' | 'export';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'tokens',     label: 'Tokens' },
  { key: 'typography', label: 'Typography' },
  { key: 'guidelines', label: 'Guidelines' },
  { key: 'components', label: 'Components' },
  { key: 'export',     label: 'Export' },
];

const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#697a82', display: 'block', marginBottom: 4 };
const sectionBox: React.CSSProperties = { padding: '14px 18px', borderBottom: '1px solid #f0f3f5' };
const sectionTitle: React.CSSProperties = { fontWeight: 800, fontSize: 13, color: '#1a2f38', marginBottom: 10 };

function CopyBlock({ title, content }: { title: string; content: string }) {
  const { toast } = useToast();
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38' }}>{title}</div>
        <button className="sn-btn" style={{ fontSize: 11, height: 26 }}
          onClick={() => navigator.clipboard.writeText(content).then(() => toast(`${title} copied`, 'success'))}>
          Copy
        </button>
      </div>
      <pre style={{
        background: '#102832', color: '#d9edf2', borderRadius: 6, padding: 12,
        fontSize: 11.5, lineHeight: 1.5, fontFamily: 'var(--sn-mono)',
        overflow: 'auto', maxHeight: 320, margin: 0,
      }}>{content}</pre>
    </div>
  );
}

export default function DesignSystemPanel() {
  const { toast } = useToast();
  const { theme, setThemeLocal, reload } = useTheme();
  const [dirty, setDirty] = useState(false);
  const [section, setSection] = useState<Section>('tokens');
  const [editingGuide, setEditingGuide] = useState<string | null>(null);

  function update(patch: Partial<ThemeSettings>) {
    setThemeLocal({ ...theme, ...patch });
    setDirty(true);
  }
  function updateVar(cssVar: string, value: string) {
    update({ vars: { ...theme.vars, [cssVar]: value } });
  }
  function updateGuideline(key: string, value: string) {
    update({ guidelines: { ...theme.guidelines, [key]: value } });
  }

  const saveMutation = useMutation({
    mutationFn: () => api.saveThemeSettings(theme),
    onSuccess: () => { toast('Design system saved — applies to everyone', 'success'); setDirty(false); },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.saveThemeSettings(null),
    onSuccess: async () => { await reload(); setThemeLocal(DEFAULT_THEME); setDirty(false); toast('Reset to defaults', 'success'); },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const figmaPushMutation = useMutation({
    mutationFn: api.exportToFigma,
    onSuccess: (r) => toast(`Pushed ${r.variables} variables to Figma${r.replaced ? ' (replaced previous collection)' : ''}`, 'success'),
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function handleFigmaPush() {
    if (dirty) { toast('Save the design system first, then export', 'error'); return; }
    figmaPushMutation.mutate();
  }

  return (
    <div className="sn-card" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #e8edf0' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1a2f38' }}>Design System</div>
          <div style={{ fontSize: 11, color: '#697a82', marginTop: 2 }}>
            Single source of truth: tokens, rules, and exports. Agents (e.g. LinkedIn creatives) read brand colors from here.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ExportDropdown theme={theme} onFigmaPush={handleFigmaPush} />
          <button className="sn-btn" style={{ fontSize: 12 }}
            disabled={resetMutation.isPending}
            onClick={() => resetMutation.mutate()}>
            Reset to defaults
          </button>
          <button className="sn-btn sn-btn-primary" style={{ fontSize: 12 }}
            disabled={!dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Saving...' : dirty ? 'Save design system' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Section nav */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e8edf0', padding: '0 10px', background: '#fafbfc' }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{
            background: 'none', border: 'none', padding: '10px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
            color: section === s.key ? 'var(--sn-accent)' : '#697a82',
            borderBottom: section === s.key ? '2px solid var(--sn-accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Tokens ── */}
      {section === 'tokens' && (
        <>
          <div style={sectionBox}>
            <div style={sectionTitle}>Branding</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={label}>Workspace name</label>
                <input className="sn-input" value={theme.workspaceName}
                  onChange={e => update({ workspaceName: e.target.value })} />
              </div>
              <div>
                <label style={label}>Logo mark (1–2 chars)</label>
                <input className="sn-input" maxLength={2} value={theme.markLetter}
                  onChange={e => update({ markLetter: e.target.value })} />
              </div>
            </div>
            <LogoUploader />
          </div>

          {TOKEN_GROUPS.map(group => (
            <div key={group.title} style={sectionBox}>
              <div style={sectionTitle}>{group.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {group.tokens.map(t => (
                  <div key={t.cssVar}>
                    <label style={label}>{t.label}</label>
                    {t.type === 'color' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="color" value={theme.vars[t.cssVar] ?? '#000000'}
                          style={{ width: 36, height: 32, border: '1px solid var(--sn-border-dark)', borderRadius: 4, padding: 2, cursor: 'pointer', background: '#fff' }}
                          onChange={e => updateVar(t.cssVar, e.target.value)} />
                        <input className="sn-input" style={{ fontFamily: 'var(--sn-mono)', fontSize: 12 }}
                          value={theme.vars[t.cssVar] ?? ''}
                          onChange={e => updateVar(t.cssVar, e.target.value)} />
                      </div>
                    ) : (
                      <input className="sn-input" style={{ fontFamily: 'var(--sn-mono)', fontSize: 12 }}
                        value={theme.vars[t.cssVar] ?? ''}
                        placeholder="e.g. 4px"
                        onChange={e => updateVar(t.cssVar, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ ...sectionBox, borderBottom: 0, background: '#f8fafb' }}>
            <div style={{ fontSize: 12, color: '#697a82', lineHeight: 1.6 }}>
              <strong>Token model:</strong> these are <em>semantic</em> tokens (role-named, W3C three-tier model) —
              components reference roles like “Primary action”, never raw hex. Changing a value here restyles every
              component that uses the role. Keep one action accent per screen region.
            </div>
          </div>
        </>
      )}

      {/* ── Typography ── */}
      {section === 'typography' && (
        <>
          <div style={sectionBox}>
            <div style={sectionTitle}>Families & size</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label style={label}>Main font</label>
                <select className="sn-select" value={theme.vars['--sn-font']}
                  onChange={e => updateVar('--sn-font', e.target.value)}>
                  {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Monospace font</label>
                <select className="sn-select" value={theme.vars['--sn-mono']}
                  onChange={e => updateVar('--sn-mono', e.target.value)}>
                  {MONO_FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Base font size (px)</label>
                <input className="sn-input" type="number" min={12} max={18} value={theme.baseFontSize}
                  onChange={e => update({ baseFontSize: Math.min(18, Math.max(12, parseInt(e.target.value, 10) || 14)) })} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#9badb5', marginTop: 8 }}>
              System-safe fonts only — external font CDNs are blocked by the security policy.
            </div>
          </div>

          <div style={{ ...sectionBox, borderBottom: 0 }}>
            <div style={sectionTitle}>Type scale specimen</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--sn-text)' }}>Page title — 21px / 800</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--sn-text)' }}>Card title — 14px / 800</div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sn-muted)' }}>Section label — 12px / caps</div>
              <div style={{ fontSize: 13.5, color: 'var(--sn-text)', maxWidth: 640, lineHeight: 1.55 }}>
                Body — the quick brown fox analyses 4,218 input tokens and writes the result back to Notion.
                Readable, dense, enterprise-calm.
              </div>
              <div style={{ fontSize: 12, color: 'var(--sn-muted)' }}>Meta / muted — timestamps, helper text, counts.</div>
              <div className="mono" style={{ fontSize: 12 }}>mono — J-8AF85BF2 · $0.0421 · 1,847 tokens</div>
            </div>
          </div>
        </>
      )}

      {/* ── Guidelines (knowledge base) ── */}
      {section === 'guidelines' && (
        <>
          {GUIDELINE_SECTIONS.map(g => (
            <div key={g.key} style={sectionBox}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ ...sectionTitle, marginBottom: 0 }}>{g.title}</div>
                <button className="sn-btn" style={{ fontSize: 11, height: 26 }}
                  onClick={() => setEditingGuide(id => id === g.key ? null : g.key)}>
                  {editingGuide === g.key ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingGuide === g.key ? (
                <textarea className="sn-textarea" style={{ minHeight: 140, fontSize: 13 }}
                  value={theme.guidelines[g.key] ?? ''}
                  onChange={e => updateGuideline(g.key, e.target.value)} />
              ) : (
                <div style={{ fontSize: 13, color: '#42535b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {theme.guidelines[g.key] || <em style={{ color: '#9badb5' }}>No guidance written yet — click Edit.</em>}
                </div>
              )}
            </div>
          ))}
          <div style={{ ...sectionBox, borderBottom: 0, background: '#f8fafb', fontSize: 12, color: '#697a82' }}>
            Guidelines are stored with the theme and versioned in the audit log on every save.
          </div>
        </>
      )}

      {/* ── Components ── */}
      {section === 'components' && (
        <div style={{ ...sectionBox, borderBottom: 0 }}>
          <div style={sectionTitle}>Live component gallery (renders from current tokens)</div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label style={label}>Buttons</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="sn-btn sn-btn-primary">Primary action</button>
                <button className="sn-btn">Secondary</button>
                <button className="sn-btn sn-btn-ghost">Ghost</button>
                <button className="sn-btn" disabled>Disabled</button>
              </div>
            </div>

            <div>
              <label style={label}>Status badges</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="status done">done</span>
                <span className="status processing">processing</span>
                <span className="status pending">pending</span>
                <span className="status error">error</span>
              </div>
            </div>

            <div>
              <label style={label}>Tags & links</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="tag"><span className="tag-dot" /> Workspace</span>
                <span className="tag">webhook</span>
                <a className="record-link" style={{ fontSize: 13 }}>J-8AF85BF2</a>
                <span className="mono" style={{ fontSize: 12 }}>$0.0421</span>
              </div>
            </div>

            <div>
              <label style={label}>Alerts</label>
              <div className="alert error" style={{ marginBottom: 8 }}>Error: crawl failed after 3 retries.</div>
              <div className="alert running" style={{ marginBottom: 0 }}><span className="pulse" /> Agent is running.</div>
            </div>

            <div>
              <label style={label}>Form controls</label>
              <div style={{ display: 'flex', gap: 8, maxWidth: 560 }}>
                <input className="sn-input" placeholder="Text input" />
                <select className="sn-select" style={{ width: 160 }}><option>Select</option></select>
              </div>
            </div>

            <div>
              <label style={label}>Card + metric</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="mini-metric" style={{ width: 160 }}>
                  <div className="label">Cost</div>
                  <div className="value">$0.0421</div>
                </div>
                <div className="mini-item" style={{ width: 240 }}>
                  <div><strong>SEO Analyzer</strong><small>128 jobs · Operational</small></div>
                  <span className="mono">$30.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Export ── */}
      {section === 'export' && (
        <div style={{ ...sectionBox, borderBottom: 0 }}>
          <FigmaConnectCard />
          <div style={{ fontSize: 12.5, color: '#697a82', marginBottom: 14, lineHeight: 1.6 }}>
            Use these anywhere — websites, decks, other apps. Machine access:&nbsp;
            <code style={{ background: '#f0f3f5', padding: '2px 6px', borderRadius: 4 }}>GET /api/settings/theme</code>
            &nbsp;(JWT) returns the saved theme as JSON. The LinkedIn creatives agent already reads brand colors from it.
          </div>
          <CopyBlock title="CSS custom properties" content={exportAsCss(theme)} />
          <CopyBlock title="W3C Design Tokens (JSON, 2025.10 spec)" content={exportAsW3cTokens(theme)} />
          <CopyBlock title="Tailwind config" content={exportAsTailwind(theme)} />
        </div>
      )}
    </div>
  );
}
