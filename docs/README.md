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
| [tracker.md](./tracker.md) | **Build tracker** — every table, endpoint and feature, built vs not built |
| [frontend.md](./frontend.md) | Design system, routes, component structure, the data contract the backend must satisfy |

Five files, plus this index. Anything not here was describing the deleted backend and has been removed.

---

## Current status

Backend rebuilt and wired to the frontend. Everything below is verified against the running stack,
not aspirational.

| Area | State |
|---|---|
| Frontend UI | 7 pages, all rendering real data |
| Frontend mutations | Wired — every control calls the API. The three that cannot work yet are **disabled with a reason**, never faked |
| Backend | 48 endpoints across 9 routers |
| Skills library | CRUD + import from folder, zip and GitHub |
| Agent builder | Pipeline map, per-stage model routing, categories, cycle detection |
| Knowledge ingestion | PDF/DOCX/XLSX/CSV/MD parsed, chunked, embedded, indexed |
| Knowledge retrieval | pgvector similarity, with full-text fallback when no embedding key is set |
| Integrations | Notion, Obsidian, Google Drive connect + sync. Microsoft Office blocked on OAuth |
| Model providers | Keys encrypted at rest, endpoint probe, per-stage routing. Ollama verified end to end |
| **Agent execution** | **Not built — this is the remaining gap** |
| Auth | **None.** Deliberate for now — see the warning below |

### Phases

| Phase | Scope | State |
|---|---|---|
| 0 | Repo unbroken, Docker cold start | done |
| 1 | Schema — 21 tables, categories, pgvector | done |
| 2 | Skills library + 3 import paths | done |
| 3 | Agent builder, pipeline map, per-layer model routing, categories | done |
| 4 | Knowledge: ingest, retrieval, memory layers, 3 connectors | done |
| 5 | **Pipeline runtime — execute a DAG, record every stage** | **next** |
| 6 | Remaining frontend polish, run streaming | pending |
| 7 | Docs refresh | pending |

### What Phase 5 unblocks

Three controls are disabled today purely because nothing can execute a pipeline yet:

- **Re-run with edits** on a run report
- Running an agent at all — there is no "Run" button, because there is no runtime
- Real `runs` rows; the run list is populated only by manual inserts

Phase 5 builds `core/agent/runner.ts`: resolve levels via `dag.ts`, execute each level
concurrently, resolve each stage's model (stage override, else agent default), retrieve grounding
via `knowledge/retrieve.ts`, record `run_stages` rows with tokens and cost, and honour gates.

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
