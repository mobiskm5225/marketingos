# Build tracker

What exists, what does not, and what is deliberately deferred. Verified against the source and the
running stack — nothing here is aspirational.

Last verified: 2026-08-16 · commit `3e31e27` · branch `release/0.5.0`

---

## Summary

| | Count |
|---|---|
| Database tables | 24 |
| API endpoints | 46 |
| Backend routers | 9 |
| Core modules | 23 |
| Frontend pages | 7 |
| Migrations | 2 |

| Phase | Scope | State |
|---|---|---|
| 0 | Repo unbroken, Docker cold start | **done** |
| 1 | Database schema | **done** |
| 2 | Skills library + import | **done** |
| 3 | Agent builder, pipeline map, model routing, categories | **done** |
| 4 | Knowledge pipeline + integrations | **done** |
| 5 | **Pipeline runtime** | **not built — the remaining gap** |
| 6 | Run streaming, frontend polish | not built |
| 7 | Docs refresh | partial |

---

## Built

### Database — 24 tables

| Group | Tables |
|---|---|
| Agents | `agents`, `agent_stages`, `agent_references`, `agent_inputs`, `agent_knowledge_bases` |
| Skills | `skills`, `categories` |
| Knowledge | `knowledge_bases`, `documents`, `chunks`, `notes`, `facts`, `core_memory`, `distillation_runs` |
| Runs | `runs`, `run_stages`, `run_events`, `run_comments`, `run_attachments`, `run_artifacts` |
| Platform | `model_providers`, `integrations`, `app_settings`, `activities` |

pgvector enabled. `chunks.embedding` and `facts.embedding` are `vector(1536)`, nullable so the
system works before an embedding key exists.

Migrations: `0000_init`, `0001_add_categories` (additive, no data loss).

### API — 46 endpoints

**Agents (9)**
```
GET    /agents                        list with derived stats
GET    /agents/:slug                  detail incl. computed levels + cycle
POST   /agents                        create
PATCH  /agents/:slug                  update incl. category, model, guardrails
DELETE /agents/:slug                  cascades stages, keeps skills
PUT    /agents/:slug/stages           replace pipeline, validates DAG
PUT    /agents/:slug/references       replace references
PUT    /agents/:slug/inputs           replace typed inputs
PUT    /agents/:slug/knowledge-bases  replace KB links
```

**Skills (8)**
```
GET    /skills                 GET /skills/:slug
POST   /skills                 PATCH /skills/:slug         DELETE /skills/:slug
POST   /skills/import/folder   zip upload
POST   /skills/import/github   public repo
POST   /skills/import/commit   confirm a preview
```

**Knowledge (11)**
```
GET    /knowledge-bases                     POST /knowledge-bases
PATCH  /knowledge-bases/:slug               DELETE /knowledge-bases/:slug
GET    /knowledge-bases/:slug/documents     POST /knowledge-bases/:slug/documents
DELETE /documents/:id
GET    /memory/layers      4-layer counts
GET    /memory/core        PUT /memory/core
POST   /memory/distill     notes -> facts
```

**Integrations (5)**
```
GET    /integrations/fields          field spec per connector
POST   /integrations/:slug/connect   validate + store encrypted
DELETE /integrations/:slug/connect
POST   /integrations/:slug/sync
POST   /knowledge-bases/sync         sync all connected
```

**Models & settings (6)**
```
GET    /models                   PATCH /models/:slug
POST   /models/test              probe, auto-saves discovered models
GET    /settings/run-defaults    PUT /settings/run-defaults
GET    /integrations
```

**Runs (6)**
```
GET    /runs                        GET /runs/:slug        DELETE /runs/:slug
POST   /runs/:slug/comments         DELETE /runs/:slug/comments/:id
POST   /runs/:slug/attachments
```

**Misc (1 each):** `GET /health`, `GET /activity`, `GET /categories`

### Skills library

- Markdown + frontmatter parsing, slug identity
- Three import paths: local folder (zip), GitHub public repo, and preview-then-commit
- Import infers a pipeline from prose and generates missing `AGENT.md`
- Skills shared across agents; per-stage `body_override` for agent-specific variants
- Category inherited from the agent on import

### Agent builder

- Pipeline map (`@xyflow/react`) — one column per execution level, parallel stages side by side
- Execution levels computed from `depends_on` at read time, never stored, so map and runtime cannot drift
- Cycle detection rejects loops on write (`400`) and flags a stored loop on read
- **Per-stage model routing** — blank stage inherits the agent default. Verified: research stages on
  local Llama, `write-copy` and `editorial-qa` on `claude-opus-5`, one agent
- Gates, dependency editing, stage add/remove
- Categories: shared vocabulary, matching skills sorted first under "Suggested"

