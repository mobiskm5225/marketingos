# Frontend

React 19 + Vite 8 + TanStack Query v5 + React Router v7. ServiceNow-inspired UI.

**Dev server:** `http://localhost:3000`  
**API proxy:** `/api/*` → `http://localhost:8000`

---

## Tech Choices

| Concern | Library | Why |
|---|---|---|
| Server state | TanStack Query v5 | Caching, background refetch, loading states, per-query intervals |
| Routing | React Router v7 | File-based routes, `useSearchParams`, `useNavigate`, `useLocation` |
| Icons | lucide-react | Tree-shakeable, consistent stroke style |
| Styling | Custom CSS (index.css) | Tailwind v4 arbitrary colors are unreliable in this setup; pure CSS is predictable |
| Notifications | Custom toast (lib/toast.tsx) | No dependency, 40 lines, exactly what's needed |

---

## File Map

```
frontend/src/
├── App.tsx           Shell layout, routing, nav
├── main.tsx          React DOM mount
├── index.css         All styles (~530 lines)
├── pages/
│   ├── Dashboard.tsx
│   ├── Jobs.tsx
│   ├── JobDetail.tsx
│   └── Trigger.tsx
└── lib/
    ├── api.ts        API client types + fetch wrappers
    └── toast.tsx     Toast context + useToast hook
```

---

## App Shell (`App.tsx`)

The shell has 4 regions:

```
┌──┬────────────────────────────────────────────────┐
│  │ Header (54px sticky)                            │
│R │─────────────────────────────────────────────────│
│a │ Workspace Tabs (40px sticky, top:54px)          │
│i │─────────────────────────────────────────────────│
│l ├─────────────┐                                   │
│  │             │                                   │
│52│   Nav       │   Main content area               │
│px│   264px     │   margin-left: 316px (or 52px)    │
│  │   (toggle)  │                                   │
│  │             │                                   │
└──┴─────────────┴───────────────────────────────────┘
```

**Components:**

| Component | Props | State |
|---|---|---|
| `Rail` | none | none |
| `AppNav` | `open`, `onToggle` | `filter` (string), `navTab` ('all'/'favorites') |
| `Header` | `onNavToggle` | `q` (search string), `globalTab` |
| `WorkspaceTabs` | none | none (reads `useLocation`) |
| `AppShell` | none | `navOpen` (boolean) |

**Nav collapse:** `AppShell` holds `navOpen` state. Nav width transitions from `264px` → `0` via CSS `transition: width .2s ease`. Main content `margin-left` transitions from `316px` → `52px` simultaneously.

**Global search:** Enter key on header input → `navigate('/jobs?q=<query>')`. Jobs page reads the `q` param and applies client-side filter.

**Workspace tabs:** Tabs match current routes. The `×` close button on the active tab navigates to `/`. Job detail gets its own dynamic tab (`J-XXXX`).

---

## Pages

### Dashboard (`/`)

**Data:**
- `useQuery(['stats'], api.getStats, refetchInterval: 30s)` — metric cards + side panel
- `useQuery(['jobs', 'recent'], () => api.getJobs({limit: 5}), refetchInterval: 15s)` — recent jobs table

**Interactions:**
- Refresh button → `queryClient.invalidateQueries()` (invalidates all queries)
- Total Jobs card → `navigate('/jobs')`
- Error Rate card → `navigate('/jobs?status=error')`
- System health KV rows → `navigate('/jobs?status=<s>')`
- Agent breakdown rows → `navigate('/jobs?agent=<a>')`
- Table row click → `navigate('/jobs/:id')`
- Checkboxes → `Set<string>` selection state, shows count badge

---

### Jobs (`/jobs`)

**Data:**
- `useQuery(['jobs', page, agentFilter, statusFilter], ...)` — 20 rows per page, refetch 15s

**URL params read on mount and on change:**
- `?agent=` → pre-populate agent filter
- `?status=` → pre-populate status filter
- `?q=` → pre-populate list search

**Client-side operations (after server fetch):**

1. **Search** — filter by title, agentLabel, status, source
2. **Sort** — client-side sort on current page (no server-side sort param)
3. **Selection** — `Set<string>` of selected IDs

**Toolbar buttons:**
| Button | State | Action |
|---|---|---|
| Update | disabled if nothing selected | alert (placeholder) |
| Delete | disabled if nothing selected | `confirm()` → clear selection |
| Export | always enabled | download CSV of current filtered+sorted rows |
| Filter | always | alert (placeholder) |
| Group | always | alert (placeholder) |
| × Clear | visible when any filter active | clears all filters |

**Sort indicators:** `⇅` (unsorted), `▲` (asc), `▼` (desc). Clicking the active column reverses direction.

**CSV export** uses `Blob` + temporary `<a>` click pattern. Exports all currently visible rows (filtered + sorted, current page).

---

### Job Detail (`/jobs/:id`)

**Data:**
- `useQuery(['job', id], () => api.getJob(id))` — refetchInterval: 3s when `status = processing | pending`

