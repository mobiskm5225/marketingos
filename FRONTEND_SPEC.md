# Marketing Intelligence OS — Frontend Spec

> Internal marketing ops tool. AI agents analyze/review/write blog content. Frontend shows job queues, live run monitoring, review workflows, team management, and admin. Think Linear + Notion + CI dashboard for a marketing team running AI agents.

---

## Shell Layout (always visible on every authenticated page)

### Left Rail — 52px wide, full height, dark `#082532`
- Logo circle "a"
- Rail icon buttons: Main nav, ~~Favorites~~, ~~History~~, ~~Workspaces~~ (dimmed, coming soon)
- Bottom: ~~Settings~~ (coming soon), User avatar circle with initials

### Collapsible Sidebar — 264px, light gray `#f5f7f8`
- Header: "Marketing Intelligence OS" + collapse toggle
- Search box: filter nav items inline
- **Nav group — Marketing Intelligence:** Dashboard, Trigger Agent, Review Queue, My Team, Admin
- **Nav group — Lists:** All Jobs, Active Runs, Errors, SEO Analyzer Jobs, Blog Reviewer Jobs, Blog Drafts
- Bottom tab strip: **All** | ~~Favorites~~ (Favorites dimmed, coming soon)

### Top Header — 54px, dark `#071d25`
- Left: grid menu icon, workspace pill (green dot + "MI OS Workspace")
- Center: global job search input (searches by title)
- Right: Help button, notification bell (unread count badge), sidebar toggle, profile dropdown (sign out)

### Workspace Tab Bar — sticky below header
- Fixed tabs: Dashboard · Jobs · Trigger Agent · Review Queue · My Team · Admin
- Dynamic tabs: open job detail pages appear as closeable tabs (scroll horizontally on overflow)

---

## Pages

---

### Login
**Route:** `/login` — unauthenticated only

Standalone centered card (380px), no shell. Dark header band with logo + product name. Username + password fields. Sign in button (shows spinner while loading). Error shown as red alert box beneath fields. Footer strip with version text.

---

### Dashboard
**Route:** `/` — home overview  
**Polls:** stats every 30s, jobs every 15s

Two-column layout: main content left + sidebar panel right (~280px).

#### Stats Row — 4 metric cards
| Card | Value | Interaction |
|------|-------|-------------|
| Total Jobs | Count all time | Clickable → /jobs |
| This Month Cost | $X.XX + total cost sub | — |
| Error Rate | X% + error count | Clickable → /errors |
| Active Agents | Count of agent types | — |

#### Recent Jobs Table
20 rows, sortable columns: Number · Agent · Title · Status badge · Cost · Source tag · Created.  
FilterBar above table. Click row → job detail.

#### Right Sidebar Panel
- **System Health:** Queue status badge (Active/Idle), open errors count (→ /errors), processing count (→ /jobs/active), pending count (→ /jobs/active)
- **Agent Breakdown:** per-agent job count + cost
- **Quick Links:** Trigger Agent · All Jobs · View Errors · Active Runs

**Actions:** Refresh · + Trigger Agent

---

### All Jobs
**Route:** `/jobs`  
**Polls:** every 15s

Full paginated list of every job across all agents and statuses.

#### FilterBar
Chips for active filters. "+ Add filter" opens inline editor. Columns filterable: Number (text), Agent (select), Title (text), Status (select), Cost (number), Source (select), Created (date). Full operator sets per type.

#### Table — sortable columns
| Column | Type | Notes |
|--------|------|-------|
| Number | link | J-XXXXX → job detail |
| Agent | text | agent name |
| Title | text | job/blog title |
| Status | badge | pending / processing / done / error |
| Tokens In / Out | number | mono font |
| Cost | $ | mono font |
| Source | tag | api / webhook / ingest |
| Created | timestamp | relative + absolute on hover |

**Pagination:** 20 rows/page. Prev / Next. Row range counter ("1–20 of 347").  
**Actions:** Export CSV · + New

