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

## 1. Clone / Navigate

```bash
cd C:\Users\Testuser2\Desktop\acefone-intelligence
```

---

## 2. Environment Variables

Copy the example and fill in your keys:

```bash
# In the backend folder
copy backend\.env.example backend\.env
```

Open `backend\.env` and fill in:

```env
# Server
PORT=8000

# Database (works as-is with Docker Compose defaults)
DATABASE_URL=postgresql://acefone:acefone@localhost:5432/acefone

# OpenAI
OPENAI_API_KEY=sk-...

# Notion — Required
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=<32-char-hex-id>         # SEO Reviews DB

# Notion — Optional (enable specific flows)
NOTION_WEBHOOK_SECRET=                       # Leave empty to skip HMAC check
INGEST_SECRET=                               # Leave empty to skip /ingest auth
BLOG_TRACKER_DATABASE_ID=                    # Blog Tracker DB (URL-trigger flow)
BLOG_REVIEW_DB_ID=                           # Blog Reviews Queue DB (Existing Blog Reviewer)
```

### Finding Notion Database IDs

1. Open the Notion database in browser
2. Copy the URL: `https://notion.so/workspace/abcdef1234567890abcdef1234567890?v=...`
3. The 32-character hex string is the database ID
4. Paste it into `.env` (with or without hyphens — the backend normalizes both)

### Connecting the Notion Integration

For each database the agents will read/write:
1. Open the database in Notion
2. Click `···` (top right) → **Connections** → **Add connections**
3. Search for your integration name → Connect

Without this step, the API will return `object_not_found` errors.

---

## 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (open a new terminal or go back to root)
cd ../frontend
npm install
```

---

## 4. Start PostgreSQL

```bash
# From root of acefone-intelligence/
docker-compose up -d
```

Verify it's running:
```bash
docker ps
# Should show: postgres:16-alpine, port 5432
```

The database `acefone` is created automatically. Default credentials: `acefone / acefone`.

---

## 5. Run Database Migrations

```bash
cd backend
npm run db:migrate
```

This creates the three tables: `agent_jobs`, `agent_results`, `kb_cache`.

If the command fails, check that Docker is running and `DATABASE_URL` matches your `docker-compose.yml` values.

---

## 6. Start the Backend

```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 8000
```

The backend uses `tsx watch` — it automatically restarts on file changes.

**Verify:**
```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

---

## 7. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v8.x  ready in Xms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

Open `http://localhost:3000` in your browser. You should see the Acefone MI dashboard.

---

## 8. Test an Agent Run

### Option A: Web UI (easiest)

1. Go to `http://localhost:3000/trigger`
2. Select **SEO Analyzer** tab
3. Enter a blog title and paste some content (300+ words recommended)
4. Click **Run SEO Analysis**
5. You're redirected to the job detail page — it auto-refreshes every 3s until done

### Option B: cURL

```bash
curl -X POST http://localhost:8000/api/agents/seo-analyzer \
  -H "Content-Type: application/json" \
  -d '{
    "title": "What is Cloud Telephony?",
    "content": "Cloud telephony is a technology that moves your business phone system to the cloud..."
  }'
```

Response:
```json
{"jobId":"550e8400-...","status":"accepted"}
```

Check the job:
```bash
curl http://localhost:8000/api/jobs/550e8400-...
```

---

## 9. Set Up Notion Webhook (optional)

If you want Notion pages to trigger agents automatically (without using the web UI):

### Install ngrok

```bash
# Windows (winget)
winget install ngrok

# Or download from https://ngrok.com/download
```

### Start tunnel

```bash
ngrok http 8000
```

Copy the HTTPS URL: `https://xxxx-xxxx.ngrok-free.app`

### Register webhook in Notion

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Select your integration
3. Go to **Webhooks** tab
4. Add webhook URL: `https://xxxx-xxxx.ngrok-free.app/webhook`
5. Select events: `page.created`, `page.updated`, `page.properties_updated`
6. Copy the **Signing Secret** → paste into `NOTION_WEBHOOK_SECRET` in `.env`
7. Restart the backend

### Test the webhook

1. Open your `NOTION_DATABASE_ID` database in Notion
2. Create a new page
3. Set `SEO Status` = `Pending`
4. Watch the backend logs — the SEO Analyzer should trigger

---

## Running Everything at Once

Use three terminals:

```
Terminal 1 (DB):       docker-compose up
Terminal 2 (Backend):  cd backend && npm run dev
Terminal 3 (Frontend): cd frontend && npm run dev
```

Or with npm workspaces / concurrently (if configured):
```bash
# From root
npm run dev  # if configured in root package.json
```

---

## Stopping Everything

```bash
# Stop frontend: Ctrl+C in its terminal
# Stop backend:  Ctrl+C in its terminal

# Stop PostgreSQL (keeps data)
docker-compose stop

# Stop PostgreSQL AND delete data
docker-compose down -v
```

---

## Resetting the Database

```bash
# Wipe all data and restart fresh
docker-compose down -v
docker-compose up -d
cd backend && npm run db:migrate
```

---

## Troubleshooting

### `ECONNREFUSED` connecting to PostgreSQL

- Check Docker is running: `docker ps`
- Check port 5432 is not in use by another Postgres instance
- Verify `DATABASE_URL` in `.env`

### `object_not_found` from Notion API

- Notion Integration is not connected to the database
- Go to the database → `···` → **Connections** → add your integration

### `401 Unauthorized` on webhook

- `NOTION_WEBHOOK_SECRET` in `.env` doesn't match the signing secret in Notion
- Or leave `NOTION_WEBHOOK_SECRET` empty to disable verification

### Frontend shows blank page or API errors

- Confirm backend is running on port 8000: `curl http://localhost:8000/health`
- Check Vite proxy config in `frontend/vite.config.ts`

### OpenAI `429 Too Many Requests`

- You've hit the GPT-4o rate limit on your account tier
- Wait and retry, or upgrade your OpenAI usage tier

### Agent stuck in `processing`

Check backend logs for errors. Manually reset in PostgreSQL:

```sql
UPDATE agent_jobs
SET status = 'error', error_message = 'Manually reset — was stuck'
WHERE status = 'processing'
  AND updated_at < now() - interval '10 minutes';
```

---

## Environment Summary

| URL | Service |
|---|---|
| `http://localhost:3000` | React frontend |
| `http://localhost:8000` | Express backend |
| `http://localhost:8000/health` | Backend health check |
| `http://localhost:8000/api/jobs` | Jobs API |
| `localhost:5432` | PostgreSQL |
