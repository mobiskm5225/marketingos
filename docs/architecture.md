# Architecture

How the platform is put together: the stack, where code lives, the database schema, and the two
subsystems that make it a platform rather than a CRUD app — the agent runtime and the knowledge
pipeline.

---

## System overview

One Express process serves the API and runs the agent worker. Postgres holds everything, including
the job queue and the vector index. There is no Redis, no separate worker service, and no message
broker.

```
                 Browser
                    │
                    ▼
      TanStack Start (SSR)  :8081
      route loaders + mutations
                    │  HTTP/JSON
                    ▼
      ┌──────────────────────────────────┐
      │      Express API      :8000      │
      │                                  │
      │  routes/  agents knowledge       │
      │           settings runs activity │
      │              │                   │
      │     ┌────────┴────────┐          │
      │     ▼                 ▼          │
      │  core/agent/     core/knowledge/ │
      │   runner          ingest         │
      │   provider        retrieve       │
      │   queue           distill        │
      │     │                 │          │
      │     └────────┬────────┘          │
      │              ▼                   │
      │       core/integrations/         │
      │       notion  obsidian  web      │
      └──────────────┬───────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   Model providers  Notion    PostgreSQL 16
   OpenAI/Anthropic  API      + pgvector
   Gemini/Ollama              (data, queue,
   /vLLM                       embeddings)
```

The queue is not a separate component. `runs.status` **is** the queue: a worker loop inside the same
process claims `pending` rows with `FOR UPDATE SKIP LOCKED`, so the design stays correct if a second
process is ever added.

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 |
| Backend framework | Express | 5.x |
| Language | TypeScript | 6.x (backend) · 5.8 (frontend) |
| TypeScript executor | tsx (dev) · tsc → node (Docker) | 4.x |
| ORM | Drizzle ORM | 0.45.x |
| Database | PostgreSQL + pgvector | 16 |
| Security headers | helmet | 8.x |
| Rate limiting | express-rate-limit | 8.x |
| HTML parsing | Cheerio | 1.x |
| Article extraction | @mozilla/readability | 0.6.x |
| Notion SDK | @notionhq/client | 5.x |
| Frontend framework | React | 19.x |
| Frontend meta-framework | TanStack Start (Nitro SSR) | 1.168 |
| Routing | TanStack Router (file-based) | 1.170 |
| Server state | TanStack Query | 5.x |
| Build tool | Vite | 8.x |
| Styling | Tailwind CSS v4 + shadcn/ui | — |
| Container | Docker / docker-compose | — |

---

## Directory structure

```
marketing-os/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── agent/                  # The generic runtime — see below
│   │   │   │   ├── runner.ts           #   composes prompt, retrieves, calls model, persists
│   │   │   │   ├── provider.ts         #   model name → client (OpenAI-compatible or Anthropic)
│   │   │   │   └── queue.ts            #   claims pending runs, resets orphans on boot
│   │   │   ├── knowledge/              # The memory pipeline — see below
│   │   │   │   ├── ingest.ts           #   parse → chunk → embed → store
│   │   │   │   ├── retrieve.ts         #   embed query → top-k chunks via pgvector
│   │   │   │   └── distill.ts          #   raw → notes → facts → core memory
│   │   │   ├── integrations/           # One module per source, common interface
│   │   │   │   ├── notion.ts           #   wraps core/notion/reader.ts
│   │   │   │   ├── obsidian.ts         #   local vault folder watch
│   │   │   │   └── web.ts              #   wraps core/crawler.ts
│   │   │   ├── ai/openai.ts            # Streaming call + token cost calc
│   │   │   ├── notion/                 # reader.ts (read pages) · writer.ts (write sub-pages)
│   │   │   ├── crawler.ts              # crawlUrl() — Cheerio + Readability
│   │   │   └── db/
│   │   │       ├── index.ts            # Drizzle instance + pg pool
│   │   │       ├── schema.ts           # All table definitions
│   │   │       └── migrations/         # Drizzle output + meta/_journal.json
│   │   ├── middleware/logger.ts        # Morgan HTTP logger
│   │   ├── routes/                     # agents · knowledge · settings · runs · activity · health
│   │   ├── logger.ts                   # Structured JSON logger
│   │   └── index.ts                    # App entry — middleware, routes, starts the worker
│   ├── scripts/
│   │   ├── migrate.ts                  # Drizzle migrator + creates the vector extension
│   │   ├── seed.ts                     # Loads demo fixtures
│   │   └── seed-data.ts                # The fixtures themselves
│   └── Dockerfile
├── frontend/                           # See frontend.md
├── docs/                               # This folder
└── docker-compose.yml                  # postgres (pgvector) · migrate · backend · frontend
```

