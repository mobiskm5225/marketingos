import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Settings, Search, HelpCircle, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ToastProvider } from './lib/toast';
import { AuthProvider, useAuth } from './lib/auth';
import { api } from './lib/api';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Trigger from './pages/Trigger';
import Errors from './pages/Errors';
import ActiveRuns from './pages/ActiveRuns';
import Login from './pages/Login';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

// ─── Nav data ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',        end: true,  label: 'Dashboard'     },
  { to: '/trigger', end: false, label: 'Trigger Agent' },
];

const LIST_ITEMS = [
  { to: '/jobs',        label: 'All Jobs'    },
  { to: '/jobs/active', label: 'Active Runs' },
  { to: '/errors',      label: 'Errors'      },
];

// Permanent tabs — NO × button (can't be closed)
const TAB_ROUTES = [
  { to: '/',        label: 'Dashboard'     },
  { to: '/jobs',    label: 'Jobs'          },
  { to: '/trigger', label: 'Trigger Agent' },
];

function SideNavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} end className={({ isActive }) => `app-link${isActive ? ' active' : ''}`}>
      {label}
    </NavLink>
  );
}

// ─── Rail ────────────────────────────────────────────────────────────────────
function Rail() {
  return (
    <aside className="sn-rail">
      <div className="sn-mark">a</div>
      <button className="rail-btn active" title="Main">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <button className="rail-btn" title="Favorites — coming soon" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2"/></svg>
      </button>
      <button className="rail-btn" title="History — coming soon" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/><path d="M12 7v5l3 2"/></svg>
      </button>
      <button className="rail-btn" title="Workspaces — coming soon" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      </button>
      <div className="rail-spacer" />
      <button className="rail-btn" title="Settings — coming soon" style={{ opacity: 0.4, cursor: 'not-allowed' }}><Settings size={18} /></button>
      <div className="rail-avatar">MI</div>
    </aside>
  );
}

