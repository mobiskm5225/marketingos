# API Reference

Base URL: `http://localhost:8000`

All bodies are JSON. Responses are `application/json`.

**No authentication.** Every endpoint is open. This is deliberate for now, and the reason the backend
port is bound to `127.0.0.1` in `docker-compose.yml`. See
[README → Open issues](./README.md#open-issues).

**CORS.** Allowed origins come from `CORS_ORIGINS` (comma-separated), defaulting to
`http://localhost:3000,http://localhost:5173`. Requests from other origins get no
`Access-Control-Allow-Origin` header.

Endpoints marked **planned** do not exist yet; the phase column says which build phase adds them.
Everything else is live today.

---

## Health

### `GET /health`

```json
{ "status": "ok" }
```

---

## Agents

### `GET /api/agents` — live

Returns every agent with its knowledge bases and run statistics rolled up.

```json
[
  {
    "id": "atlas",
    "name": "Atlas",
    "role": "Campaign Strategist",
    "description": "Turns a rough brief into a positioning angle, channel mix and a week-by-week campaign calendar.",
    "status": "active",
    "icon": "Megaphone",
    "model": "claude-sonnet-4.5",
    "skills": ["Positioning", "Channel planning", "Budget split", "ICP research"],
    "knowledgeBases": ["Brand Bible", "Q3 Campaign Archive"],
    "runs": 1,
    "successRate": 0,
    "lastRun": "2026-08-15 14:10:59.525282+00"
  }
]
```

`id` is the slug, not the UUID — the frontend routes on slugs. `runs`, `successRate` and `lastRun` are
aggregates over the `runs` table, not stored columns. `successRate` counts only runs with status
`complete`, so an agent whose single run is `needs review` reports 0.

> `lastRun` currently returns a raw Postgres timestamp rather than ISO, because it comes from a
> `MAX()` aggregate. Tracked as issue 5 in the README.

### Planned

| Method | Path | Phase | Purpose |
|---|---|---|---|
| `GET` | `/api/agents/:slug` | 2 | Single agent |
| `POST` | `/api/agents` | 2 | Create — `{ name, role, description, model }` |
| `PATCH` | `/api/agents/:slug` | 2 | Update name, role, description, status, model, skills, prompt, temperature. Covers Pause/Activate and skill add/remove |
| `DELETE` | `/api/agents/:slug` | 2 | Delete |
| `PUT` | `/api/agents/:slug/knowledge-bases` | 2 | Replace links — `{ kbSlugs: [] }` |
| `GET` | `/api/skills` | 2 | The skill library (currently hardcoded in the frontend) |
| `POST` | `/api/agents/:slug/run` | 5 | Enqueue a run. Returns `202 { runSlug }` |

---

## Knowledge

### `GET /api/knowledge-bases` — live

```json
[
  {
    "id": "brand-bible",
    "name": "Brand Bible",
    "type": "Curated notes",
    "source": "Notion",
    "docs": 0,
    "chunks": 0,
    "updated": "2026-08-15T13:58:59.500Z",
    "usedBy": ["Atlas", "Quill", "Echo"],
    "icon": "BookOpen"
  }
]
```

`type` is the memory layer: `Raw corpus`, `Curated notes` or `Distilled memory`. `docs` and `chunks`
are counted from the `documents` and `chunks` tables — zero until ingestion runs in Phase 3.

### `GET /api/integrations` — live

```json
[
  {
    "id": "notion",
    "name": "Notion",
    "blurb": "Sync pages and databases from shared workspaces.",
    "status": "connected",
    "detail": "42 pages · synced 12m ago"
  }
]
```

### Planned

| Method | Path | Phase | Purpose |
|---|---|---|---|
| `POST` | `/api/knowledge-bases` | 2 | Create — `{ name, type, source }` |
| `PATCH` `DELETE` | `/api/knowledge-bases/:slug` | 2 | Update / delete |
| `GET` | `/api/knowledge-bases/:slug/documents` | 2 | List documents in a base |
| `POST` | `/api/knowledge-bases/:slug/documents` | 3 | Upload (multipart) → parse, chunk, embed |
| `DELETE` | `/api/documents/:id` | 3 | Remove a document and its chunks |
| `GET` | `/api/memory/layers` | 3 | The four layers with real counts + last distillation summary |
| `POST` | `/api/memory/distill` | 3 | Queue a distillation pass |
| `GET` `PUT` | `/api/memory/core` | 3 | Read / edit always-in-prompt core memory |
| `POST` | `/api/knowledge-bases/sync` | 4 | Sync every base |
| `POST` | `/api/knowledge-bases/:slug/sync` | 4 | Sync one base |
| `POST` | `/api/integrations/:slug/connect` | 4 | Store connection config |
| `POST` | `/api/integrations/:slug/sync` | 4 | Pull from the source |
| `DELETE` | `/api/integrations/:slug/connect` | 4 | Disconnect |

`msoffice` and `gdrive` return `501` from `connect` — both need OAuth, which needs auth.

---

## Models & settings

### `GET /api/models` — live

```json
[
  {
    "id": "anthropic",
    "name": "Anthropic Claude",
    "kind": "Hosted API",
    "models": ["claude-sonnet-4.5", "claude-opus-4.1", "claude-haiku-4"],
    "status": "connected",
    "note": "Default for strategy work"
  }
]
```

`kind` is `Hosted API` or `Open source`, which is what the Models page uses to pick its icon.

### Planned

| Method | Path | Phase | Purpose |
|---|---|---|---|
| `PATCH` | `/api/models/:slug` | 2 | Set API key (AES-256-GCM at rest, keyed by `ENCRYPTION_KEY`), base URL, default model. `status` flips to `connected` once a key exists |
| `POST` | `/api/models/test` | 2 | Probe an OpenAI-compatible `GET {baseUrl}/v1/models` |
| `GET` `PUT` | `/api/settings/run-defaults` | 2 | Temperature, local fallback, custom endpoint |

API keys are never returned by any endpoint, only whether one is set.

---

## Runs

### `GET /api/runs` — live · `GET /api/runs/:slug` — live

Both return the same shape; the list is ordered newest first.

```json
{
  "id": "run-2041",
  "title": "Q4 launch campaign plan — Northstar 2.0",
  "agent": "Atlas",
  "status": "needs review",
  "started": "2026-08-15T14:10:59.525Z",
  "duration": "3m 41s",
  "model": "claude-sonnet-4.5",
  "summary": "A four-week launch plan anchored on the 'setup in an afternoon' angle…",
  "metrics":  [{ "label": "Reach forecast", "value": "180k", "hint": "across 4 channels" }],
  "sections": [{ "heading": "Positioning angle", "body": "…", "bullets": ["…"] }],
  "sources":  [{ "name": "Brand Bible / Voice & tone", "kind": "Notion" }],
  "attachments": [{ "name": "launch-timeline.png", "kind": "image", "size": "412 KB" }],
  "comments": [
    {
      "id": "c1",
      "author": "Moballighul",
      "initials": "MI",
      "time": "2026-08-15T13:46:59.525Z",
      "body": "Push paid to week two…",
      "anchor": "Channel mix"
    }
  ]
}
```

`status` is `complete`, `running` or `needs review`. `sections` is what the agent produced — the
Results page renders it generically, so any agent's output fits without special-casing. A comment's
optional `anchor` ties it to a section heading.

`GET /api/runs/:slug` returns `404 { "error": "Run not found" }` for an unknown slug.

### Planned

| Method | Path | Phase | Purpose |
|---|---|---|---|
| `POST` | `/api/runs/:slug/comments` | 2 | Add a review comment |
| `POST` | `/api/runs/:slug/attachments` | 2 | Upload (multipart) |
| `DELETE` | `/api/runs/:slug` | 2 | Delete a run |
| `GET` | `/api/runs/:slug/events` | 5 | Live progress; the UI polls this every 3s while `running` |
| `POST` | `/api/runs/:slug/rerun` | 5 | Re-run with comments folded in as revision instructions |

---

## Activity

### `GET /api/activity` — live

Newest first. Drives the Overview feed.

```json
[{ "id": "a1", "text": "Atlas finished Q4 launch campaign plan", "time": "2026-08-15T12:10:59.530Z" }]
```

Currently seeded. From Phase 5 the runtime writes these rows itself.

---

## Conventions

**Timestamps** are ISO 8601 UTC. The frontend formats them for display with `date-fns` — the API never
returns "2h ago".

**Identifiers**: URLs and payloads use slugs (`atlas`, `run-2041`, `brand-bible`). UUIDs stay internal.

**Errors** currently return `500 { "error": "<raw message>" }`, which leaks internals. Phase 2 replaces
the per-route `try/catch` duplication with one error middleware that logs the detail and returns a
generic message.
