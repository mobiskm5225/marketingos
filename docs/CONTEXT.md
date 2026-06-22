# Acefone Marketing Intelligence — Project Context

> Single source of truth for new collaborators, Claude sessions, and planning. Updated: 2026-06-22.

---

## What This Is

Internal multi-agent AI platform for the Acefone marketing team. AI agents receive blog content or live URLs, run structured SEO/AEO/AIO analysis via GPT-4o, write results back to Notion, and log every run to PostgreSQL for cost tracking and observability.

Not a SaaS product. Not public-facing. Internal tool only.

---

## Repository

```
GitHub:   https://github.com/Moballigh5225/marketing-os
Branch:   release/0.5.0   ← all live code here
          main             ← intentionally empty, do not use
```

**Git workflow:**
```bash
git checkout release/0.5.0
git checkout -b feature/your-feature   # always branch from release/0.5.0
```

---

## Current Architecture

### Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 18+ · Express 5 · TypeScript 6 |
| TypeScript runner | tsx (dev) · tsc → node (Docker prod) |
| Database ORM | Drizzle ORM + PostgreSQL 16 (Docker) |
| AI | OpenAI GPT-4o (gpt-4o) via SDK 6 |
| Notion | @notionhq/client 5 |
| Web scraping | Cheerio + @mozilla/readability |
| Frontend | React 19 · Vite 8 · TanStack Query v5 · React Router v7 |
| Auth | JWT (HMAC-SHA256, Node crypto — no external dep) · 7-day TTL |
| Styling | Pure custom CSS in index.css (ServiceNow-inspired dark navy + green) |
| Container | Docker + docker-compose (Postgres + Backend + Frontend) |

### Ports

| Service | Port |
|---|---|
| Frontend (nginx/Vite) | 3000 |
| Backend API | 8000 |
| PostgreSQL | 5432 |

### Entry Points

Three ways to trigger an agent:

| Method | Route | Auth | Use case |
|---|---|---|---|
| Notion webhook | `POST /webhook` | HMAC-SHA256 (optional) | Auto-trigger when page set to Pending |
| Raw ingest | `POST /ingest` | `x-ingest-secret` header | Claude routine injection |
| Direct API | `POST /api/agents/*` | JWT Bearer token | Web UI Trigger page + cURL |

### Key Backend Files

```
backend/src/
├── index.ts                  Express entry — mounts all routes + middleware
├── registry.ts               Notion DB ID → agent handler map
├── agents/
│   ├── seo-analyzer/         Agent 1 — draft blog SEO review
│   ├── blog-reviewer/        Agent 2 — live URL audit (Existing Blog Reviewer)
│   └── wireframe-builder/    Agent 3 — placeholder, Phase 2
├── core/
│   ├── ai/openai.ts          GPT-4o streaming call + token cost calc
│   ├── notion/reader.ts      Read page blocks + properties from Notion
│   ├── notion/writer.ts      Create sub-pages, update status, chunk blocks
│   ├── db/schema.ts          Drizzle table definitions
│   └── crawler.ts            Crawl live URL → structured data (Cheerio + Readability)
├── middleware/
│   ├── requireAuth.ts        JWT Bearer token validation for /api/* routes
│   └── auth.ts               HMAC webhook verify + ingest secret check
└── routes/
    ├── auth.ts               POST /auth/login · GET /auth/me  (public)
    ├── jobs.ts               GET /api/jobs · /api/jobs/:id · /api/stats  (JWT)
    └── agents.ts             POST /api/agents/seo-analyzer · /api/agents/blog-reviewer  (JWT)
```

### Key Frontend Files

```
frontend/src/
├── App.tsx                   Shell (Rail + Nav + Header + Tabs) + AuthProvider + routing
├── lib/
│   ├── auth.tsx              AuthProvider · useAuth · login · logout · getToken
│   ├── api.ts                Typed fetch wrappers — auto-sends Bearer token, handles 401
│   └── toast.tsx             Toast context + useToast hook
└── pages/
    ├── Login.tsx             Auth gate — shown when no valid token
    ├── Dashboard.tsx         Stats cards + recent jobs + agent breakdown
    ├── Jobs.tsx              Full list — filter, sort, search, CSV export, checkboxes
    ├── JobDetail.tsx         Single job — markdown output, metrics, follow, copy link
    └── Trigger.tsx           Form to run agents directly — SEO Analyzer + Existing Blog Reviewer tabs
```

### Database Schema

Three tables in PostgreSQL:

| Table | Purpose |
|---|---|
| `agent_jobs` | One row per agent run — status, tokens, cost, source |
| `agent_results` | Full markdown output text (FK to agent_jobs) |
| `kb_cache` | Notion KB page cache — reserved for Phase 4 |

---

## Live Agents

### Agent 1 — SEO Analyzer

- **Input:** Draft blog content (paste in UI or via Notion page)
- **Output:** 5-layer scored SEO analysis (Technical / Content / Keywords / Readability / Links), score /50
- **Notion trigger:** Page in `NOTION_DATABASE_ID` with `SEO Status = Pending`
- **API trigger:** `POST /api/agents/seo-analyzer` `{ title, content, url? }`
- **Notion write:** Creates "SEO Analysis" sub-page inside the blog page
- **Model:** GPT-4o, streaming, max 4096 tokens out, temp 0.3

### Agent 2 — Existing Blog Reviewer

- **Input:** Live published blog URL (must be publicly accessible)
- **Output:** 3-lens (SEO/AEO/AIO) 8-module audit, score /100 with machine-readable JSON summary
- **Notion trigger:** Page in `BLOG_REVIEW_DB_ID` with `Review Status = Pending`
- **API trigger:** `POST /api/agents/blog-reviewer` `{ title, url }`
- **Notion write:** Creates "SEO Review" sub-page inside the review entry
- **Crawl data collected:** title, meta desc, H1/H2/H3, word count, internal/external links, image alts, clean body text
- **Model:** GPT-4o, same config as Agent 1