// ─── AppNav ───────────────────────────────────────────────────────────────────
function AppNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [filter, setFilter]   = useState('');
  const [navTab, setNavTab]   = useState<'all' | 'favorites'>('all');

  const match = (label: string) => !filter || label.toLowerCase().includes(filter.toLowerCase());

  const visibleNav   = NAV_ITEMS.filter(x => match(x.label));
  const visibleList  = LIST_ITEMS.filter(x => match(x.label));
  const noResults    = !!filter && !visibleNav.length && !visibleList.length;

  return (
    <aside className="sn-nav" style={{ width: open ? 264 : 0, overflow: 'hidden', transition: 'width .2s ease' }}>
      <div className="nav-top">
        <button className="hamburger" onClick={onToggle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div className="nav-title">Acefone MI<small>Configurable Workspace</small></div>
      </div>

      <div className="nav-search">
        <div className="navigator-filter">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.2-4.2"/></svg>
          <input
            placeholder="Filter navigator"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab${navTab === 'all' ? ' active' : ''}`} onClick={() => setNavTab('all')}>All</button>
          <button className="nav-tab" title="Favorites — coming soon" style={{ opacity: 0.4, cursor: 'not-allowed' }}>Favorites</button>
        </div>
      </div>

      <nav className="nav-scroll">
        {visibleNav.length > 0 && (
          <div className="nav-group">
            <div className="group-label"><span className="caret">▾</span> Marketing Intelligence</div>
            {visibleNav.map(({ to, end, label }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `app-link${isActive ? ' active' : ''}`}>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {visibleList.length > 0 && (
          <div className="nav-group">
            <div className="group-label"><span className="caret">▾</span> Lists</div>
            {/* SideNavItem used here — fixes all-items-active bug for query-string links */}
            {visibleList.map(({ to, label }) => (
              <SideNavItem key={to + label} to={to} label={label} />
            ))}
          </div>
        )}

        {noResults && (
          <div style={{ padding: '20px 14px', color: '#697a82', fontSize: 13 }}>
            No items match "{filter}"
          </div>
        )}
      </nav>

      <div className="nav-footer">v2.0 · Phase 3 · Internal tool</div>
    </aside>
  );
}

// ─── ProfileDropdown ─────────────────────────────────────────────────────────
function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'MI';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="profile-chip"
        title={`Signed in as ${user?.username ?? ''}`}
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        {initials}
      </div>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 38, minWidth: 180,
          background: '#fff', border: '1px solid #d5dadd', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,.14)', zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e8edf0' }}>
            <div style={{ fontSize: 11, color: '#60727b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.04em' }}>Signed in as</div>
            <div style={{ fontWeight: 700, color: '#1a2f38', fontSize: 13, marginTop: 3 }}>{user?.username}</div>
          </div>
          <button
            style={{
              width: '100%', padding: '9px 14px', border: 0, background: 'transparent',
              textAlign: 'left', fontSize: 13, color: '#b42318', fontWeight: 700, cursor: 'pointer',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#fff0f0')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => { setOpen(false); logout(); }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ onNavToggle }: { onNavToggle: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  // Fetch stats for error badge — shares cache with Dashboard
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 30_000,
  });
  const errorCount = (stats as any)?.byStatus?.error ?? 0;

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && q.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(q.trim())}`);
      setQ('');
    }
  }

  return (
    <header className="sn-header">
      <div className="global-menu">
        <a className="active" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>All</a>
        {['Favorites', 'History', 'Workspaces'].map(tab => (
          <a key={tab} title={`${tab} — coming soon`}
            style={{ cursor: 'not-allowed', opacity: 0.45 }}>
            {tab}
          </a>
        ))}
      </div>
      <div className="workspace-pill">
        <span className="dot" />
        <span>Acefone MI Workspace</span>
      </div>
      <div className="global-search">
        <Search size={15} />
        <input
          placeholder="Search jobs (press Enter)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleSearchKey}
        />
      </div>
      <div className="header-actions">
        <button className="icon-btn" title="Documentation"
          onClick={() => window.open('https://github.com/acefone', '_blank')}>
          <HelpCircle size={18} />
        </button>

        {/* Bell with live error count badge */}
        <button className="icon-btn" title={`${errorCount} error${errorCount !== 1 ? 's' : ''}`}
          onClick={() => navigate('/jobs?status=error')}
          style={{ position: 'relative' }}>
          <Bell size={18} />
          {errorCount > 0 && (
            <span style={{
              position: 'absolute', top: 3, right: 3,
              width: 15, height: 15, borderRadius: '50%',
              background: '#d32f2f', color: '#fff',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {errorCount > 9 ? '9+' : errorCount}
            </span>
          )}
        </button>

        <button className="icon-btn" title="Toggle Navigator" onClick={onNavToggle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h16"/></svg>
        </button>

        <ProfileDropdown />
      </div>
    </header>
  );
}

// ─── WorkspaceTabs ────────────────────────────────────────────────────────────
// Permanent tabs have NO × button. Only the dynamic job-detail tab is closeable.
function WorkspaceTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isJobDetail = pathname.startsWith('/jobs/') && pathname !== '/jobs';
  const jobId = isJobDetail ? pathname.split('/')[2] : null;

  return (
    <div className="workspace-tabs">
      {TAB_ROUTES.map(({ to, label }) => {
        const exact = to === '/';
        const active = exact ? pathname === '/' : !isJobDetail && pathname.startsWith(to);
        return (
          <NavLink key={to} to={to} className={`ws-tab${active ? ' active' : ''}`}>
            {label}
          </NavLink>
        );
      })}

      {/* Dynamic job detail tab — closeable */}
      {isJobDetail && jobId && (
        <span className="ws-tab active">
          {jobId.replace('job-', 'J-').toUpperCase()}
          <span
            className="close"
            onClick={e => { e.preventDefault(); e.stopPropagation(); navigate('/jobs'); }}
            title="Close tab">
            ×
          </span>
        </span>
      )}
    </div>
  );
}

// ─── AppShell ────────────────────────────────────────────────────────────────
function AppShell() {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="sn-shell">
      <Rail />
      <AppNav open={navOpen} onToggle={() => setNavOpen(o => !o)} />
      <section className="sn-main" style={{ marginLeft: navOpen ? 316 : 52, transition: 'margin-left .2s ease' }}>
        <Header onNavToggle={() => setNavOpen(o => !o)} />
        <WorkspaceTabs />
        <main className="sn-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/active" element={<ActiveRuns />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/trigger" element={<Trigger />} />
            <Route path="/errors" element={<Errors />} />
          </Routes>
        </main>
      </section>
    </div>
  );
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
function ProtectedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--sn-bg)', color: '#60727b', fontSize: 14,
      }}>
        <span className="spinner" style={{ marginRight: 10 }} /> Loading workspace...
      </div>
    );
  }

  if (!user) return <Login />;

  return <AppShell />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ProtectedApp />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
