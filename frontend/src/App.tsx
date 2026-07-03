import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Search, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect, Component } from 'react';
import type { ReactNode } from 'react';
import { ToastProvider } from './lib/toast';
import { AuthProvider, useAuth } from './lib/auth';
import { jobIdDisplay } from './lib/format';
import NotificationPanel from './components/NotificationPanel';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Trigger from './pages/Trigger';
import Errors from './pages/Errors';
import ActiveRuns from './pages/ActiveRuns';
import Admin from './pages/Admin';
import ReviewQueue from './pages/ReviewQueue';
import SeoAnalyzerJobs from './pages/SeoAnalyzerJobs';
import BlogReviewerJobs from './pages/BlogReviewerJobs';
import BlogDrafts from './pages/BlogDrafts';
import TeamManagement from './pages/TeamManagement';
import Login from './pages/Login';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: 'center', color: '#1a2f38' }}>
          <h2 style={{ color: '#b42318', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#697a82', fontSize: 13, marginBottom: 20 }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            className="sn-btn"
            onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Nav data ────────────────────────────────────────────────────────────────

const ALL_NAV_ITEMS = [
  { to: '/',        end: true,  label: 'Dashboard',     perm: null                },
  { to: '/trigger', end: false, label: 'Trigger Agent', perm: '__canTrigger__'    },
  { to: '/reviews', end: false, label: 'Review Queue',  perm: 'jobs:review'       },
  { to: '/team',    end: false, label: 'My Team',       perm: '__isManager__'     },
  { to: '/admin',   end: false, label: 'Admin',         perm: 'admin:users'       },
];

const LIST_ITEMS = [
  { to: '/jobs',              label: 'All Jobs',              perm: null                        },
  { to: '/jobs/active',       label: 'Active Runs',           perm: null                        },
  { to: '/errors',            label: 'Errors',                perm: null                        },
  { to: '/agents/seo',        label: 'SEO Analyzer',          perm: 'agents:trigger:seo-analyzer' },
  { to: '/agents/blog-reviewer', label: 'Existing Blog Reviewer', perm: 'agents:trigger:blog-reviewer' },
  { to: '/blog-drafts',       label: 'Blog Drafts',           perm: 'blog-drafts:manage'        },
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
      <div className="rail-spacer" />
      <div className="rail-avatar">MI</div>
    </aside>
  );
}

// ─── AppNav ───────────────────────────────────────────────────────────────────
function AppNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [filter, setFilter]   = useState('');
  const { hasPermission, isManagerInGroup, myGroups } = useAuth();

  const canTrigger = hasPermission('agents:trigger:seo-analyzer') || hasPermission('agents:trigger:blog-reviewer');
  const isAnyManager = myGroups.some(g => isManagerInGroup(g));
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => {
    if (item.perm === '__canTrigger__') return canTrigger;
    if (item.perm === '__isManager__')  return isAnyManager;
    if (item.perm) return hasPermission(item.perm);
    return true;
  });

  const match = (label: string) => !filter || label.toLowerCase().includes(filter.toLowerCase());

  const visibleNav  = NAV_ITEMS.filter(x => match(x.label));
  const visibleList = LIST_ITEMS.filter(x => {
    if (x.perm && !hasPermission(x.perm)) return false;
    return match(x.label);
  });
  const noResults   = !!filter && !visibleNav.length && !visibleList.length;

  return (
    <aside className="sn-nav" style={{ width: open ? 264 : 0, overflow: 'hidden', transition: 'width .2s ease' }}>
      <div className="nav-top">
        <button className="hamburger" onClick={onToggle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div className="nav-title">Marketing Intelligence OS<small>Configurable Workspace</small></div>
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
      </div>
      <div className="workspace-pill">
        <span className="dot" />
        <span>Marketing Intelligence OS</span>
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

        <NotificationPanel />

        <button className="icon-btn" title="Toggle Navigator" onClick={onNavToggle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h16"/></svg>
        </button>

        <ProfileDropdown />
      </div>
    </header>
  );
}

// ─── WorkspaceTabs ────────────────────────────────────────────────────────────
// Browser-style workspace tabs: Dashboard is pinned; every other visited page
// opens a tab with a × close button. Open tabs survive reload via sessionStorage.

function tabLabelFor(pathname: string): string | null {
  if (pathname === '/')                     return 'Dashboard';
  if (pathname === '/jobs')                 return 'Jobs';
  if (pathname === '/jobs/active')          return 'Active Runs';
  if (pathname.startsWith('/jobs/'))        return jobIdDisplay(pathname.split('/')[2] ?? '');
  if (pathname === '/trigger')              return 'Trigger Agent';
  if (pathname === '/errors')               return 'Errors';
  if (pathname === '/reviews')              return 'Review Queue';
  if (pathname === '/agents/seo')           return 'SEO Analyzer';
  if (pathname === '/agents/blog-reviewer') return 'Blog Reviewer';
  if (pathname === '/blog-drafts')          return 'Blog Drafts';
  if (pathname === '/team')                 return 'My Team';
  if (pathname === '/admin')                return 'Admin';
  return null;
}

type WsTab = { path: string; label: string };

function WorkspaceTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<WsTab[]>(() => {
    try {
      const saved = sessionStorage.getItem('mi_tabs');
      if (saved) return JSON.parse(saved) as WsTab[];
    } catch { /* corrupt storage — start fresh */ }
    return [];
  });

  useEffect(() => {
    const label = tabLabelFor(pathname);
    if (!label || pathname === '/') return;
    setTabs(t => t.some(x => x.path === pathname) ? t : [...t, { path: pathname, label }]);
  }, [pathname]);

  useEffect(() => {
    sessionStorage.setItem('mi_tabs', JSON.stringify(tabs));
  }, [tabs]);

  function closeTab(path: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const idx = tabs.findIndex(t => t.path === path);
    const next = tabs.filter(t => t.path !== path);
    setTabs(next);
    // Closing the active tab moves focus to its left neighbour, or Dashboard.
    if (pathname === path) {
      navigate(next.length ? next[Math.max(0, idx - 1)].path : '/');
    }
  }

  return (
    <div className="workspace-tabs">
      <NavLink to="/" className={`ws-tab${pathname === '/' ? ' active' : ''}`} title="Dashboard is pinned">
        Dashboard
      </NavLink>
      {tabs.map(({ path, label }) => (
        <NavLink key={path} to={path} className={`ws-tab${pathname === path ? ' active' : ''}`}>
          {label}
          <span className="close" onClick={e => closeTab(path, e)} title="Close tab">×</span>
        </NavLink>
      ))}
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
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/active" element={<ActiveRuns />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/trigger" element={<Trigger />} />
              <Route path="/errors" element={<Errors />} />
              <Route path="/reviews" element={<ReviewQueue />} />
              <Route path="/agents/seo" element={<SeoAnalyzerJobs />} />
              <Route path="/agents/blog-reviewer" element={<BlogReviewerJobs />} />
              <Route path="/blog-drafts" element={<BlogDrafts />} />
              <Route path="/team" element={<TeamManagement />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </ErrorBoundary>
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