Entries under `core/agent/`, `core/knowledge/` and `core/integrations/` are the target layout; see
[build phases](#build-phases) for what exists today.

---

## Database

PostgreSQL 16 running the `pgvector/pgvector:pg16` image. Connection string comes from `DATABASE_URL`.

Migrations run through Drizzle's migrator, which records applied migrations in `__drizzle_migrations`.
Do not replace it with a glob over `*.sql` — the generated files are not idempotent and re-running
them fails.

```bash
cd backend
npx drizzle-kit generate     # generate a migration from schema.ts changes
npm run db:migrate           # apply pending migrations (also creates the vector extension)
npm run seed                 # load demo fixtures
```

### Core tables

| Table | Purpose |
|---|---|
| `agents` | One row per agent. Role, description, skills, model, system prompt, temperature |
| `knowledge_bases` | A base and its memory layer. `type` is `Raw corpus` / `Curated notes` / `Distilled memory` |
| `agent_knowledge_bases` | Which bases an agent may read during a run |
| `skills` | The skill library offered in the UI (`name`, `category`) |
| `model_providers` | Provider, its model list, encrypted API key, base URL |
| `integrations` | Notion / Obsidian / MS Office / Google Drive connection state |
| `runs` | One row per agent run. Also serves as the job queue |
| `run_comments` · `run_attachments` · `run_events` | Review comments, uploads, live progress |
| `activities` | The Overview feed, written by the runtime |
| `app_settings` | Key/value — run defaults (temperature, local fallback, custom endpoint) |

### Knowledge tables

These implement the four memory layers directly:

| Table | Layer | Purpose |
|---|---|---|
| `documents` | 1 — Raw context | One row per file, page or crawl. Original extracted text |
| `chunks` | 1 | Chunked document text plus a `vector(1536)` embedding |
| `notes` | 2 — Working notes | An agent-written summary per document, refreshed on sync |
| `facts` | 3 — Distilled facts | Deduped, conflict-checked statements. `supersededBy` retires stale ones |
| `core_memory` | 4 — Core memory | Always injected into every prompt: brand voice, ICP, non-negotiables |
| `distillation_runs` | — | Audit of each distillation pass: facts added, conflicts resolved |

A knowledge base's `type` **is** its memory layer. Raw corpus, curated notes and distilled memory are
the same axis as layers 1–3 of the Memory builder tab, not a parallel concept. There is one pipeline.

### Derived, never stored

`docs` and `chunks` counts, `integration.detail`, agent `runs` / `successRate` / `lastRun`, and the
memory-layer counts are all computed with aggregates at request time. They are not counter columns.
If a seed ever makes them look right while the underlying tables are empty, something is wrong.

---

## Agent runtime

One executor, driven entirely by rows in `agents`. No agent-specific code exists or should be added.

A run proceeds as:

1. Load the agent, the knowledge bases linked to it, and `core_memory`.
2. **Compose the system prompt** from the agent's `role`, `description` and `skills` (as a capability
   list), plus core memory and the linked bases' distilled facts. This is the only place a
   user-created agent gets its behaviour — it is data, not code.
3. **Retrieve**: embed the run input, pull top-k chunks from the linked bases, and record which bases
   were hit as the run's `sources[]`.
4. **Call the model**, requesting structured output that matches the Run shape (`summary`,
   `metrics[]`, `sections[]`) via JSON schema. Because the shape is fixed, the Results page renders
   any agent's output without special-casing.
