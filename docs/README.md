# Marketing OS — Documentation

A platform for building marketing agents. You create an agent, give it a role and skills, connect it
to knowledge bases, pick a model, and review every run it produces.

It is **not** a fixed set of Acefone SEO agents. Agents are rows in a database created through the UI,
executed by one generic runtime. An earlier version of this repo hardcoded three agents
(`seo-analyzer`, `blog-reviewer`, `linkedin-creatives`); that code was removed in `c31678c` and is not
coming back — those become agents a user creates, not modules a developer writes.

---

## Docs index

| File | Contents |
|---|---|
| [setup.md](./setup.md) | **Start here.** Prerequisites, env vars, running locally and in Docker, troubleshooting |
| [architecture.md](./architecture.md) | Stack, directory layout, database schema, agent runtime, knowledge pipeline, build phases |
| [api.md](./api.md) | Every HTTP endpoint — what exists today and what each phase adds |
| [frontend.md](./frontend.md) | Design system, routes, component structure, the data contract the backend must satisfy |

Four files, plus this index. Anything not here was describing the deleted backend and has been removed.

---

## Current status

The frontend is complete and fresh. The backend is being rebuilt underneath it to match.

| Area | State |
|---|---|
| Frontend UI | Built — all 5 pages, every layout and component |
| Frontend mutations | **Stubbed.** Every button calls `toast.success(...)` and mutates React state only |
| Backend reads | 7 GET endpoints, serving real data from Postgres |
| Backend writes | **None yet** |
| Agent execution | **Not built yet** |
| Knowledge ingestion / retrieval | **Not built yet** |
| Auth | **None.** Deliberate for now — see the warning below |

Build order and the full plan live in [architecture.md](./architecture.md#build-phases).

---

## Quick reference

```bash
# Postgres (pgvector image, published on host port 5433)
docker compose up -d postgres

# Backend
cd backend && npm run db:migrate && npm run seed && npm run dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

| URL | Service |
|---|---|
| `http://localhost:8081` | Frontend (Vite picks the next free port from 8080) |
| `http://localhost:8000` | Backend API |
| `localhost:5433` | PostgreSQL (container) |

```bash
curl http://localhost:8000/health          # {"status":"ok"}
curl http://localhost:8000/api/agents      # seeded demo agents
```

**Stack:** Node 22 · Express 5 · TypeScript · PostgreSQL 16 + pgvector · Drizzle ORM · React 19 ·
TanStack Start · Tailwind CSS v4 · shadcn/ui

---

## Open issues

These are live. Everything else in the old bug tracker referred to files that no longer exist.

| # | Severity | Issue | Where |
|---|---|---|---|
| 1 | 🟠 High | **API has no auth at all.** Port 8000 accepts anything and will hold provider API keys and spend money on model calls once the runtime lands. It is bound to `127.0.0.1` in `docker-compose.yml` for this reason — do not widen that until auth exists | `backend/src/index.ts` |
| 2 | 🟠 High | **SSRF in the crawler.** `crawlUrl()` fetches any URL with no protocol or IP validation, so a user-supplied address like `http://169.254.169.254/` would reach cloud metadata or internal services. Latent today (nothing calls it) — must be fixed before the web knowledge source ships in Phase 4 | `backend/src/core/crawler.ts:19` |
| 3 | 🟡 Medium | **65 MB of Windows binaries committed** — `ngrok.exe` and `.ngrok.exe.old` are tracked in git. Removing them from history needs a rewrite; at minimum stop tracking them | repo root |
| 4 | 🟡 Medium | **Zero tests.** No unit, integration or e2e coverage anywhere | — |
| 5 | 🟢 Low | `agent.lastRun` is returned as a raw Postgres timestamp string (`2026-08-15 14:10:59.525282+00`) rather than ISO, because it comes from a `MAX()` aggregate | `backend/src/routes/agents.ts` |

Previously flagged and no longer true: live API keys in `backend/.env` (now placeholders, and the file
is untracked), Postgres exposed on all interfaces (now `127.0.0.1:5433`), missing CORS (added),
missing security headers (`helmet` is applied).

---

## Git workflow

```
main            — do not use
release/0.5.0   — all development happens here
feature/*       — branch from release/0.5.0
```