---

### Active Runs
**Route:** `/jobs/active` — live monitor  
**Polls:** jobs every 5s, stats every 10s

Real-time live monitor. No pagination — shows all current jobs. Header badge: `● Live` (green pulse) or `○ Idle`.

#### Stats Row — 4 cards
| Card | Value |
|------|-------|
| Now Running | Processing job count |
| Queued | Pending job count |
| Error Rate | All-time % |
| Month Cost | $X.XX this month |

#### Agent Activity Card
Shown only when jobs are running. Pill tags per agent: `● SEO Analyzer  3 running`

#### Now Running Card
Flow list, one row per processing job:  
`●` pulse dot | Agent tag | Title | **Elapsed timer** (live, ticks every 1s) | Source tag | J-XXXXX link

#### Queued Card
Table: Number · Agent · Title · Source · Waiting time

**Actions:** + New Run

---

### Errors
**Route:** `/errors` — failed runs  
**Polls:** every 15s

Filtered view: status = error only. Same layout as All Jobs.

| Column | Notes |
|--------|-------|
| Number | J-XXXXX link |
| Agent | — |
| Title | — |
| Error Message | mono font, truncated |
| Source | tag |
| Created | timestamp |

FilterBar columns: Agent · Title · Error message (text) · Source · Created.  
**Actions:** Refresh · + New Run

---

### Trigger Agent
**Route:** `/trigger`

Form page to start a new agent job. Shows tabs if user has both permissions.

#### Tab: SEO Analyzer
- Blog Title (required)
- Blog URL (optional)
- Blog Content — textarea (required), shows word count + warning if < 300 words
- Submit: "Run SEO Analysis" — keyboard shortcut: Cmd/Ctrl+Enter

#### Tab: Blog Reviewer
- Blog Title (required)
- Live Blog URL (required, publicly accessible — crawled automatically)
- Submit: "Run Blog Review"

On success → navigates to `/jobs/{jobId}`. Error shown as red alert. Clear All button resets form.

---

### Job Detail
**Route:** `/jobs/:id`  
**Auto-refresh:** every 3s while processing/pending

Record view. Opens as closeable workspace tab. Two-column: main content + right info panel (~280px).

#### Header Zone
- Breadcrumb: Jobs / J-XXXXX
- Record number: "J-XXXXX · Agent Name"
- Title: job title or Notion page ID
- Created date · Source tag · large Status badge
- Buttons: Follow/Unfollow · Update · Run again

#### Metrics Row — 4 cells
Input Tokens · Output Tokens · Cost ($) · Source

#### Alert Boxes
- If **error**: red alert `Error: {message}`
- If **processing/pending**: blue alert with pulse dot "Agent is running — auto-refreshes every 3s"

#### Content Tab Bar
| Tab | Content |
|-----|---------|
| Analysis Output | Markdown-rendered job output. If none: "written to Notion" message. |
| Review | Two-step workflow (see below). Only if job done. |
| Activity | Placeholder — coming soon |
| Related Records | Placeholder — no records |

#### Review Tab — Two-Step Workflow

**Step 1: Member Review** (circle "1")  
Shows reviewer name + note if claimed. If available: "Claim for Review" button. If current user is reviewer: textarea + "Submit Review" button.

**Step 2: Manager Decision** (circle "2")  
Shows manager name + comment. If current user is manager and step 1 done: "Make Decision" → expands textarea + Approve / Request Changes / Reject buttons.

#### Right Info Panel
- **Record info:** State · Agent · Source · Created · Updated
- **Actions:** "Open in Notion ↗" (if notionPageId) · "Copy record link" · "↺ Run again"

---

### Review Queue
**Route:** `/reviews`  
**Permission:** `jobs:review`  
**Polls:** every 15s

Consolidated queue of all jobs needing human review or manager approval.