5. **Persist** tokens, cost and duration; emit `run_events` as it goes; write an `activities` row when
   it finishes.

**Providers.** OpenAI, Ollama, vLLM, LM Studio and Gemini all speak the OpenAI protocol, so they share
one code path with a different `baseUrl`. Anthropic gets its own branch. Cost is computed per model
from a price table.

**Queue.** `POST /api/agents/:slug/run` inserts a `pending` run and returns `202` immediately. The
worker loop claims one row at a time:

```sql
SELECT ... FROM runs WHERE status = 'pending'
ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1
```

On boot, any run left in `running` (from a crash or restart) is reset to `pending`.

**Re-run with edits.** `POST /api/runs/:slug/rerun` copies the original input, appends the run's
comments as revision instructions, and enqueues a new run with `parentRunId` set. This is what the run
detail page means by "the agent reads these on the next run".

---

## Knowledge pipeline

**Ingest** — parse by mime type (`unpdf` for PDF, `mammoth` for DOCX, `xlsx` for spreadsheets, plain
read for MD/CSV/TXT), chunk to ~800 tokens with ~100 overlap on paragraph boundaries, embed with
`text-embedding-3-small` (1536 dims) in batches of 100, then write `documents` + `chunks`.

**Retrieve** — one interface, `retrieve(kbIds, query, k)`. Embeds the query and runs a single
`ORDER BY embedding <=> $1 LIMIT k` across the linked bases. HNSW indexes with `vector_cosine_ops`
back both `chunks.embedding` and `facts.embedding`.

**Distill** — the Memory builder, run as a queued job:

- *Notes pass* (1→2): summarize each new or changed document into `notes`.
- *Facts pass* (2→3): extract atomic statements, dedupe by cosine similarity against existing `facts`,
  and where two contradict, keep the newer and set `supersededBy` on the older.
- *Core promotion* (3→4): facts above a confidence threshold, or manually pinned, become `core_memory`.

**Sources.** Notion (via the existing `core/notion/reader.ts`), Obsidian (recursive read of a local
vault, `.md` only), web crawl (via the existing `core/crawler.ts`), and direct file upload. Microsoft
Office and Google Drive both need OAuth, which needs an identity, which needs auth — they are deferred
and their `connect` returns `501` rather than a fake success.

---

## Notion API constraints

Enforced in `core/notion/writer.ts` — keep them if that code is touched:

- Max **100 blocks** per append request — the writer auto-chunks.
- Max **2,000 characters** per block — enforced in `markdownToBlocks()`.
- Page and database IDs are normalized (hyphens stripped) before comparison.
- Notion is eventually consistent; reads immediately after a write may need a retry.

---

## Build phases

Detailed plan, including per-file changes and verification steps, is in the approved plan file.

| Phase | Scope | State |
|---|---|---|
| 0 | Unbreak the repo — compile, CORS, seed, Docker, pgvector | ✅ Done |
| 1 | Schema — 11 new tables, 6 extended | Next |
| 2 | CRUD endpoints behind every stubbed button | |
| 3 | Knowledge pipeline and the four memory layers | |
| 4 | Integrations — Notion, Obsidian, web crawl | |
| 5 | Generic agent runtime, queue, re-run | |
| 6 | Frontend wire-up — stubs become real mutations, no redesign | |
| 7 | Docs refresh | |

### Key decisions

| Decision | Choice | Why |
|---|---|---|
| Tenancy | Single-tenant now | Auth comes later; `workspace_id` gets migrated in then |
| Retrieval | pgvector in the existing Postgres | One database, one client, chunks join their KB directly |
| Queue | In-process worker, Postgres holds state | No Redis; `SKIP LOCKED` keeps it correct under concurrency |
| Agents | Data, not code | The whole point — anyone can create one from the UI |
| Auth | None for now | Explicit choice; see the security note in [README](./README.md#open-issues) |
| Frontend | Wire up, never redesign | The UI is finished and is the contract the backend serves |