### Knowledge pipeline

- Parsers: PDF (`unpdf`), DOCX (`mammoth`), XLSX/XLS/CSV (`xlsx`), MD/TXT/JSON/HTML
- Chunking on paragraph boundaries, ~3200 chars with 400-char overlap, oversized paragraphs hard-split
- Embeddings via `text-embedding-3-small`, batched, **optional**
- Retrieval: pgvector cosine similarity, **falls back to Postgres full-text** when no key or no vectors
- Four memory layers: raw documents, working notes, distilled facts, core memory
- Failed documents stored with `status='error'` and the reason, never silently dropped

### Integrations

| Source | State | Auth |
|---|---|---|
| Obsidian | working, tested with a real vault | none — read-only volume mount at `/vaults` |
| Notion | built, needs your credentials | integration token + database share |
| Google Drive | built, needs your credentials | service account JSON, no OAuth flow |
| Microsoft Office | **not built** | needs delegated OAuth |

- Re-sync replaces by `sourceRef` rather than duplicating (verified: `added=0 replaced=2`)
- Credentials encrypted at rest, never returned to the browser
- Connect dialog renders fields the connector declares — a new source needs no frontend change

### Models

- Providers: OpenAI, Anthropic, Gemini, Ollama, vLLM. All OpenAI-protocol except Anthropic
- API keys encrypted at rest (AES-256-GCM), never returned
- Endpoint probe saves discovered models and sets a default
- Loopback URLs auto-translated to `host.docker.internal` inside the container
- **Ollama verified end to end**: `qwen3:8b`, 34 in / 209 out tokens, $0.00
- Truncation guard — a reasoning model that spends its budget thinking now errors instead of
  silently returning empty text

### Frontend — 7 pages

| Page | State |
|---|---|
| Overview | real counts and activity feed |
| Agents | create, edit, delete, pipeline map, stage model, categories, KB linking |
| Skills | CRUD, markdown editor, category filter, 3 import paths |
| Knowledge | bases, upload/index, documents, memory layers, distill, connect, sync |
| Models | keys, endpoints, probe, run defaults |
| Runs | list + filters |
| Run detail | report, comments, attachments |

Every control calls the API. No `toast.success` fires without a real request behind it.

### Security

- SSRF guard on all crawl targets — private, loopback, link-local and metadata ranges blocked,
  revalidated on every redirect hop
- Path traversal blocked on vault paths (`../../etc` rejected)
- Attachments stored under generated UUIDs, never the client's filename
- Secrets encrypted at rest
- Helmet, CORS allowlist, 25 MB upload cap

---

## Not built

### Phase 5 — pipeline runtime · the one real gap

`core/agent/` contains only `dag.ts`. Nothing can execute an agent.

Needed in `core/agent/runner.ts`:
- resolve levels via `dag.ts`, execute each level concurrently
- resolve each stage's model — stage override, else agent default
- ground each stage via `knowledge/retrieve.ts` + `activeFacts()`
- record `run_stages` rows with tokens, cost, duration
- honour gates — a failing gate sends work back, not forward
- write `run_events` for the timeline

**Blocked by this today:**
- No **Run** button anywhere — agents cannot be executed
- **Re-run with edits** disabled on the run report
- `runs` rows only exist if inserted manually
- `run_stages`, `run_events`, `run_artifacts` tables unused

### Phase 6 — streaming and polish

- Live run progress (SSE or polling)
- Agent inputs UI — `PUT /agents/:slug/inputs` exists, the editor is read-only
- References editor — read-only
- Knowledge base edit/delete from the UI

### Deferred deliberately

| Item | Why |
|---|---|
| **Auth** | None at all. Anyone reaching port 8000 has full control. Single-user local tool for now |
| **Microsoft Office** | Needs delegated OAuth, which needs an identity. Returns `501` with the reason |
| **Embeddings** | `OPENAI_API_KEY` unset, so retrieval uses full-text fallback. Add the key and backfill — no re-import needed |
| **Scheduler** | No cron or queue. Runs would be synchronous |
| **Multi-tenancy** | No org or user scoping anywhere |

### Known issues

- `ngrok.exe` and `.ngrok.exe.old` — 65 MB of Windows binaries committed to git
- No test suite
- Distillation is single-pass; no conflict resolution between contradictory facts
- `notes` table exists but nothing writes to it — working notes are not generated yet

---

## Verify it yourself

```bash
docker compose up -d --build          # postgres, init, backend, frontend

curl localhost:8000/health            # {"status":"ok"}
curl localhost:8000/api/agents        # your agents
open http://localhost:3000
```

`init` exits 0 by design — it migrates and seeds, then stops. `backend` starts only after it
succeeds, so `Exited (0)` on `init` is correct, not a failure.
