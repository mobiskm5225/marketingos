# Bug & Security Flaw Tracker

> Audited: 2026-07-03. Findings from static analysis of full codebase.

---

## Legend

| Severity | Meaning |
|---|---|
| 🔴 Critical | Exploitable now / feature completely broken |
| 🟠 High | Significant security risk or major functional breakage |
| 🟡 Medium | Moderate risk or user-facing functional issue |
| 🟢 Low | Tech debt, minor issue, no immediate user impact |

Layer tags: `[BE]` = Backend · `[FE]` = Frontend · `[INFRA]` = Docker/config

---

## Critical Security

| # | Layer | Issue | File | Fix |
|---|---|---|---|---|
| S1 | `[BE][INFRA]` | **Live OpenAI + Notion API keys on disk in `backend/.env`** — rotate immediately | `backend/.env` | Rotate `OPENAI_API_KEY`, `NOTION_API_KEY`. Use secrets manager or CI env injection |
| S2 | `[BE]` | **JWT_SECRET is the canonical jwt.io example token** — anyone who knows it can forge tokens for any user | `backend/.env:23` `backend/src/lib/jwt.ts:3` | `openssl rand -hex 32` → set as `JWT_SECRET`. Rotate all issued tokens |
| S3 | `[BE]` | **Webhook HMAC disabled** — `NOTION_WEBHOOK_SECRET` is blank, `if (!secret) return true` passes all requests | `backend/src/middleware/auth.ts:6` | Set secret. Change guard to throw if secret unset |
| S4 | `[BE]` | **Ingest endpoints fully open** — `INGEST_SECRET` blank, `if (!secret) { next(); return }` | `backend/src/middleware/auth.ts:25` | Set secret. Make it mandatory |
| S5 | `[BE]` | **Hardcoded fallback `admin:admin` / `admin:changeme`** — if env vars missing, full `*` permissions granted | `backend/src/routes/auth.ts:86` | Remove `?? 'admin'` / `?? 'changeme'` fallbacks. Fail hard if unset |

---

## High Security

| # | Layer | Issue | File | Fix |
|---|---|---|---|---|
| S6 | `[BE]` | **Superuser password `Admin@123` in plaintext comment** in committed migration | `backend/src/core/db/migrations/006_seed_superuser.sql` | Remove plaintext comment. Force password change on first login |
| S7 | `[BE]` | **SSRF via crawler** — Notion `Blog URL` field fetched with no IP/protocol validation. Attacker writes `http://169.254.169.254/` to Notion DB → backend fetches AWS IMDS / internal Docker services | `backend/src/core/crawler.ts:19` | Validate URL: must be `https://`, hostname must resolve to public IP (block RFC1918, loopback, link-local) |
| S8 | `[BE]` | **`blogDraftsRouter`, `teamRouter`, `adminRouter` mounted without `requireAuth`** at group level — one missed handler = public endpoint | `backend/src/index.ts:37-40` | `app.use('/api', requireAuth, blogDraftsRouter)` etc. |
| S9 | `[BE]` | **Notifications not user-scoped** — any auth'd user reads, marks, deletes all other users' notifications | `backend/src/routes/notifications.ts` | Add `user_id` column to `notifications` table. Filter all queries by `req.user.userId` |
| S10 | `[BE]` | **Env-admin logins not written to `audit_logs`** — silent privileged access | `backend/src/routes/auth.ts:86-92` | Add `logAudit(...)` call in env-admin login path |
| S11 ✅ | `[BE]` | **No rate limiting on `/auth/login`** — brute force unlimited | `backend/src/routes/auth.ts` | `express-rate-limit` added: 10 attempts / 15 min per IP |
| S12 | `[FE]` | **JWT stored in `localStorage`** — XSS stealable, 7-day TTL, no revocation | `frontend/src/lib/auth.tsx:28` | Use `httpOnly` cookies. Implement token revocation or short-lived tokens |
| S13 | `[BE]` | **Raw DB error messages sent to clients** — leaks table names, query details, connection info | `backend/src/routes/jobs.ts:44` `backend/src/routes/admin.ts:57` | Log full error internally. Return `{ error: 'Internal server error' }` |

---

## Medium Security

