# RBAC — Role-Based Access Control

Marketing Intelligence OS uses an **AWS IAM-style group-based model**: permissions are attached to groups, users are assigned to groups. Adding a new agent requires one permission row and one group_permission mapping — zero middleware changes.

---

## Model Overview

```
User → Groups → Permissions
```

- Users belong to one or more groups
- Groups hold a set of permissions (policies)
- JWT embeds flattened permissions at login — no per-request DB lookup
- Admins carry `*` wildcard — no per-route update needed when permissions are added

---

## Groups

| Group | Intended For | Permissions |
|---|---|---|
| `admins` | Platform owners | `*` (all) |
| `marketing-ops` | Campaign managers | `jobs:read`, `agents:trigger:seo-analyzer`, `agents:trigger:blog-reviewer`, `notifications:manage` |
| `seo-analysts` | SEO team | `jobs:read`, `agents:trigger:seo-analyzer`, `notifications:manage` |
| `content-team` | Content writers | `jobs:read`, `agents:trigger:blog-reviewer`, `notifications:manage` |
| `viewers` | Stakeholders / read-only | `jobs:read` |

---

## Permissions

| Permission | What it controls |
|---|---|
| `jobs:read` | View job list, job detail, stats dashboard |
| `agents:trigger:seo-analyzer` | Trigger SEO Analyzer via `POST /api/agents/seo-analyzer` |
| `agents:trigger:blog-reviewer` | Trigger Existing Blog Reviewer via `POST /api/agents/blog-reviewer` |
| `notifications:manage` | Read, mark, dismiss, clear notifications |
| `admin:users` | Create users, deactivate users, assign groups |
| `admin:groups` | View group definitions and their permission sets |
| `*` | Wildcard — all permissions (admins only) |

---

## Database Schema

```
users               — id, username, password_hash (bcrypt), email, is_active
groups              — id, name, description
permissions         — id, name, description
group_permissions   — (group_id, permission_id) composite PK
user_groups         — (user_id, group_id) composite PK
```

Migration: `backend/src/core/db/migrations/003_rbac.sql`

---

## JWT Payload

```typescript
{
  username:    string
  userId:      string
  permissions: string[]   // flattened from all groups, e.g. ['jobs:read', 'agents:trigger:seo-analyzer']
  exp:         number
}
```

`/auth/me` re-derives permissions from DB on each call, so stale JWTs self-correct on next page load without requiring re-login.

---

## Backend Enforcement

### `requireAuth` middleware
Verifies JWT, attaches `req.user: TokenPayload` to every protected request.

### `requirePermission(perm)` middleware
```typescript
import { requirePermission } from '../middleware/requirePermission';

router.post('/agents/seo-analyzer', requirePermission('agents:trigger:seo-analyzer'), handler);
```

Returns `403 Forbidden — insufficient permissions` if the user's permissions array does not contain `perm` or `*`.

Apply after `requireAuth` (or via the `app.use('/api', requireAuth, ...)` chain).

---

## Frontend Enforcement

```typescript
const { hasPermission } = useAuth();

// Check single permission
if (hasPermission('admin:users')) { ... }

// Check trigger access (either agent)
const canTrigger = hasPermission('agents:trigger:seo-analyzer') || hasPermission('agents:trigger:blog-reviewer');
```

`hasPermission` returns `true` for `*` wildcard automatically.

UI elements gated by permission:
- **Trigger Agent** — nav item + workspace tab hidden if no trigger permission
- **Admin** — nav item + tab hidden if no `admin:users` permission
- **Trigger page tabs** — SEO Analyzer tab only if `agents:trigger:seo-analyzer`; Blog Reviewer tab only if `agents:trigger:blog-reviewer`
- **`/admin` route** — renders access denied message if accessed directly without permission

---

## Admin Operations

All endpoints under `/api/admin/` require `requireAuth` + `requirePermission('admin:users')` or `admin:groups`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/users` | List all users with their group names |
| `POST` | `/api/admin/users` | Create user — `{ username, password, email? }` |
| `PATCH` | `/api/admin/users/:id/groups` | Set user's groups — `{ groupIds: string[] }` |
| `PATCH` | `/api/admin/users/:id/active` | Activate/deactivate — `{ isActive: boolean }` |
| `GET` | `/api/admin/groups` | List groups with their permissions |

UI: `/admin` page (visible to admins only).

---

## First-Run Bootstrap

On server startup, if the `users` table is empty, one admin user is auto-created from environment variables:

```
ADMIN_USERNAME=<value>   → username
ADMIN_PASSWORD=<value>   → password (bcrypt hashed, salt rounds = 10)
```

User is placed in the `admins` group automatically. Logged in backend: `Seeded initial admin user`.

After the first real admin exists in the DB, the env-var fallback is bypassed.

---

## Adding a New Agent

1. Add permission row to the migration (or insert directly):
   ```sql
   INSERT INTO permissions (name, description)
   VALUES ('agents:trigger:wireframe-builder', 'Trigger Wireframe Builder agent');
   ```

2. Wire the permission to desired groups in `group_permissions`:
   ```sql
   INSERT INTO group_permissions (group_id, permission_id)
     SELECT g.id, p.id FROM groups g, permissions p
     WHERE g.name = 'marketing-ops' AND p.name = 'agents:trigger:wireframe-builder';
   ```

3. Add `requirePermission('agents:trigger:wireframe-builder')` to the new agent route.

4. Gate the new tab/form in Trigger.tsx with `hasPermission('agents:trigger:wireframe-builder')`.

No changes needed to JWT logic, `requireAuth`, or existing middleware.

---

## Key Files

| File | Role |
|---|---|
| `backend/src/core/db/migrations/003_rbac.sql` | Tables + seed groups + seed permissions |
| `backend/src/core/db/schema.ts` | Drizzle table definitions (`users`, `groups`, `permissions`, `groupPermissions`, `userGroups`) |
| `backend/src/lib/jwt.ts` | `TokenPayload` interface — `username`, `userId`, `permissions[]`, `exp` |
| `backend/src/middleware/requirePermission.ts` | `requirePermission(perm)` factory |
| `backend/src/routes/auth.ts` | Login (bcrypt + DB), `/auth/me`, `loadUserPermissions()` helper |
| `backend/src/routes/admin.ts` | User + group management endpoints |
| `frontend/src/lib/auth.tsx` | `AuthUser` with `permissions[]`, `hasPermission()` in context |
| `frontend/src/pages/Admin.tsx` | Admin UI — user list, create, group assignment |
