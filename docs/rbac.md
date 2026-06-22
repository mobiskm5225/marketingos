# RBAC — Role-Based Access Control

Marketing Intelligence OS uses an **AWS IAM-style group-based model**: permissions attach to groups, users assign to groups. Groups also carry a `role` field (`member` | `manager`) that controls who can approve work within that group's review queue.

---

## Model Overview

```
User → Groups (with role: member | manager) → Permissions
```

- Users belong to one or more groups with a role per group
- Groups hold permissions (policies)
- JWT embeds flat `permissions[]` and `groupMemberships[]` at login
- Admins carry `*` wildcard — no per-route update needed
- `jobs:approve` is auto-derived from `group_role = 'manager'` — not stored in `group_permissions`

---

## Groups

| Group | Intended For | Permissions |
|---|---|---|
| `admins` | Platform owners | `*` (all) |
| `marketing-ops` | Campaign managers | `jobs:read`, `agents:trigger:seo-analyzer`, `agents:trigger:blog-reviewer`, `notifications:manage`, `jobs:review`, `jobs:approve` |
| `seo-analysts` | SEO team | `jobs:read`, `agents:trigger:seo-analyzer`, `notifications:manage`, `jobs:review` |
| `content-team` | Content writers | `jobs:read`, `agents:trigger:blog-reviewer`, `notifications:manage`, `jobs:review`, `blog-drafts:manage` |
| `viewers` | Stakeholders / read-only | `jobs:read` |

---

## Permissions

| Permission | What it controls |
|---|---|
| `jobs:read` | View job list, job detail, stats dashboard |
| `agents:trigger:seo-analyzer` | Trigger SEO Analyzer · view SEO Analyzer Jobs page |
| `agents:trigger:blog-reviewer` | Trigger Existing Blog Reviewer · view Blog Reviewer Jobs page |
| `notifications:manage` | Read, mark, dismiss, clear notifications |
| `jobs:review` | Claim and submit reviews on agent job outputs |
| `jobs:approve` | Manager-level: approve / reject / request changes on reviewed jobs _(auto-derived from `group_role = 'manager'`, not stored in DB)_ |
| `blog-drafts:manage` | View and review new blog drafts (content team) |
| `admin:users` | Create users, deactivate users, assign groups |
| `admin:groups` | View group definitions and their permission sets |
| `admin:audit` | View audit log in Admin panel |
| `*` | Wildcard — all permissions (admins only) |

---

## Group Hierarchy (member / manager)

Each `user_groups` row carries a `group_role` field:

| Role | Capabilities |
|---|---|
| `member` | Can claim and submit reviews (`jobs:review`) |
| `manager` | Everything a member can do + approve / reject / request-changes (`jobs:approve` auto-added to JWT) |

Set role when assigning a user to a group via the Admin UI → Users & Groups panel.

---

## Database Schema

```
users               — id, username, password_hash (bcrypt), email, is_active
groups              — id, name, description
permissions         — id, name, description
group_permissions   — (group_id, permission_id) composite PK
user_groups         — (user_id, group_id, group_role) composite PK

audit_logs          — id, user_id, username, action, entity_type, entity_id, metadata JSON, created_at
job_reviews         — id, job_id, group_name, status, reviewer_id/name/note/at, lead_id/name/comment/decided_at
blog_drafts         — id, title, content, url, source, status, reviewer_id/name/note/reviewed_at
```

Migrations (run in order):
- `003_rbac.sql` — core RBAC tables + seed groups + permissions
- `004_review_audit.sql` — audit_logs, job_reviews, group_role column, review permissions
- `005_blog_drafts.sql` — blog_drafts table + `blog-drafts:manage` permission

---

## JWT Payload

```typescript
{
  username:         string
  userId:           string
  permissions:      string[]            // ['jobs:read', 'agents:trigger:seo-analyzer', ...]
  groupMemberships: {                   // per-group role
    group: string
    role:  'member' | 'manager'
  }[]
  exp: number
}
```