| # | Layer | Issue | File | Fix |
|---|---|---|---|---|
| S14 | `[BE]` | **No CORS config** — Express allows all origins | `backend/src/index.ts` | `cors({ origin: process.env.FRONTEND_URL, credentials: true })` |
| S15 ✅ | `[BE][INFRA]` | **No security headers** — no `helmet`, no CSP, no `X-Frame-Options`, no HSTS | `backend/src/index.ts` `frontend/nginx.conf` | `helmet()` added to Express (CSP disabled — API-only). nginx: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` |
| S16 | `[BE]` | **No webhook replay protection** — valid webhook can be replayed indefinitely | `backend/src/routes/webhook.ts` | Validate timestamp header. Reject requests older than 5 minutes |
| S17 | `[INFRA]` | **Postgres port 5432 exposed on host** with hardcoded creds `acefone:acefone` | `docker-compose.yml:9` | Remove `ports` mapping. Backend accesses via Docker network — no host exposure needed |
| S18 ✅ | `[BE]` | **No agent trigger rate limiting** — permitted user can spam jobs, drain OpenAI budget | `backend/src/routes/agents.ts` | `express-rate-limit` added: 20 triggers / hour per user (keyed on `req.user.userId`) |
| S19 | `[BE]` | **Disabled users' JWTs remain valid up to 7 days** — deactivating user doesn't block existing token | `backend/src/middleware/requireAuth.ts` | Check `user.isActive` in `requireAuth` via DB lookup, or use short-lived tokens (1h) + refresh |

---

## Critical Bugs

| # | Layer | Issue | File | Fix |
|---|---|---|---|---|
| B1 ✅ | `[FE][BE]` | **Mark-as-read completely broken** — frontend sends `POST`, backend expects `PATCH` → always 404 | `frontend/src/lib/api.ts:196` `backend/src/routes/notifications.ts:28` | Changed `apiPost` to `apiPatch` in `api.ts` |

---

## High Bugs

| # | Layer | Issue | File | Fix |
|---|---|---|---|---|
| B2 ✅ | `[BE]` | **Pagination broken with filters** — `limit/offset` applied to DB query before JS filter. Pages 2+ silently return wrong results for `agent` or `status` filtered views | `backend/src/routes/jobs.ts:38` | Pushed `agentFilter`, `statusFilter`, `q` into SQL `WHERE` with `and()`/`ilike()`. Added `total` count to response |
| B3 ✅ | `[BE]` | **Same pagination bug in audit log** — action + username filters applied in JS after DB fetch | `backend/src/routes/admin.ts:144` | Pushed `action` and `username` filters to SQL `ilike` WHERE conditions |
| B4 ✅ | `[BE]` | **Review claim race condition** — no DB lock, two concurrent requests both read `pending_review`, both succeed | `backend/src/routes/reviews.ts:92` | UPDATE WHERE now includes `inArray(status, ['pending_review','needs_changes'])`. Returns 409 if rows affected = 0 |
| B5 ✅ | `[BE]` | **Duplicate jobs from rapid Notion webhooks** — `page.created` + `page.updated` fire together, both create a job for same Notion page | `backend/src/routes/webhook.ts:183` | Added dedup check in `dispatchAgent`: queries for existing `pending`/`processing` job for same `notionPageId` + agent before inserting |
| B6 ✅ | `[BE]` | **Group update not atomic** — `DELETE user_groups` then `INSERT` with no transaction. Failed insert = user has zero permissions | `backend/src/routes/admin.ts:72` | Wrapped in `db.transaction()` |
| B7 ✅ | `[BE]` | **N+1 queries in admin endpoints** — 50 users = 51+ DB round trips | `backend/src/routes/admin.ts:28` | Batch-load all memberships in one JOIN query. Same fix applied to groups/permissions endpoint |
| B8 ✅ | `[BE]` | **Webhook jobs have `null` title** — `dispatchAgent` inserts job with no title | `backend/src/routes/webhook.ts:134` | Extract title from `page.properties.Name.title[0].plain_text` and pass to `dispatchAgent`. Added `title` param to function signature |
| B9 ✅ | `[FE][BE]` | **Search does nothing** — frontend sends `?q=`, backend has no `q` param | `frontend/src/App.tsx:223` `backend/src/routes/jobs.ts` | Backend: added `ilike(agentJobs.title, '%q%')` to WHERE. Frontend: extracted `backendQ` from title-contains filter, passes to API, excluded from client-side filters |

---

## Medium Bugs

| # | Layer | Issue | File | Fix |
|---|---|---|---|---|
| B10 ✅ | `[FE]` | **`<li>` rendered outside `<ul>`** — invalid HTML, inconsistent browser rendering | `frontend/src/pages/JobDetail.tsx:218` | MarkdownView refactored to accumulate list items and flush into `<ul>`/`<ol>` wrappers |
| B11 ✅ | `[FE]` | **`<tr>/<td>` rendered outside `<table>`** — browser silently discards table rows | `frontend/src/pages/JobDetail.tsx:226` | MarkdownView accumulates table rows and flushes into `<table><tbody>` |
| B12 ✅ | `[FE]` | **`# H1` maps to `<h2>`** — H1 markdown silently demoted | `frontend/src/pages/JobDetail.tsx:197` | `# ` → `<h1>`, `## ` → `<h2>`, `### ` → `<h3>` |
| B13 ✅ | `[FE]` | **No React error boundary** — any runtime JS error = blank white screen | `frontend/src/App.tsx` | Added `ErrorBoundary` class component wrapping `<Routes>` in AppShell |
| B14 ✅ | `[FE]` | **Follow + Update buttons are fake UI** | `frontend/src/pages/JobDetail.tsx:281` | Removed both buttons. Removed `following` state |
| B15 ✅ | `[FE]` | **401 triggers `window.location.reload()`** — destroys unsaved form state | `frontend/src/lib/api.ts:66` | Changed to `window.location.replace('/')` |
| B16 ✅ | `[BE]` | **No try/catch on `auth/me` DB calls** | `backend/src/routes/auth.ts:97` | Wrapped `loadUserPermissions` + `loadUserGroupMemberships` in try/catch, returns 500 on error |
| B17 ✅ | `[BE]` | **`limit=abc` → `NaN` passed to Drizzle** | `backend/src/routes/blog-drafts.ts:15` | Use `parseInt(...) || fallback` with bounds check. Added status enum validation at list endpoint |

