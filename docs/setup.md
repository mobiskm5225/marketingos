# Setup & Running

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker Desktop | any | `docker --version` |
| Git | any | `git --version` |

You also need:
- **OpenAI API key** with access to `gpt-4o`
- **Notion Integration Token** (Internal Integration, not public)
- **Notion Database IDs** for the databases the agents will watch

---

## 1. Clone & Checkout

```bash
git clone https://github.com/Moballigh5225/marketing-os.git acefone-intelligence
cd acefone-intelligence
git checkout release/0.5.0
```

> **Important:** `main` is intentionally empty. All code lives on `release/0.5.0`.
> For new features, branch off `release/0.5.0`:
> ```bash
> git checkout release/0.5.0
> git checkout -b feature/your-feature
> ```

---

## 2. Environment Variables

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in:

```env
# Server
PORT=8000

# Auth — required
JWT_SECRET=change-this-to-a-long-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# Database (works as-is with Docker Compose defaults)
DATABASE_URL=postgresql://acefone:acefone@localhost:5432/acefone

# OpenAI
OPENAI_API_KEY=sk-...

# Notion — Required
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=<32-char-hex-id>         # SEO Reviews DB

# Notion — Optional
NOTION_WEBHOOK_SECRET=                       # Leave empty to skip HMAC check
INGEST_SECRET=                               # Leave empty to skip /ingest auth
BLOG_TRACKER_DATABASE_ID=                    # Blog Tracker DB
BLOG_REVIEW_DB_ID=                           # Blog Reviews Queue DB
```

### Finding Notion Database IDs

1. Open the Notion database in browser
2. URL: `https://notion.so/workspace/abcdef1234567890abcdef1234567890?v=...`
3. 32-character hex string = database ID
4. Paste into `.env` (with or without hyphens — backend normalizes both)

### Connecting the Notion Integration

For each database the agents read/write:
1. Open database in Notion → `···` (top right) → **Connections** → **Add connections**
2. Search for your integration → Connect

Without this, the API returns `object_not_found`.

---

## Option A — Docker (recommended for collaboration)

Run the full stack (Postgres + backend + frontend) in one command:

```bash
docker compose up --build
```

| URL | Service |
|---|---|
| `http://localhost:3000` | React frontend |
| `http://localhost:8000` | Express backend |
| `localhost:5432` | PostgreSQL |

**First run only — run migrations:**
```bash
docker compose exec backend npm run db:migrate
```

**Stop:**
```bash
docker compose down          # keep data
docker compose down -v       # wipe data too
```

> In Docker, nginx handles `/api` and `/auth` proxying — Vite is not used. No extra config needed.

---

## Option B — Local Dev (hot reload)

### 3. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Start PostgreSQL

```bash
# From repo root
docker compose up -d postgres
```

### 5. Run Migrations

```bash
cd backend && npm run db:migrate
```

### 6. Start Backend

```bash
cd backend && npm run dev
```

Expected: `Server running on port 8000`

Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

### 7. Start Frontend

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000` — login page appears.

Sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env`.

---

## 8. Test an Agent Run

### Web UI

1. Login at `http://localhost:3000`
2. Go to **Trigger Agent**
3. Select **SEO Analyzer**, enter title + content (300+ words)
4. Click **Run SEO Analysis** → redirected to job detail, auto-refreshes until done

### cURL

All `/api/*` routes require a JWT. Get a token first:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)
```

Trigger agent:
```bash
curl -X POST http://localhost:8000/api/agents/seo-analyzer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Cloud Telephony Guide","content":"..."}'
```

Check job:
```bash
curl http://localhost:8000/api/jobs/<jobId> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 9. Set Up Notion Webhook (optional)

For Notion pages to trigger agents automatically:

```bash
# Install ngrok (Windows)
winget install ngrok

# Start tunnel
ngrok http 8000
```

Copy the HTTPS URL: `https://xxxx.ngrok-free.app`

In Notion → your integration → **Webhooks**:
- URL: `https://xxxx.ngrok-free.app/webhook`
- Events: `page.created`, `page.updated`, `page.properties_updated`
- Copy signing secret → `NOTION_WEBHOOK_SECRET` in `.env` → restart backend

---

## Stopping Everything

```bash
# Local dev: Ctrl+C in each terminal, then:
docker compose stop       # stop postgres (keeps data)
docker compose down -v    # stop + wipe data

# Docker full stack:
docker compose down       # keep data
docker compose down -v    # wipe data
```

---

## Resetting the Database

```bash
docker compose down -v
docker compose up -d postgres       # or: docker compose up -d
cd backend && npm run db:migrate
```

---

## Troubleshooting

### `username and password are required` on login

Backend not restarted after adding `ADMIN_USERNAME`/`ADMIN_PASSWORD` to `.env`. Restart backend.

### `401 Unauthorized` on `/api/*`

Token missing or expired. Log out and log back in — fresh 7-day token issued on login.

### `404` on `/auth/login` (local dev only)

Vite proxy must include `/auth`. Check `frontend/vite.config.ts`:
```ts
proxy: {
  '/api':  'http://localhost:8000',
  '/auth': 'http://localhost:8000',
}
```
Restart Vite after any proxy change.

### `ECONNREFUSED` connecting to PostgreSQL

- `docker ps` — confirm postgres container running
- Port 5432 not in use by another instance
- `DATABASE_URL` in `.env` matches `docker-compose.yml` values

### `object_not_found` from Notion API

Integration not connected to the database. Database → `···` → **Connections** → add integration.

### `401 Unauthorized` on webhook

`NOTION_WEBHOOK_SECRET` mismatch. Leave it empty to disable HMAC check for local dev.

### Agent stuck in `processing`

Manually reset in PostgreSQL:
```sql
UPDATE agent_jobs
SET status = 'error', error_message = 'Manually reset'
WHERE status = 'processing'
  AND updated_at < now() - interval '10 minutes';
```

### OpenAI `429 Too Many Requests`

GPT-4o rate limit hit. Wait and retry, or upgrade OpenAI usage tier.

---

## Git Workflow

```
main              — empty, do not use
release/0.5.0     — stable, all development branches from here
feature/*         — new features
fix/*             — bug fixes
```

Always branch from `release/0.5.0`, never from `main`.
