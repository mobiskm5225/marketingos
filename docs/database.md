# Database

PostgreSQL 16 via Docker. Managed with Drizzle ORM.

---

## Connection

```
postgresql://acefone:acefone@localhost:5432/acefone
```

Set via `DATABASE_URL` in `.env`. The Docker Compose defaults above work out of the box for local development.

---

## Tables

### `agent_jobs`

Primary job tracking table. One row per agent run.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `agent_name` | VARCHAR(50) | No | — | `seo-analyzer` or `blog-reviewer` |
| `notion_page_id` | VARCHAR(50) | Yes | NULL | Notion page ID (webhook-triggered runs only) |
| `title` | TEXT | Yes | NULL | Blog title |
| `status` | VARCHAR(20) | No | — | `pending` / `processing` / `done` / `error` |
| `input_tokens` | INTEGER | Yes | NULL | Tokens sent to GPT-4o |
| `output_tokens` | INTEGER | Yes | NULL | Tokens returned from GPT-4o |
| `cost_usd` | DECIMAL(10,6) | Yes | NULL | Calculated USD cost |
| `error_message` | TEXT | Yes | NULL | Populated when status = `error` |
| `source` | VARCHAR(30) | Yes | NULL | `webhook` / `ingest` / `api` |
| `created_at` | TIMESTAMPTZ | No | `now()` | Job creation time |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Last status change |

**Drizzle schema:**
```typescript
export const agentJobs = pgTable('agent_jobs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  agentName:    varchar('agent_name', { length: 50 }).notNull(),
  notionPageId: varchar('notion_page_id', { length: 50 }),
  title:        text('title'),
  status:       varchar('status', { length: 20 }).notNull(),
  inputTokens:  integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costUsd:      decimal('cost_usd', { precision: 10, scale: 6 }),
  errorMessage: text('error_message'),
  source:       varchar('source', { length: 30 }),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
});
```

---

### `agent_results`

Stores the full text output for each job. Separate table to keep `agent_jobs` lean for list queries.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `job_id` | UUID | No | — | Foreign key → `agent_jobs.id` |
| `result_type` | VARCHAR(50) | Yes | NULL | `seo_analysis` or `blog_review` |
| `content` | TEXT | Yes | NULL | Full markdown output |
| `created_at` | TIMESTAMPTZ | No | `now()` | When result was written |

`content` may be NULL if the agent wrote results exclusively to Notion and did not store a local copy.

**Drizzle schema:**
```typescript
export const agentResults = pgTable('agent_results', {
  id:         uuid('id').primaryKey().defaultRandom(),
  jobId:      uuid('job_id').references(() => agentJobs.id),
  resultType: varchar('result_type', { length: 50 }),
  content:    text('content'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});
```

---

### `kb_cache`

Key-value cache for Notion knowledge base content. Prevents repeated fetches of the same KB pages within a TTL window. Not yet actively used — reserved for Phase 4 (KB write-back).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `kb_key` | VARCHAR(100) | No | — | Primary key — e.g. `KB-05` or `seo-keywords` |
| `content` | TEXT | Yes | NULL | Cached knowledge base text |
| `cached_at` | TIMESTAMPTZ | No | `now()` | When cache was written |
| `ttl_seconds` | INTEGER | Yes | 3600 | Time-to-live in seconds |

**Drizzle schema:**
```typescript
export const kbCache = pgTable('kb_cache', {
  kbKey:      varchar('kb_key', { length: 100 }).primaryKey(),
  content:    text('content'),
  cachedAt:   timestamp('cached_at').defaultNow().notNull(),
  ttlSeconds: integer('ttl_seconds').default(3600),
});
```

---

## Relationships

```
agent_jobs (1) ──── (many) agent_results
  id                        job_id FK
```

`kb_cache` is standalone (no FK relationships).

---

## Indexes to Add for Production

The current schema has no explicit indexes beyond primary keys. Add these before running at any meaningful volume:

```sql
-- Most common query pattern: filter by agent + status, sort by created_at
CREATE INDEX idx_jobs_agent_status ON agent_jobs (agent_name, status);
CREATE INDEX idx_jobs_created_at ON agent_jobs (created_at DESC);

-- Joining results to job
CREATE INDEX idx_results_job_id ON agent_results (job_id);

-- Stats query (this month cost)
CREATE INDEX idx_jobs_created_month ON agent_jobs (agent_name, created_at);
```

---

## Running Migrations

Migrations are managed by Drizzle Kit.

```bash
cd backend

# Generate migration from schema changes
npx drizzle-kit generate

# Apply pending migrations
npm run db:migrate
# (runs: tsx scripts/migrate.ts)
```

The `scripts/migrate.ts` runner applies all pending SQL files from `src/core/db/migrations/`.

---

## Useful Queries

**All jobs today:**
```sql
SELECT id, agent_name, title, status, cost_usd, created_at
FROM agent_jobs
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

**Error jobs with messages:**
```sql
SELECT id, agent_name, title, error_message, created_at
FROM agent_jobs
WHERE status = 'error'
ORDER BY created_at DESC;
```

**Cost by agent this month:**
```sql
SELECT agent_name,
       COUNT(*) as jobs,
       SUM(cost_usd)::numeric(10,4) as total_cost
FROM agent_jobs
WHERE created_at >= date_trunc('month', now())
  AND status = 'done'
GROUP BY agent_name;
```

**Full job with output:**
```sql
SELECT j.id, j.title, j.status, j.cost_usd, r.content
FROM agent_jobs j
LEFT JOIN agent_results r ON r.job_id = j.id
WHERE j.id = 'your-job-uuid';
```

**Running jobs (stuck check):**
```sql
SELECT id, agent_name, title, created_at,
       EXTRACT(EPOCH FROM (now() - created_at))/60 as minutes_running
FROM agent_jobs
WHERE status = 'processing'
ORDER BY created_at;
```