**Toolbar:** Status filter dropdown (All / Pending Review / Under Review / Reviewed / Approved / Rejected / Needs Changes). Count pills: `● 5 pending` · `● 2 awaiting approval` · `● 1 claimed by you`

| Column | Notes |
|--------|-------|
| Job | Title as link → /jobs/id |
| Agent | — |
| Group | badge |
| Status | color-coded badge |
| Reviewer | assigned member name |
| Lead | approving manager name |
| Age | "X days ago" |
| Actions | View · Claim · Submit · Decide (contextual per state) |

---

### SEO Analyzer Jobs
**Route:** `/agents/seo`  
**Permission:** `agents:trigger:seo-analyzer`  
**Polls:** every 15s

Filtered job list: `agent = seo-analyzer`. Status filter dropdown. Active jobs count pill. Pagination 25/page.

| Column | Notes |
|--------|-------|
| Title / Page | Title + Notion page ID if available |
| Status | color badge |
| Source | tag |
| Tokens | in + out combined |
| Cost | $ |
| Age | time ago |
| View | → job detail |

---

### Blog Reviewer Jobs
**Route:** `/agents/blog-reviewer`  
**Permission:** `agents:trigger:blog-reviewer`

Identical layout to SEO Analyzer Jobs, filtered to `agent = blog-reviewer`.

---

### Blog Drafts
**Route:** `/blog-drafts`  
**Permission:** `blog-drafts:manage`  
**Polls:** every 30s

Accordion list of AI-generated blog drafts awaiting content team review.

**Toolbar:** Status filter dropdown (All / Pending / In Review / Approved / Rejected). Count pills: pending · in review.

#### Accordion Rows
**Collapsed:** Title · Status badge · Source tag · URL (truncated) · Age · Reviewer name · Chevron

**Expanded:**
- Draft content box (gray, scrollable, max 320px height)
- Existing review note (amber box, if any)
- Action buttons based on state:

| State | Actions shown |
|-------|--------------|
| pending | "Claim for Review" |
| in_review (not deciding) | "Decide" |
| in_review (deciding) | Textarea + Approve / Reject / Cancel |
| approved / rejected | "✓ Approved" or "✕ Rejected" + review date |

---

### Team Management
**Route:** `/team`  
**Access:** must be manager in ≥1 group

Group-scoped view. Multiple groups → tabs to switch between them.

**Left — Member Table:**
| Column | Notes |
|--------|-------|
| User | Avatar circle + name + email. "you" badge for current user. |
| Role | member / manager badge |
| Actions | Promote/Demote · Remove (red) |

**Right — Add Member Panel:**
- User dropdown (candidates not yet in group)
- Role radio buttons: member / manager
- "Add to {groupName}" button

---

### Admin
**Route:** `/admin`  
**Permission:** `admin:users`

Two tabs: **Users & Groups** | **Audit Log**

#### Tab: Users & Groups

**Users Panel (left):**
- "+ New user" → inline creation form (username + password)
- User list: avatar + name (INACTIVE tag if disabled) + groups
- Per user: "Groups" → expands group checkboxes + role radio → Save/Cancel
- "Deactivate" / "Activate" toggle

**Groups Panel (right):**
- List: group name + description
- Permission badges: `*` (orange, wildcard) or specific perm names (blue)

#### Tab: Audit Log
Filters: action text, username text.  
Table: Time · User · Action (mono) · Entity (type + partial ID) · Details (mono, truncated).  
Pagination: 50/page.

---

## Shared Components

### FilterBar
Used on: Dashboard, All Jobs, Errors, SEO Jobs, Blog Reviewer Jobs.

Chips display active conditions with inline edit (click chip) and × remove. "+ Add filter" opens editor below strip. "Clear all" removes everything. Filters applied with AND logic.

**Operators per column type:**
| Type | Operators |
|------|-----------|
| text | contains · doesn't contain · starts with · ends with · is · is not · is empty · is not empty |
| select | is · is not |
| number | = · ≠ · > · < · ≥ · ≤ · between |
| date | on · before · after · between · today · last 7 days · last 30 days · this month |

