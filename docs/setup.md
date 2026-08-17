# Setup & Running

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 22+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker Desktop | any | `docker --version` |
| Git | any | `git --version` |

An **OpenAI API key** is needed for embeddings and model calls once Phase 3 lands. The app boots and
serves seeded data without one.

---

## 1. Clone

```bash
git clone https://github.com/Moballigh5225/marketing-os.git
cd marketing-os
git checkout release/0.5.0
```

`main` is not used. Branch features from `release/0.5.0`.

---

## 2. Environment

```bash
cp .env.example backend/.env
```

Only two variables matter to boot:

```env
PORT=8000
DATABASE_URL=postgresql://acefone:acefone@localhost:5433/acefone
```

> **Port 5433, not 5432.** The Postgres container publishes on 5433 because a local Homebrew or
> Postgres.app install commonly holds 5432 and silently wins for `localhost` connections — which
> means migrations appear to succeed against the wrong database. Inside Docker, services still reach
> it as `postgres:5432`.

Optional, per phase:

```env
OPENAI_API_KEY=sk-...        # embeddings + model calls (Phase 3+)
ENCRYPTION_KEY=              # 32-byte hex; encrypts stored provider API keys (Phase 2+)
NOTION_API_KEY=secret_...    # Notion knowledge source (Phase 4)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Generate the encryption key with `openssl rand -hex 32`.

`backend/.env` is gitignored. Keep it that way — it holds provider credentials.

---

## Option A — Local dev (hot reload)

```bash
# 1. Install
cd backend  && npm install
cd ../frontend && npm install

# 2. Start Postgres (pgvector image)
cd .. && docker compose up -d postgres

# 3. Migrate and seed
cd backend
npm run db:migrate     # applies migrations + creates the vector extension
npm run seed           # loads demo agents, bases, models, runs

# 4. Backend
npm run dev            # → Server running on port 8000

# 5. Frontend (new terminal)
cd frontend && npm run dev
```

| URL | Service |
|---|---|
| `http://localhost:8081` | Frontend |
| `http://localhost:8000` | Backend API |
| `localhost:5433` | PostgreSQL |

Verify:

```bash
curl http://localhost:8000/health           # {"status":"ok"}
curl http://localhost:8000/api/agents       # 5 seeded agents
docker compose exec postgres \
  psql -U acefone -d acefone -tc "SELECT extname FROM pg_extension WHERE extname='vector';"
```

There is no login — the app has no auth yet.

---

## Option B — Docker (full stack)

```bash
docker compose up --build
```

Brings up Postgres, runs migrations as a one-shot service, then starts the backend and the
SSR frontend. Migrations are tracked in `__drizzle_migrations`, so repeat boots are safe.

| URL | Service |
|---|---|
| `http://localhost:3000` | Frontend |
| `http://localhost:8000` | Backend API |

Seed the demo data once:

```bash
docker compose exec backend node dist/scripts/seed.js
```

**Stop:**

```bash
docker compose down       # keep data
docker compose down -v    # wipe data too
```

> The backend publishes on `127.0.0.1:8000`, not `0.0.0.0`. The API has no auth and will hold provider
> API keys — do not widen that binding or put it behind a public proxy until auth exists.

---

## Resetting the database

```bash
docker compose down -v
docker compose up -d postgres
cd backend && npm run db:migrate && npm run seed
```

---

## Schema changes

```bash
cd backend
# edit src/core/db/schema.ts
npx drizzle-kit generate     # writes a new migration + updates meta/_journal.json
npm run db:migrate           # apply it
```

Commit the generated `.sql` **and** the `meta/` files together. The migrator reads the journal to know
what to apply; without it the migration is invisible.

---

## Troubleshooting

### `extension "vector" is not available`

Migrations reached the wrong Postgres. A local install is holding the port and shadowing the
container.

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN     # anything here that is not Docker is the culprit
```

Confirm `DATABASE_URL` in `backend/.env` says **5433**, then re-run `npm run db:migrate`.

### API returns stale or unexpected data

Check for an old backend process still holding port 8000 — several can accumulate across sessions, and
the oldest keeps the port while newer ones fail to bind.

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
pkill -f "tsx/cjs src/index.ts"
```

### `ECONNREFUSED` connecting to Postgres

```bash
docker compose ps                    # is the container running?
docker compose logs postgres
```

Confirm the port in `DATABASE_URL` matches the published port in `docker-compose.yml`.

### Migration fails on re-run with "already exists"

The migrator tracks state in `__drizzle_migrations`. If that table was dropped while the tables
remained, it will try to re-apply from scratch. Easiest fix is a clean reset (above).

### Frontend builds a `wrangler.json` instead of a server

Nitro auto-detected a Cloudflare preset. Set `NITRO_PRESET=node-server` before `npm run build` — the
Dockerfile already does.

### Frontend loads but every page is empty

The API is unreachable or the origin is blocked. Check the backend is up, then confirm the request
origin is in `CORS_ORIGINS`:

```bash
curl -s -D- -o /dev/null -H "Origin: http://localhost:8081" localhost:8000/api/agents \
  | grep -i access-control-allow-origin
```

Vite's dev port varies (8080, 8081, …), so add whichever it picked.

### `429 Too Many Requests`

`express-rate-limit` is applied. Restart the backend to reset the in-memory counter during local
testing.