**Sections:**
- Record head: job number, title, status badge
- Metrics row: 4 mini-metrics (input tokens, output tokens, cost, source)
- Alerts: error message (red), running indicator with pulse animation (blue)
- Main card: 3 tabs (Output / Activity / Related Records)
- Side panel: record metadata + actions

**Output tab** uses `MarkdownView` — a custom in-file component that converts markdown text to React elements. Colored callout blocks are generated from `🔴` `🟡` `🔵` `🟢` heading prefixes.

**Interactions:**
- Follow button → toggles ★/☆, fires toast notification
- Copy record link → `navigator.clipboard.writeText(window.location.href)` + success/error toast
- Run again → `navigate('/trigger', { state: { agent: job.agentName } })` — pre-selects the correct agent tab
- Open in Notion → direct external link to `https://notion.so/<pageId>`

---

### Trigger (`/trigger`)

**State:** `tab: 'seo' | 'blog'` — set on mount from `location.state.agent` (set by "Run again" action in JobDetail).

**SEO Analyzer tab:**
- Fields: title (required), URL (optional), content (required textarea)
- Word count computed live from `content.split(/\s+/).length`
- Warning shown when 0 < wordCount < 300
- Submit: `POST /api/agents/seo-analyzer` → `navigate('/jobs/:jobId')`

**Blog Reviewer tab:**
- Fields: title (required), URL (required)
- Submit: `POST /api/agents/blog-reviewer` → `navigate('/jobs/:jobId')`

**Hotkey:** `⌘+Enter` (or `Ctrl+Enter`) submits the active form.

---

## API Client (`lib/api.ts`)

All HTTP is plain `fetch`. No axios.

**Types exported:**
- `Job` — single job row shape
- `JobResult` — result row (has `content: string`)
- `JobDetail extends Job` — job with `results: JobResult[]`
- `Stats` — dashboard analytics shape
- `JobsResponse` — paginated list response

**Methods:**
```typescript
api.getJobs(params?)  → Promise<JobsResponse>
api.getJob(id)        → Promise<JobDetail>
api.getStats()        → Promise<Stats>
```

All methods throw on non-OK HTTP status. TanStack Query catches and surfaces errors through `isError` / `error` query state.

---

## Toast System (`lib/toast.tsx`)

```typescript
// In any component:
const { toast } = useToast();

toast('Copied to clipboard', 'success');
toast('Failed to copy', 'error');
toast('Following this record', 'info');
```

Toasts auto-dismiss after 3 seconds. Positioned bottom-right. Max visible at once is unbounded (they stack vertically).

**Types:** `'success'` (green), `'error'` (red), `'info'` (blue)

---

## Styles (`index.css`)

No Tailwind classes in components — all styling via CSS custom properties and class names defined in `index.css`.

**CSS variables:**

| Variable | Value | Usage |
|---|---|---|
| `--sn-top` | `#071d25` | Header background |
| `--sn-rail` | `#082532` | Rail background |
| `--sn-left` | `#f5f7f8` | Nav sidebar background |
| `--sn-bg` | `#eef1f4` | Page background |
| `--sn-panel` | `#ffffff` | Card background |
| `--sn-green` | `#63cc66` | Active state, primary accent |
| `--sn-green-dark` | `#1f6f35` | Done status text |
| `--sn-link` | `#365ec9` | Link color |
| `--sn-font` | `"Source Sans 3"` | Body font |
| `--sn-mono` | `"JetBrains Mono"` | Monospace (tokens, cost, IDs) |

**Key component classes:**

| Class | Element |
|---|---|
| `.sn-shell` | Root flex container |
| `.sn-rail` | 52px fixed left rail |
| `.sn-nav` | 264px fixed navigator sidebar |
| `.sn-main` | Main content column (margin-left: 316px) |
| `.sn-header` | 54px sticky top header |
| `.workspace-tabs` | 40px sticky tab row (top: 54px) |
| `.sn-content` | Page content padding wrapper |
| `.sn-card` | White card with border + shadow |
| `.sn-table` | Data table with hover rows |
| `.sn-btn` | Standard button |
| `.sn-btn-primary` | Dark green primary button |
| `.status` | Status badge pill (+ `.done`, `.error`, `.processing`, `.pending`) |
| `.metric-card` | Dashboard stat card |
| `.list-toolbar` | Table header row with filters |
| `.side-panel` | Right-side detail panel |
| `.record-head` | Job detail header section |
| `.form-grid` | Two-column label/control form layout |

**Responsive breakpoints:**
- `≤1200px`: layout-grid goes single column, stats 2 columns
- `≤900px`: nav sidebar hidden, main margin-left → 52px
- `≤620px`: rail hidden, main margin-left → 0

---

## Vite Config

```typescript
// vite.config.ts
export default {
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
    }
  }
}
```

All `/api/*` requests from the frontend are proxied to the backend. No CORS configuration needed in dev. In production, put both behind the same reverse proxy (nginx, Caddy, etc.) at different paths.