`/auth/me` re-derives permissions and memberships from DB on each call — stale JWTs self-correct on next page load.

---

## Backend Enforcement

### `requireAuth` middleware
Verifies JWT, attaches `req.user: TokenPayload` to every protected request.

### `requirePermission(perm)` middleware
```typescript
import { requirePermission } from '../middleware/requirePermission';

router.post('/agents/seo-analyzer', requirePermission('agents:trigger:seo-analyzer'), handler);
```
Returns `403` if `req.user.permissions` does not contain `perm` or `*`.

### Manager check (in route handlers)
```typescript
const isManager = req.user!.groupMemberships.some(
  m => m.group === review.groupName && m.role === 'manager'
);
```

---

## Frontend Enforcement

```typescript
const { hasPermission, isManagerInGroup, myGroups } = useAuth();

hasPermission('admin:users')          // true for admins + anyone with that perm
isManagerInGroup('seo-analysts')      // true if user is manager in that group (or has *)
myGroups                              // string[] of group names
```

### Gated UI elements

| Element | Gate |
|---|---|
| Trigger Agent nav/tab | `agents:trigger:seo-analyzer` OR `agents:trigger:blog-reviewer` |
| SEO Analyzer Jobs page (`/agents/seo`) | `agents:trigger:seo-analyzer` |
| Existing Blog Reviewer Jobs page (`/agents/blog-reviewer`) | `agents:trigger:blog-reviewer` |
| Review Queue nav/tab (`/reviews`) | `jobs:review` |
| Blog Drafts page (`/blog-drafts`) | `blog-drafts:manage` |
| Admin nav/tab + route (`/admin`) | `admin:users` |
| Admin → Audit Log tab | `admin:audit` |

---

## Review Workflow

Agent jobs trigger an automatic review when they complete. State machine:

```
pending_review → under_review → reviewed → approved
                                         → rejected
                                         → needs_changes → pending_review (re-opens for member)
```

| Action | Who | Endpoint |
|---|---|---|
| Claim | member with `jobs:review` | `POST /api/jobs/:id/review/claim` |
| Submit review note | reviewer (claimant) | `POST /api/jobs/:id/review/submit` |
| Approve | manager with `jobs:approve` + `isManagerInGroup` | `POST /api/jobs/:id/review/approve` |
| Reject | manager | `POST /api/jobs/:id/review/reject` |
| Request changes | manager (leadComment required) | `POST /api/jobs/:id/review/needs-changes` |

Agent → review group mapping (in `backend/src/routes/reviews.ts`):
```typescript
{ 'seo-analyzer': 'seo-analysts', 'blog-reviewer': 'seo-analysts' }
```

---

## Blog Drafts — Go Routine Ingest

Go routines push new blog drafts via:

```
POST /ingest/blog-draft
Authorization: Bearer <INGEST_SECRET>
Content-Type: application/json

{ "title": "...", "content": "...", "url": "...", "source": "notion" }
```

Response: `{ id, title, status, createdAt }`

Content team sees drafts at `/blog-drafts`. Status flow: `pending → in_review → approved | rejected`.
All review actions logged to `audit_logs`.

---

## Audit Log

Every significant action appends a row to `audit_logs`:

| Action | Triggered by |
|---|---|
| `auth.login` / `auth.login_failed` | Login route |
| `agent.trigger` | Agents route |
| `review.claimed` / `review.submitted` / `review.approved` / `review.rejected` / `review.needs_changes` | Reviews route |
| `blog-draft.in_review` / `blog-draft.approved` / `blog-draft.rejected` | Blog drafts route |
| `admin.user_created` / `admin.groups_updated` / `admin.user_toggled` | Admin route |

Admins view the log at **Admin → Audit Log** (requires `admin:audit` permission).
API: `GET /api/admin/audit?limit=50&offset=0&action=auth.login&username=alice`

---

