# API Reference

Base URL: `http://localhost:8000`

All request/response bodies are JSON. All responses include `Content-Type: application/json`.

---

## Health

### `GET /health`

Returns server status. Use for uptime checks and load balancer probes.

**Response `200`**
```json
{ "status": "ok" }
```

---

## Webhook

### `POST /webhook`

Receives Notion webhook events. Returns `200` immediately; processing runs asynchronously in the background.

**Headers**

| Header | Required | Description |
|---|---|---|
| `x-notion-signature` | If `NOTION_WEBHOOK_SECRET` set | `v1,<hmac-sha256-hex>` |
| `Content-Type` | Yes | `application/json` |

**Signature Verification**

If `NOTION_WEBHOOK_SECRET` is set in `.env`:
- Extract hex from `v1,<hex>` header value
- Compare `HMAC-SHA256(secret, rawBody)` using timing-safe comparison
- Returns `401` if mismatch

If `NOTION_WEBHOOK_SECRET` is empty, verification is skipped (suitable for local dev).

**Verification Handshake**

On first Notion webhook registration, Notion sends a handshake payload. The server detects and echoes it back automatically:

```json
// Notion sends:
{ "verification_token": "abc123..." }

// Server responds:
{ "verification_token": "abc123..." }
```

**Supported Event Types**

- `page.created`
- `page.updated`
- `page.content_updated`
- `page.properties_updated`

All other event types are acknowledged (200) but not processed.

**Processing Logic**

```
1. Parse entity.id (Notion page ID)
2. Fetch page from Notion (retry 3× with 2s backoff)
3. Skip if page.archived or page.in_trash
4. Normalize parent.database_id (remove hyphens)
5. If parent = BLOG_TRACKER_DATABASE_ID → Blog Tracker flow
6. If parent = registered agent DB → check status = Pending → dispatch agent
7. Otherwise → skip silently
```

**Blog Tracker flow:**
1. Read `URL` property from page
2. Extract Notion page ID from URL
3. Fetch that blog page → get title
4. Dedup check: skip if title already has a non-error SEO review
5. Create entry in `NOTION_DATABASE_ID` with `SEO Status = Pending`
6. Route to SEO Analyzer

**Response `200`**
```json
{ "status": "accepted" }
```

**Response `401`**
```json
{ "error": "Invalid signature" }
```

---

## Ingest

### `POST /ingest`

Direct content ingestion. Creates a Notion page (if configured) and starts analysis. Returns immediately.

**Headers**

| Header | Required | Description |
|---|---|---|
| `x-ingest-secret` | If `INGEST_SECRET` set | Shared secret |
| `Content-Type` | Yes | `application/json` |

**Request Body**

```json
{
  "title": "string (required)",
  "content": "string (required)"
}
```

**Response `200`**
```json
{
  "status": "accepted",
  "pageId": "notion-page-id",
  "jobId": "uuid"
}
```

**Response `401`**
```json
{ "error": "Unauthorized" }
```

**Response `400`**
```json
{ "error": "title and content are required" }
```

---

## Auth

### `POST /auth/login`

Exchange credentials for a JWT. All `/api/*` routes require the returned token.

**Request Body**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response `200`**
```json
{
  "token": "eyJ...",
  "user": {
    "username": "admin",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "permissions": ["agents:trigger:seo-analyzer", "agents:trigger:blog-reviewer"],
    "groupMemberships": [{ "group": "content-team", "role": "member" }]
  }
}
```

**Response `400`**
```json
{ "error": "username and password are required" }
```

**Response `401`**
```json
{ "error": "Invalid credentials" }
```

**Response `429`**
```json
{ "error": "Too many login attempts. Try again in 15 minutes." }
```

Rate limit: 10 attempts per 15 minutes per IP. Response headers include `RateLimit-*` (RFC draft-8).

---

## Jobs

### `GET /api/jobs`

Paginated job list, newest first. All filters applied in SQL — pagination counts are accurate.

**Query Parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 50 | Max records to return (hard cap: 200) |
| `offset` | number | 0 | Pagination offset |
| `agent` | string | — | Filter by `seo-analyzer` or `blog-reviewer` |
| `status` | string | — | Filter by `pending`, `processing`, `done`, or `error` |
| `q` | string | — | Title search (case-insensitive substring match) |

**Response `200`**
```json
{
  "jobs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "agentName": "seo-analyzer",
      "notionPageId": "abcdef1234567890abcdef1234567890",
      "title": "Cloud Telephony Pricing in 2025",
      "status": "done",
      "inputTokens": 4218,
      "outputTokens": 1847,
      "costUsd": "0.029020",
      "errorMessage": null,
      "source": "webhook",
      "createdAt": "2026-06-19T10:23:45.000Z",
      "updatedAt": "2026-06-19T10:24:12.000Z"
    }
  ],
  "limit": 50,
  "offset": 0,
  "total": 284
}
```

---

### `GET /api/jobs/:id`

Single job with full result content.

**Path Parameter**

| Param | Description |
|---|---|
| `id` | Job UUID |