---

## UX Audit — 2026-07-03

Frontend-only pass. Theme colors unchanged.

### Defects found & fixed

| # | Layer | Issue | File | Fix |
|---|---|---|---|---|
| D1 ✅ | `[FE]` | **Mojibake in Trigger page** — `â€”`, `â€“`, `âŒ˜` rendered to users (corrupted UTF-8) | `frontend/src/pages/Trigger.tsx` | Replaced with `&mdash;`/`&ndash;` entities; `⌘` hint → `Ctrl+Enter` |
| D2 ✅ | `[FE]` | **`var(--sn-accent)` undefined** — active tab in Admin + Team pages had no highlight | `frontend/src/index.css` | Added `--sn-accent: #08763c` to `:root` |
| D3 ✅ | `[FE]` | **Job "Number" showed full 36-char uppercase UUID** — `replace('job-','J-')` never matched | `frontend/src/lib/format.ts` | New shared `jobIdDisplay()` → `J-XXXXXXXX` (first 8 chars). Used everywhere incl. workspace tab |
| D4 ✅ | `[FE]` | **Claim-race 409 silently swallowed** — backend B4 fix returns 409, frontend showed nothing | `ReviewQueue.tsx` `JobDetail.tsx` | `onError` on all review mutations → error toast + refetch so stale buttons disappear |
| D5 ✅ | `[FE]` | Dashboard said "Auto-refreshes every 30s"; actual interval 15s | `frontend/src/pages/Dashboard.tsx` | Label corrected to 15s |
| D6 ✅ | `[FE]` | **Pagination phantom next page** — `hasNext = rows === PAGE_SIZE` instead of using `total` | `Jobs.tsx` `Errors.tsx` `SeoAnalyzerJobs.tsx` `BlogReviewerJobs.tsx` | `hasNext = (page+1)*PAGE < total`; footer shows "Rows X to Y of Z" and "Page N of M" |
| D7 ✅ | `[FE]` | **DELETE API calls never checked response status** — failed remove-member / dismiss-notification looked like success | `frontend/src/lib/api.ts` | New `apiDelete()` helper with status check + backend error message; GET errors now surface backend message too |

### UX improvements shipped

