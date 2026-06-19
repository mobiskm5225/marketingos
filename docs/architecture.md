# Architecture

## System Overview

Acefone Intelligence is a multi-agent SEO and content analysis platform. AI agents receive blog content or live URLs, run structured analysis via GPT-4o, write results back to Notion, and log every run to PostgreSQL for cost tracking and observability.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ENTRY POINTS                               │
│                                                                     │
│  Notion Webhook      POST /ingest         POST /api/agents/*        │
│  (page.created)      (raw content)        (direct API trigger)      │
│        │                   │                       │                │
└────────┼───────────────────┼───────────────────────┼────────────────┘
         ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Express Backend  :8000                         │
│                                                                     │
│  routes/webhook.ts   routes/ingest.ts   routes/agents.ts           │
│         │                   │                   │                   │
│         └───────────────────┴───────────────────┘                  │
│                             │                                       │
│                     registry.ts                                     │
│                   (DB ID → agent map)                               │
│                        │         │                                  │
│                        ▼         ▼                                  │
│          seo-analyzer/    blog-reviewer/                            │
│          index.ts         index.ts                                  │
│               │                │                                    │
│               ▼                ▼                                    │
│         core/ai/openai.ts  core/crawler.ts                         │
│         core/notion/*      core/notion/*                            │
│         core/db/*          core/db/*                                │
└─────────────────────────────────────────────────────────────────────┘
         │              │               │
         ▼              ▼               ▼
    OpenAI GPT-4o   Notion API    PostgreSQL 16
    (analysis)      (read+write)  (job tracking)
                                       │
                                       ▼
                              React Frontend :3000
                              routes/jobs.ts API
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 18+ |
| Backend Framework | Express | 5.x |
| Language | TypeScript | 6.x |
| TypeScript Executor | tsx | 4.x |
| ORM | Drizzle ORM | 0.45.x |
| Database | PostgreSQL | 16 (Docker) |
| AI Model | OpenAI GPT-4o | via SDK 6.x |
| Notion SDK | @notionhq/client | 5.x |
| HTML Parsing | Cheerio | 1.x |
| Article Extraction | @mozilla/readability | 0.6.x |
| Frontend Framework | React | 19.x |
| Build Tool | Vite | 8.x |
| Routing | React Router | 7.x |
| Server State | TanStack Query | 5.x |
| Icons | lucide-react | 1.x |
| Container | Docker / docker-compose | — |

---

## Directory Structure

```
acefone-intelligence/
├── backend/
│   ├── src/
│   │   ├── agents/                    # One folder per agent
│   │   │   ├── seo-analyzer/
│   │   │   │   ├── index.ts           # Pipeline logic + both execution paths
│   │   │   │   ├── prompt.ts          # GPT-4o system prompt (5-layer SEO framework)
│   │   │   │   └── types.ts           # AgentHandler interface
│   │   │   ├── blog-reviewer/
│   │   │   │   ├── index.ts           # Pipeline logic + crawl integration
│   │   │   │   ├── prompt.ts          # GPT-4o system prompt (8-module audit)
│   │   │   │   └── types.ts
│   │   │   └── wireframe-builder/
│   │   │       └── index.ts           # Placeholder — Phase 2
│   │   ├── core/
│   │   │   ├── ai/
│   │   │   │   ├── openai.ts          # callOpenAI() — streaming GPT-4o + cost calc
│   │   │   │   └── anthropic.ts       # Placeholder for Claude API
│   │   │   ├── db/
│   │   │   │   ├── index.ts           # Drizzle instance + pg pool
│   │   │   │   ├── schema.ts          # agentJobs, agentResults, kbCache tables
│   │   │   │   └── migrations/        # Drizzle migration output
│   │   │   ├── notion/
│   │   │   │   ├── reader.ts          # getPageContent, getPageProperties, queryDatabase
│   │   │   │   └── writer.ts          # createSubpage, createDatabaseEntry, updateStatus
│   │   │   └── crawler.ts             # crawlUrl() — Cheerio + Readability
│   │   ├── middleware/
│   │   │   ├── auth.ts                # HMAC webhook verify + ingest secret
│   │   │   └── logger.ts              # Morgan HTTP logger
│   │   ├── routes/
│   │   │   ├── health.ts              # GET /health
│   │   │   ├── webhook.ts             # POST /webhook
│   │   │   ├── ingest.ts              # POST /ingest
│   │   │   ├── jobs.ts                # GET /api/jobs, /api/jobs/:id, /api/stats
│   │   │   └── agents.ts              # POST /api/agents/*
│   │   ├── registry.ts                # Notion DB ID → agent handler map
│   │   ├── logger.ts                  # Structured JSON logger
│   │   └── index.ts                   # Express app entry point
│   ├── scripts/
│   │   ├── migrate.ts                 # Run Drizzle migrations
│   │   └── backfill.ts                # One-off backfill utility
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Stats + recent jobs + system health
│   │   │   ├── Jobs.tsx               # Paginated list + filter + sort + export
│   │   │   ├── JobDetail.tsx          # Single job + markdown output
│   │   │   └── Trigger.tsx            # Agent submission forms
│   │   ├── lib/
│   │   │   ├── api.ts                 # TypeScript API client
│   │   │   └── toast.tsx              # Toast notification context + hook
│   │   ├── App.tsx                    # Shell layout + router + nav
│   │   ├── main.tsx                   # React DOM entry
│   │   └── index.css                  # ServiceNow-inspired global styles
│   ├── index.html
│   ├── vite.config.ts                 # Proxy /api → :8000
│   └── package.json
├── docs/                              # This folder
├── docker-compose.yml                 # PostgreSQL 16
└── .env.example
```

---

## Data Flow

### Webhook-triggered flow (Notion → Agent → Notion + DB)

```
1. User sets SEO Status = "Pending" on Notion page
2. Notion fires POST /webhook
3. Backend verifies HMAC signature (if configured)
4. registry.ts maps parent DB ID → correct agent
5. Agent checks status = "Pending" (skip otherwise)
6. Agent updates status → "Processing"
7. Agent fetches page content via Notion API
8. Agent calls GPT-4o (streaming)
9. Agent creates "SEO Analysis" sub-page in Notion
10. Agent updates status → "Done"
11. All steps log to agentJobs + agentResults in PostgreSQL
```

### API-triggered flow (Frontend → Agent → DB only)

```
1. User fills form at /trigger in React frontend
2. POST /api/agents/seo-analyzer (or blog-reviewer)
3. Backend creates job record (status=pending)
4. Returns { jobId } immediately (202 Accepted)
5. Background: agent runs analysis
6. Agent updates job record → done/error
7. Frontend polls GET /api/jobs/:jobId every 3s
8. On done: renders markdown output from agentResults
```

### Blog Tracker flow (Notion URL trigger → SEO review)

```
1. Team adds entry to Blog Tracker DB (Name + Blog URL)
2. Notion fires webhook
3. Backend detects parent = BLOG_TRACKER_DATABASE_ID
4. Extracts blog URL from page properties
5. Extracts Notion page ID from URL
6. Dedup check: skip if SEO review already exists for this title
7. Creates new entry in NOTION_DATABASE_ID with Status=Pending
8. Routes to SEO Analyzer agent → normal webhook flow continues
```

---

## Agent Registry Pattern

Adding a new agent requires only:

1. Create `src/agents/<name>/index.ts` implementing `AgentHandler`
2. Create `src/agents/<name>/prompt.ts` with system prompt
3. Add one line in `src/registry.ts`:
   ```typescript
   if (process.env.NEW_DB_ID) {
     map.set(process.env.NEW_DB_ID.replace(/-/g, ''), newAgent);
   }
   ```
4. Add one route in `src/routes/agents.ts` for direct API access
5. Add `NEW_DB_ID` to `.env`

Nothing else changes — webhook routing, DB logging, error handling are all shared.

---

## Dual Execution Paths

Every agent supports two entry paths:

| | Notion-triggered | API-triggered |
|---|---|---|
| Input source | Notion page blocks | Request body |
| Notion read | Yes | No |
| Notion write | Yes (creates sub-page) | No |
| Result storage | Notion + PostgreSQL | PostgreSQL only |
| Status property | Updated on Notion page | N/A |
| Entry point | `run(pageId, jobId)` | `runDirect(...)` |

---

## OpenAI Cost Tracking

All GPT-4o calls go through `core/ai/openai.ts`. Pricing applied:

| Token type | Rate |
|---|---|
| Input | $2.50 / 1M tokens |
| Output | $10.00 / 1M tokens |

Cost is stored as `DECIMAL(10,6)` in `agentJobs.costUsd`. The `/api/stats` endpoint aggregates by agent and current calendar month.

---

## Notion API Constraints

These are enforced throughout the codebase:

- **Max 100 blocks per append request** — `writer.ts` auto-chunks
- **Max 2,000 characters per block** — enforced in `markdownToBlocks()`
- **Eventual consistency** — webhook handler retries 3× with 2s backoff before processing
- **API version** — `2022-06-28` (pinned in all requests)
- **Page IDs** — always normalized (hyphens removed) before comparison