**Response `200`**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agentName": "seo-analyzer",
  "notionPageId": "abcdef1234567890abcdef1234567890",
  "title": "Cloud Telephony Pricing in 2025",
  "status": "done",
  "inputTokens": 4218,
  "outputTokens": 1847,
  "costUsd": "0.029020",
  "errorMessage": null,
  "source": "api",
  "createdAt": "2026-06-19T10:23:45.000Z",
  "updatedAt": "2026-06-19T10:24:12.000Z",
  "results": [
    {
      "id": "661f9500-f30c-52e5-b827-557766551111",
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "resultType": "seo_analysis",
      "content": "# SEO Analysis: Cloud Telephony...\n\n...",
      "createdAt": "2026-06-19T10:24:12.000Z"
    }
  ]
}
```

**Response `404`**
```json
{ "error": "Job not found" }
```

---

### `GET /api/stats`

Aggregated analytics. Used by the Dashboard page.

**Response `200`**
```json
{
  "totalJobs": 150,
  "totalCostUsd": 45.25,
  "thisMonthCostUsd": 12.50,
  "errorRate": 5,
  "byStatus": {
    "done": 120,
    "error": 8,
    "processing": 2,
    "pending": 20
  },
  "byAgent": {
    "seo-analyzer": {
      "jobs": 100,
      "costUsd": 30.00
    },
    "blog-reviewer": {
      "jobs": 50,
      "costUsd": 15.25
    }
  }
}
```

`errorRate` is a percentage (0–100), rounded to nearest integer.
`thisMonthCostUsd` covers the current calendar month (UTC).

---

## Agents

### `POST /api/agents/seo-analyzer`

Trigger SEO Analyzer directly. No Notion page required. Analysis result stored in PostgreSQL (`agentResults` table).

**Request Body**
```json
{
  "title": "string (required)",
  "content": "string (required — paste your draft blog text)",
  "url": "string (optional — https://... for canonical analysis)"
}
```

**Response `200`**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "accepted"
}
```

Processing is asynchronous. Poll `GET /api/jobs/:jobId` to track progress.

**Response `400`**
```json
{ "error": "title and content are required" }
```

**Response `429`**
```json
{ "error": "Agent trigger limit reached. Maximum 20 triggers per hour per user." }
```

Rate limit: 20 triggers per hour per authenticated user (keyed on user ID).

---

### `POST /api/agents/blog-reviewer`

Trigger Existing Blog Reviewer directly. Crawls the live URL before analysis.

**Request Body**
```json
{
  "title": "string (required)",
  "url": "string (required — must be publicly accessible)"
}
```

**Response `200`**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "accepted"
}
```

**Response `400`**
```json
{ "error": "title and url are required" }
```

**Response `429`**
```json
{ "error": "Agent trigger limit reached. Maximum 20 triggers per hour per user." }
```

Rate limit: 20 triggers per hour per authenticated user (keyed on user ID).

---

## Blog Drafts

### `POST /api/blog-drafts/sync`

Pull every page from the Notion Blog Tracker into `blog_drafts`. Idempotent. Notion status maps to review status (`Published → approved`, `In Review → in_review`, else `pending`); human review decisions are never overwritten. Requires `blog-drafts:manage`.

**Response `200`**
```json
{ "total": 28, "created": 0, "updated": 27, "skipped": 1 }
```

### `POST /api/blog-drafts/:id/analyze`

Run SEO Analyzer on a draft. Result stored in `agent_results` and written as an "SEO Analysis" child page under the draft's Notion tracker row. Requires `agents:trigger:seo-analyzer`. Shares the agent trigger rate limit (20/hour per user).

**Response `200`**
```json
{ "jobId": "uuid", "status": "accepted" }
```

**Response `400`** — draft content under 300 words
**Response `409`** — an analysis is already running for this draft
**Response `429`** — trigger rate limit reached

---

## Job Status Lifecycle

```
pending → processing → done
                    ↘ error
```

| Status | Meaning |
|---|---|
| `pending` | Job created, not yet started |
| `processing` | Agent is running (OpenAI call in progress) |
| `done` | Analysis complete, results stored |
| `error` | Agent failed — see `errorMessage` field |

---

## Polling for Results

After creating a job, poll until status is `done` or `error`:

```javascript
async function waitForJob(jobId) {
  while (true) {
    const res = await fetch(`/api/jobs/${jobId}`);
    const job = await res.json();
    if (job.status === 'done') return job;
    if (job.status === 'error') throw new Error(job.errorMessage);
    await new Promise(r => setTimeout(r, 3000)); // 3s poll
  }
}
```

The frontend does this automatically via TanStack Query `refetchInterval: 3000` when `status = processing | pending`.

---

## Error Responses

All error responses follow the same shape:

```json
{
  "error": "Human-readable message"
}
```

| HTTP Code | When |
|---|---|
| 400 | Missing required fields |
| 401 | Invalid signature or secret |
| 404 | Job not found |
| 429 | Rate limit exceeded (login: 10/15 min per IP; agent triggers: 20/hr per user) |
| 500 | Unexpected server error |