Backend receives only exact-match `agent`/`status` conditions via query params. All other filters applied client-side on fetched data.

### Notification Panel
Slides open from bell icon in header. Unread count badge on bell.

| Type | Icon/Color |
|------|-----------|
| job_done | ✓ green |
| job_error | ✕ red |
| job_started | ▶ blue |
| system | i gray |

Per notification: mark read · dismiss. Footer: "Mark all read" · "Clear read". Polls every 15s.

---

## Design System

### Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `--sn-top` | `#071d25` | Top header background |
| `--sn-rail` | `#082532` | Left rail background |
| `--sn-left` | `#f5f7f8` | Sidebar background |
| `--sn-bg` | `#eef1f4` | Main page background |
| `--sn-panel` | `#ffffff` | Cards / panels |
| `--sn-border` | `#d5dadd` | Standard borders |
| `--sn-text` | `#1f2d33` | Primary text |
| `--sn-muted` | `#5f6f78` | Secondary / label text |
| `--sn-green` | `#63cc66` | Success, primary button |
| `--sn-blue` | `#246bfe` | Info, links |
| `--sn-orange` | `#a85c00` | Warning |
| `--sn-red` | `#b42318` | Error, destructive |

### Status Badge Colors
| Status | Color |
|--------|-------|
| pending | orange |
| processing | blue |
| done | green |
| error | red |
| reviewed | purple |
| approved | green |
| rejected | red |
| needs_changes | orange |

### Typography
- Body: Source Sans 3 / Segoe UI / Roboto — 14px base
- Mono: JetBrains Mono / Consolas — IDs, costs, tokens, code
- Weights: 400 (body) · 600 (labels) · 700 (section heads) · 800 (page title, metric values)

### Key CSS Classes
| Class | What it is |
|-------|-----------|
| `.sn-card` | White card, 1px border, 4px radius, shadow |
| `.metric-card` | Stat card: label + big number + sub text + icon |
| `.sn-table` | Full-width data table, hover rows |
| `.side-panel` | Right info panel in detail views |
| `.page-titlebar` | Page header zone: kicker + h1 + subtitle + meta |
| `.crumb-row` | Top strip: breadcrumb left + action buttons right |
| `.tag` | Inline small pill with colored dot |
| `.status` | Colored status badge |
| `.sn-btn` | White bordered button |
| `.sn-btn-primary` | Green primary button |
| `.filter-chip` | Active filter chip (label + × remove) |
| `.pulse` | Animated pulsing dot for live indicators |

### Responsive Breakpoints
| Width | Change |
|-------|--------|
| < 1200px | Layout → single column, stats → 2 columns |
| < 900px | Sidebar hidden (rail only 52px), workspace pill hidden, forms → single column |
| < 620px | Rail hidden, full-width, compact 12px padding |

---

## RBAC Permissions Matrix

| Permission | Gates |
|-----------|-------|
| `agents:trigger:seo-analyzer` | SEO Analyzer tab in Trigger · SEO Jobs list |
| `agents:trigger:blog-reviewer` | Blog Reviewer tab in Trigger · Blog Reviewer Jobs list |
| `jobs:review` | Review Queue page |
| `jobs:approve` | Auto-granted to group managers — approve/reject in review workflow |
| `blog-drafts:manage` | Blog Drafts page |
| `admin:users` | Admin page |
| `*` | Wildcard — full access (admins group) |
| Manager in any group | My Team page visible |

---

## Real-time Polling Intervals

| Page / Data | Interval |
|-------------|----------|
| Active Runs — jobs | 5s |
| Active Runs — elapsed timer | 1s (setInterval) |
| Active Runs — stats | 10s |
| Job Detail (while running) | 3s |
| Jobs list, Errors, Reviews, Notifications | 15s |
| Dashboard jobs | 15s |
| Dashboard stats, Blog Drafts | 30s |
