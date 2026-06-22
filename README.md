# Marketing Intelligence OS

Internal AI agent platform for content operations — automates SEO analysis and blog review workflows via Notion, API, or web UI.

> **Branch:** All code lives on `release/0.5.0`. `main` is intentionally empty.

---

## What It Does

| Agent | Trigger | Output |
|---|---|---|
| **SEO Analyzer** | Notion webhook / Web UI / API | 5-layer pre-publish SEO report (keywords, readability, citations, technical signals) |
| **Blog Reviewer** | Notion webhook / Web UI / API | Post-publish audit — content, SEO, and conversion review |

Jobs are tracked end-to-end: created → queued → processing → done/error, with token usage and cost logged per run.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router v6, TanStack Query |
| Backend | Node.js (v18+), Express, TypeScript, tsx |
| Database | PostgreSQL (via Drizzle ORM) |
| AI | OpenAI GPT-4o |
| Integrations | Notion API, Notion Webhooks |
| Infrastructure | Docker Compose (Postgres + backend + frontend + nginx) |
| Auth | JWT (7-day tokens) |

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/Moballigh5225/marketing-os.git acefone-intelligence
cd acefone-intelligence
git checkout release/0.5.0

cp .env.example backend/.env
# Edit backend/.env — add JWT_SECRET, OPENAI_API_KEY, NOTION_API_KEY, database IDs

docker compose up --build

# First run only:
docker compose exec backend npm run db:migrate
```

Open [http://localhost:3000](http://localhost:3000) → login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.

### Local Dev

```bash
# Backend
cd backend && npm install && npm run db:migrate && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

---

## UI Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/` | Stats overview — total jobs, costs, error rate, recent activity |
| All Jobs | `/jobs` | Full job list with advanced column filters |
| Active Runs | `/jobs/active` | Live monitor — pulsing job cards, queue, per-agent activity |
| Errors | `/errors` | Failed runs with error messages |
| Trigger Agent | `/trigger` | Manually submit a job via the web UI |
| Job Detail | `/jobs/:id` | Full output, token/cost breakdown, raw results |

---

## API Endpoints

```
POST /auth/login          — get JWT token
GET  /auth/me             — verify token

GET  /api/jobs            — list jobs (filter: agent, status, limit, offset)
GET  /api/jobs/:id        — job detail + agent results
GET  /api/stats           — aggregate stats (byStatus, byAgent, costs, error rate)

POST /api/agents/seo-analyzer   — trigger SEO analysis
POST /api/agents/blog-reviewer  — trigger blog review

POST /webhook             — Notion webhook receiver
POST /ingest              — direct content ingest
GET  /health              — health check
```

All `/api/*` routes require `Authorization: Bearer <token>`.

---

## Environment Variables

```env
PORT=8000
JWT_SECRET=<random-string>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
DATABASE_URL=postgresql://acefone:acefone@localhost:5432/acefone
OPENAI_API_KEY=sk-...
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=<32-char-hex>
NOTION_WEBHOOK_SECRET=          # optional — leave empty to skip HMAC
INGEST_SECRET=                  # optional
BLOG_TRACKER_DATABASE_ID=       # optional
BLOG_REVIEW_DB_ID=              # optional
```

---

## Docs

Full documentation in [`/docs`](./docs/):

- [Setup & Running](./docs/setup.md) — full setup, Docker, local dev, ngrok, troubleshooting
- [Architecture](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Agents](./docs/agents.md)
- [Frontend](./docs/frontend.md)

---

## Git Workflow

```
main              — empty, do not use
release/0.5.0     — stable base, all work branches from here
feature/*         — new features
fix/*             — bug fixes
```

---

## License

Internal tool — Marketing Intelligence OS. Not for public distribution.