| Item | Files |
|---|---|
| MarkdownView inline formatting: `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `[links](url)` (recursive inside bold) | `JobDetail.tsx`, `.md a/del/strong` styles in `index.css` |
| Skeleton shimmer loading (metric cards, job tables, job detail page) — replaces bare "Loading..." | `components/Skeleton.tsx`, `index.css`, Dashboard/Jobs/Errors/JobDetail |
| Removed dead placeholder tabs "Activity" + "Related Records" from job detail | `JobDetail.tsx` |
| Two-click `ConfirmButton` for destructive actions: Team Remove, Admin Deactivate | `components/ConfirmButton.tsx`, `TeamManagement.tsx`, `Admin.tsx` |
| Error toasts on all admin/team/blog-draft mutations (was: silent failure) | `Admin.tsx` `TeamManagement.tsx` `BlogDrafts.tsx` |
| Empty states with CTA (“No jobs yet → + Trigger Agent”, “Clear filters”) | `Jobs.tsx` `Dashboard.tsx` |
| Trigger form: `Cancel` navigates away (was: cleared fields); `Clear form` scoped to active tab (was: wiped both); per-agent field labels (“Draft title” vs “Published blog title”) | `Trigger.tsx` |
| Removed dead UI: 4 disabled Rail buttons, 3 disabled header menu items, disabled “Favorites” nav tab | `App.tsx` |
| Dashboard “Queue status” derived from live stats (Active/Waiting/Idle) — was hardcoded “Normal” | `Dashboard.tsx` |
| Agent breakdown cards now deep-link to filtered jobs list (`/jobs?agent=…`) | `Dashboard.tsx` |
| Unified status badges — agent job pages now use shared `.status` class | `SeoAnalyzerJobs.tsx` `BlogReviewerJobs.tsx` |
| Toasts: dismiss ×, `aria-live="polite"`, errors persist 6s | `lib/toast.tsx` |
| Job-not-found state with “Back to Jobs” action; Notion-only results show “Open analysis in Notion” button | `JobDetail.tsx` |
| Deduplicated `timeAgo`/`agentLabel`/`jobIdDisplay` (5–6 copies each) into `lib/format.ts` | 9 files |

### Known gaps (not fixed, noted for later)

- Client-side sort on Jobs only sorts the current page — proper fix needs backend `sort` param
- Review Queue has no pagination (loads all reviews)
- Help button links to placeholder `github.com/acefone`
- No keyboard navigation / focus trap in dropdown menus (profile, notifications)

---

## Low / Tech Debt

| # | Layer | Issue | File |
|---|---|---|---|
| T1 | `[BE]` | `kb_cache` table created in migration 001, currently unused — **reserved for future Notion Knowledge Base integration** (decision 2026-07-03: not wiring KB yet) | `backend/src/core/db/schema.ts:27` |
| T2 | `[BE]` | `wireframe-builder/index.ts` + `anthropic.ts` are empty stubs (`export {}`) | `backend/src/agents/wireframe-builder/` `backend/src/core/ai/anthropic.ts` |
| T3 | `[INFRA]` | `ngrok.exe`, `ngrok.exe.bak`, `.ngrok.exe.old` committed to repo root | repo root |
| T4 ✅ | `[BE]` | Jobs API response has no `total` count — frontend cannot render "showing X of Y" or disable Next button | `backend/src/routes/jobs.ts:42` — fixed as part of B2. `total` now returned from SQL count query and used in `Jobs.tsx` pagination |
| T5 | `[BE]` | Custom JWT implementation — no standard library, no `iss`/`aud`/`jti` claims | `backend/src/lib/jwt.ts` |
| T6 | `[BE]` | `agentRegistry` built once at module load — cannot reload without process restart | `backend/src/registry.ts:26` |

---

## Zero Tests

No unit, integration, or e2e tests exist in the entire project.

Critical untested paths:

- Auth flow (login, JWT sign/verify, permission checks, env-admin fallback)
- Agent state machine (`pending → processing → done / error`)
- Review workflow state transitions (claim, submit, approve, reject, needs-changes)
- Notion HMAC verification
- `markdownToBlocks` conversion (20+ block type branches)
- Pagination and filtering
- Webhook deduplication
- SSRF protection (once added)

---

## Priority Fix Order

1. **Rotate keys now** — OpenAI key, Notion key, JWT secret (S1, S2) ⚠️ pending
2. **Set secrets** — `NOTION_WEBHOOK_SECRET`, `INGEST_SECRET`, strong `JWT_SECRET`, `ADMIN_USERNAME`/`ADMIN_PASSWORD` (S3, S4, S5) ⚠️ pending
3. ✅ **Fix mark-as-read** — POST → PATCH mismatch (B1)
4. ✅ **Fix pagination** — push filters to SQL (B2, B3, T4)
5. ✅ **Fix all remaining bugs** — B4–B17
6. **SSRF fix** — validate crawler URL (S7) ⚠️ pending
7. **Scope notifications per user** — add `user_id` (S9) ⚠️ pending
8. **Atomic group update** — ✅ done (B6)
9. **Postgres port** — remove host exposure (S17) ⚠️ pending
10. ✅ **Rate limiting** — login + agent triggers (S11, S18)
11. ✅ **Security headers** — helmet + nginx (S15)