### Agent 3 — Wireframe Builder

- **Status:** Placeholder only. Phase 2.
- **Planned:** Generate content wireframes from a brief or keyword target

---

## Auth System

```
Backend:  JWT signed with HMAC-SHA256 using JWT_SECRET env var
          POST /auth/login → returns token (7-day TTL)
          GET  /auth/me    → validates current token

Frontend: Token stored in localStorage (key: mi_token)
          AuthProvider validates on mount via /auth/me
          All /api/* requests auto-send Authorization: Bearer <token>
          401 response → clearToken() + page reload (force login)
          Login page shown when no valid token exists
```

Required env vars for auth:
```
JWT_SECRET=<long random string>
ADMIN_USERNAME=<username>
ADMIN_PASSWORD=<password>
```

---

## Notion Integration

Four Notion databases used:

| Env var | Database | Agent |
|---|---|---|
| `NOTION_DATABASE_ID` | SEO Reviews DB | Agent 1 — SEO Analyzer |
| `BLOG_TRACKER_DATABASE_ID` | Blog Tracker DB | Routing only (URL-trigger flow) |
| `BLOG_REVIEW_DB_ID` | Blog Reviews Queue | Agent 2 — Existing Blog Reviewer |
| — | Knowledge Base (KB) | Phase 4 — not yet wired |

**Notion constraints enforced in code:**
- Max 100 blocks per API append request (writer.ts auto-chunks)
- Max 2,000 chars per block (markdownToBlocks enforces)
- Webhook retries 3× with 2s backoff (Notion eventual consistency)
- All DB IDs normalized (hyphens stripped) before comparison

---

## Cost Tracking

GPT-4o pricing applied to every call:
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens

Stored as `DECIMAL(10,6)` in `agentJobs.costUsd`. The Dashboard and `/api/stats` show:
- Total cost all time
- Cost this calendar month
- Cost and job count broken down by agent

---

## Running Locally

```bash
git checkout release/0.5.0
cp .env.example backend/.env   # fill in all keys

# Docker (full stack — recommended)
docker compose up --build
# First run only:
docker compose exec backend npm run db:migrate

# Or local dev (hot reload)
docker compose up -d postgres
cd backend && npm install && npm run db:migrate && npm run dev
cd frontend && npm install && npm run dev
```

See `docs/setup.md` for full instructions, troubleshooting, and ngrok webhook setup.

---

## Planned Future Work

### Phase 4 — KB Write-Back (not started)

After each agent run, write structured insights back to Notion Knowledge Base:
- SEO Analyzer → append keyword discoveries to KB-05
- Existing Blog Reviewer → log blog patterns to KB raw inputs
- Add `KB Change Log` page in Notion (timestamp + agent + what changed)
- `kb_cache` table (already in schema) prevents re-fetching same KB pages within TTL

### Phase 2 — Wireframe Builder Agent (scaffolded)

- Input: brief or keyword target
- Output: structured page layout with section recommendations and content guidelines
- File placeholder exists at `backend/src/agents/wireframe-builder/index.ts`
- Needs: prompt, pipeline, Notion DB, registration in registry.ts

### Pending Frontend Work

| Feature | Status |
|---|---|
| Activity log in Job Detail | Backend event table not built yet |
| System Health admin page | DB stats + health checks UI — not started |
| Update/Delete batch actions in Jobs list | UI wired, handlers are `alert()` placeholders |
| Filter/Group buttons in Jobs list | UI exists, logic not implemented |
| Administration nav items (System Health, Cost Rules, Webhooks) | UI exists, pages not built |

### Patterns for New Agents

Adding a new agent = 6 files + 1 env var:
1. `src/agents/<name>/index.ts` — implements `AgentHandler` interface
2. `src/agents/<name>/prompt.ts` — GPT-4o system prompt
3. `src/agents/<name>/types.ts` — agent-specific types
4. One line in `src/registry.ts` to map Notion DB ID → handler
5. One route in `src/routes/agents.ts` for direct API access
6. Env var in `.env` + `.env.example`
7. Create Notion DB with correct status property + connect integration

No other files change. All shared infra (logging, cost tracking, error handling, DB writes) is inherited.

---

## Key Constraints & Decisions

| Decision | Choice | Reason |
|---|---|---|
| No Tailwind arbitrary colors | Pure custom CSS in index.css | Tailwind v4 arbitrary colors are silently unreliable in this Vite setup |
| No jsonwebtoken package | Node.js crypto (HMAC-SHA256) | Zero external dep for JWT |
| express.json with verify | Single-pass body parsing | Raw body needed for Notion HMAC + req.body both available without consuming stream twice |
| tsx in dev, tsc+node in Docker | tsx watch for hot reload in dev | Docker uses compiled JS for smaller image + no dev dep needed at runtime |
| GPT-4o for all agents | Proven quality for SEO | Already validated in Python prototype; Claude reserved for future agents |
| PostgreSQL owns job state | Notion is KB only | Notion is not a database — job state, cost tracking, observability all in Postgres |
| Polling not streaming | 3s refetchInterval in TanStack Query | Simpler than SSE/WebSocket; acceptable UX for 30–60s agent runs |

---

## Naming Rules

- Agent 2 is always **"Existing Blog Reviewer"** — never "Blog Reviewer"
- Agent names in code: `seo-analyzer`, `blog-reviewer` (kebab-case, used in DB + API routes)
- Notion status properties: `SEO Status` (Agent 1), `Review Status` (Agent 2)
