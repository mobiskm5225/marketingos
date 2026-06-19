import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings, Search, HelpCircle, Bell } from 'lucide-react';
import { useState } from 'react';
import { ToastProvider } from './lib/toast';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Trigger from './pages/Trigger';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

const NAV_ITEMS = [
  { to: '/',        end: true,  label: 'Dashboard'     },
  { to: '/jobs',    end: false, label: 'Agent Jobs'    },
  { to: '/trigger', end: false, label: 'Trigger Agent' },
];

const LIST_ITEMS = [
  { to: '/jobs',                     label: 'All Jobs'               },
  { to: '/jobs?status=processing',   label: 'Active Runs'            },
  { to: '/jobs?status=error',        label: 'Errors'                 },
  { to: '/jobs?agent=seo-analyzer',  label: 'SEO Analyzer'           },
  { to: '/jobs?agent=blog-reviewer', label: 'Existing Blog Reviewer' },
];

const ADMIN_ITEMS = ['System Health', 'Cost Rules', 'Webhooks'];

const TAB_ROUTES = [
  { to: '/',        label: 'Dashboard'     },
  { to: '/jobs',    label: 'Jobs'          },
  { to: '/trigger', label: 'Trigger Agent' },
];

function Rail() {
  return (
    <aside className="sn-rail">
      <div className="sn-mark">a</div>
      <button className="rail-btn active" title="Main">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <button className="rail-btn" title="Favorites">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2"/></svg>
      </button>
      <button className="rail-btn" title="History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/><path d="M12 7v5l3 2"/></svg>
      </button>
      <button className="rail-btn" title="Workspaces">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      </button>
      <div className="rail-spacer" />
      <button className="rail-btn" title="Settings"><Settings size={18} /></button>
      <div className="rail-avatar">MI</div>
    </aside>
  );
}

function AppNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [filter, setFilter] = useState('');
  const [navTab, setNavTab] = useState<'all' | 'favorites'>('all');

  const match = (label: string) => !filter || label.toLowerCase().includes(filter.toLowerCase());

  const visibleNav   = NAV_ITEMS.filter(x => match(x.label));
  const visibleList  = LIST_ITEMS.filter(x => match(x.label));
  const visibleAdmin = ADMIN_ITEMS.filter(x => match(x));
  const noResults    = filter && !visibleNav.length && !visibleList.length && !visibleAdmin.length;

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
          <button className={`nav-tab${navTab === 'favorites' ? ' active' : ''}`} onClick={() => setNavTab('favorites')}>Favorites</button>
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
            {visibleList.map(({ to, label }) => (
              <NavLink key={to + label} to={to} className="app-link">{label}</NavLink>
            ))}
          </div>
        )}
        {visibleAdmin.length > 0 && (
          <div className="nav-group">
            <div className="group-label"><span className="caret">▾</span> Administration</div>
            {visibleAdmin.map(label => (
              <button key={label}
                className="app-link"
                style={{ width: '100%', textAlign: 'left', border: 0, background: 'transparent', cursor: 'pointer' }}
                onClick={() => alert(`${label} — coming soon`)}>
                {label}
              </button>
            ))}
          </div>
        )}
        {noResults && (
          <div style={{ padding: '20px 14px', color: '#697a82', fontSize: 13 }}>
            No items match "{filter}"
          </div>
        )}
      </nav>
      <div className="nav-footer">v2.0 · Phase 3 · ServiceNow-inspired</div>
    </aside>
  );
}

function Header({ onNavToggle }: { onNavToggle: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [globalTab, setGlobalTab] = useState('All');

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && q.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(q.trim())}`);
      setQ('');
    }
  }

  return (
    <header className="sn-header">
      <div className="global-menu">
        {['All', 'Favorites', 'History', 'Workspaces'].map(tab => (
          <a key={tab} className={globalTab === tab ? 'active' : ''} style={{ cursor: 'pointer' }}
            onClick={() => setGlobalTab(tab)}>
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
          placeholder="Search jobs (Enter to search)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleSearchKey}
        />
      </div>
      <div className="header-actions">
        <button className="icon-btn" title="Help"
          onClick={() => window.open('https://github.com', '_blank')}>
          <HelpCircle size={18} />
        </button>
        <button className="icon-btn" title="View errors" onClick={() => navigate('/jobs?status=error')}>
          <Bell size={18} />
        </button>
        <button className="icon-btn" title="Toggle Navigator" onClick={onNavToggle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h16"/></svg>
        </button>
        <div className="profile-chip">AF</div>
      </div>
    </header>
  );
}

function WorkspaceTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isJobDetail = pathname.startsWith('/jobs/') && pathname !== '/jobs';
  const jobId = isJobDetail ? pathname.split('/')[2] : null;

  function closeTab(e: React.MouseEvent, to: string) {
    e.preventDefault();
    e.stopPropagation();
    const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
    if (isActive) navigate('/');
  }

  return (
    <div className="workspace-tabs">
      {TAB_ROUTES.map(({ to, label }) => {
        const exact = to === '/';
        const active = exact ? pathname === '/' : !isJobDetail && pathname.startsWith(to);
        return (
          <NavLink key={to} to={to} className={`ws-tab${active ? ' active' : ''}`}>
            {label}
            <span className="close" onClick={e => closeTab(e, to)}>×</span>
          </NavLink>
        );
      })}
      {isJobDetail && jobId && (
        <NavLink to={`/jobs/${jobId}`} className="ws-tab active">
          {jobId.replace('job-', 'J-').toUpperCase()}
          <span className="close" onClick={e => { e.preventDefault(); e.stopPropagation(); navigate('/jobs'); }}>×</span>
        </NavLink>
      )}
    </div>
  );
}

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
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/trigger" element={<Trigger />} />
          </Routes>
        </main>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