## Admin Operations

All `/api/admin/` endpoints require `requireAuth` + appropriate permission.

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/users` | `admin:users` | List all users with groups |
| `POST` | `/api/admin/users` | `admin:users` | Create user `{ username, password, email? }` |
| `PATCH` | `/api/admin/users/:id/groups` | `admin:users` | Set groups `{ groupIds, groupRoles? }` |
| `PATCH` | `/api/admin/users/:id/active` | `admin:users` | Toggle active `{ isActive }` |
| `GET` | `/api/admin/groups` | `admin:groups` | List groups + permissions |
| `GET` | `/api/admin/audit` | `admin:audit` | Paginated audit log |

---

## Admin Account

No env-var bootstrap. The `superuser` account was created directly in the DB with a bcrypt-hashed password (12 salt rounds) and placed in the `admins` group as `manager`.

To create additional admins after fresh DB setup, run the `create_admin.js` helper pattern:
```bash
docker exec -w /app <backend-container> node -e "..."
# or use the Admin UI once logged in as superuser
```

---

## Adding a New Agent

1. Insert permission:
   ```sql
   INSERT INTO permissions (name, description)
   VALUES ('agents:trigger:new-agent', 'Trigger New Agent');
   ```

2. Wire to groups:
   ```sql
   INSERT INTO group_permissions (group_id, permission_id)
   SELECT g.id, p.id FROM groups g, permissions p
   WHERE g.name = 'seo-analysts' AND p.name = 'agents:trigger:new-agent';
   ```

3. Add `requirePermission('agents:trigger:new-agent')` to the agent route.

4. Gate the UI form with `hasPermission('agents:trigger:new-agent')`.

5. Add agent → review group mapping in `backend/src/routes/reviews.ts` `AGENT_REVIEW_GROUP`.

6. Call `createReviewForJob(jobId, AGENT_NAME)` on job completion in the agent's `index.ts`.

---

## Key Files

| File | Role |
|---|---|
| `backend/src/core/db/migrations/003_rbac.sql` | Core RBAC tables + seed |
| `backend/src/core/db/migrations/004_review_audit.sql` | Audit + review + group_role |
| `backend/src/core/db/migrations/005_blog_drafts.sql` | Blog drafts + permission |
| `backend/src/core/db/schema.ts` | Drizzle table definitions (all tables) |
| `backend/src/lib/jwt.ts` | `TokenPayload` + `GroupMembership` interfaces |
| `backend/src/middleware/requirePermission.ts` | `requirePermission(perm)` factory |
| `backend/src/routes/auth.ts` | Login, `/auth/me`, `loadUserPermissions()`, `loadUserGroupMemberships()` |
| `backend/src/routes/admin.ts` | User/group management + audit log endpoint |
| `backend/src/routes/reviews.ts` | Review state machine endpoints + `AGENT_REVIEW_GROUP` map |
| `backend/src/routes/blog-drafts.ts` | Blog draft CRUD + review actions |
| `backend/src/routes/ingest.ts` | `POST /ingest/blog-draft` for Go routines |
| `backend/src/core/audit.ts` | `logAudit()` helper — append-only, swallows errors |
| `backend/src/core/reviews.ts` | `createReviewForJob()` — called on agent completion |
| `frontend/src/lib/auth.tsx` | `AuthUser`, `hasPermission()`, `isManagerInGroup()`, `myGroups` |
| `frontend/src/pages/Admin.tsx` | Users & Groups + Audit Log tabs |
| `frontend/src/pages/ReviewQueue.tsx` | Review queue listing with claim/submit/decide actions |
| `frontend/src/pages/BlogDrafts.tsx` | Content team new blog drafts listing + review |
| `frontend/src/pages/SeoAnalyzerJobs.tsx` | SEO Analyzer job list (seo-analysts only) |
| `frontend/src/pages/BlogReviewerJobs.tsx` | Existing Blog Reviewer job list (content-team only) |
