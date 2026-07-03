import { Router } from 'express';
import bcrypt from 'bcrypt';
import { eq, count, desc, and, ilike } from 'drizzle-orm';
import { db } from '../core/db';
import { users, groups, permissions, groupPermissions, userGroups, auditLogs } from '../core/db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { loadUserPermissions, loadUserGroupNames, loadUserGroupMemberships } from './auth';
import { logAudit } from '../core/audit';

const router = Router();
const canUsers  = [requireAuth, requirePermission('admin:users')];
const canGroups = [requireAuth, requirePermission('admin:groups')];
const canAudit  = [requireAuth, requirePermission('admin:audit')];

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/admin/users', ...canUsers, async (_req, res) => {
  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);

  // Batch load all memberships — single query instead of N+1
  const allMemberships = await db
    .select({ userId: userGroups.userId, groupName: groups.name, groupRole: userGroups.groupRole })
    .from(userGroups)
    .innerJoin(groups, eq(groups.id, userGroups.groupId));

  const byUser = new Map<string, Array<{ group: string; role: 'member' | 'manager' }>>();
  for (const m of allMemberships) {
    if (!byUser.has(m.userId)) byUser.set(m.userId, []);
    byUser.get(m.userId)!.push({ group: m.groupName, role: m.groupRole as 'member' | 'manager' });
  }

  const withGroups = allUsers.map(u => {
    const memberships = byUser.get(u.id) ?? [];
    return { ...u, groups: memberships.map(m => m.group), groupMemberships: memberships };
  });

  res.json({ users: withGroups });
});

// POST /api/admin/users
router.post('/admin/users', ...canUsers, async (req, res) => {
  const { username, password, email } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [user] = await db
      .insert(users)
      .values({ username, passwordHash, email: email ?? null })
      .returning({ id: users.id, username: users.username, email: users.email, isActive: users.isActive, createdAt: users.createdAt });

    await logAudit(req.user!.userId, req.user!.username, 'admin.user_created', 'user', user.id, { createdUsername: username });
    res.status(201).json({ user: { ...user, groups: [], groupMemberships: [] } });
  } catch (err: any) {
    if (err.message?.includes('unique')) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/groups — set groups + roles
// Body: { groupIds: string[], groupRoles?: { [groupId]: 'member' | 'manager' } }
router.patch('/admin/users/:id/groups', ...canUsers, async (req, res) => {
  const id = String(req.params.id);
  const { groupIds, groupRoles } = req.body ?? {};
  if (!Array.isArray(groupIds)) {
    res.status(400).json({ error: 'groupIds must be an array' });
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(userGroups).where(eq(userGroups.userId, id));
    if (groupIds.length > 0) {
      await tx.insert(userGroups).values(
        (groupIds as string[]).map(gid => ({
          userId:    id,
          groupId:   gid,
          groupRole: (groupRoles?.[gid] as 'member' | 'manager') ?? 'member',
        }))
      );
    }
  });

  const [groupNames, perms, memberships] = await Promise.all([
    loadUserGroupNames(id),
    loadUserPermissions(id),
    loadUserGroupMemberships(id),
  ]);

  await logAudit(req.user!.userId, req.user!.username, 'admin.user_groups_updated', 'user', id, { groups: groupNames });
  res.json({ ok: true, groups: groupNames, groupMemberships: memberships, permissions: perms });
});

// PATCH /api/admin/users/:id/active
router.patch('/admin/users/:id/active', ...canUsers, async (req, res) => {
  const id = String(req.params.id);
  const { isActive } = req.body ?? {};
  if (typeof isActive !== 'boolean') {
    res.status(400).json({ error: 'isActive must be a boolean' });
    return;
  }
  await db.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, id));
  await logAudit(req.user!.userId, req.user!.username, isActive ? 'admin.user_activated' : 'admin.user_deactivated', 'user', id);
  res.json({ ok: true });
});

// ─── Groups ───────────────────────────────────────────────────────────────────

// GET /api/admin/groups
router.get('/admin/groups', ...canGroups, async (_req, res) => {
  const allGroups = await db.select().from(groups).orderBy(groups.name);

  // Batch load all group permissions — single query instead of N+1
  const allGroupPerms = await db
    .select({ groupId: groupPermissions.groupId, permName: permissions.name, permDesc: permissions.description })
    .from(groupPermissions)
    .innerJoin(permissions, eq(permissions.id, groupPermissions.permissionId));

  const permsByGroup = new Map<string, Array<{ name: string; description: string | null }>>();
  for (const gp of allGroupPerms) {
    if (!permsByGroup.has(gp.groupId)) permsByGroup.set(gp.groupId, []);
    permsByGroup.get(gp.groupId)!.push({ name: gp.permName, description: gp.permDesc ?? null });
  }

  const withPerms = allGroups.map(g => ({
    ...g,
    permissions: permsByGroup.get(g.id) ?? [],
  }));

  res.json({ groups: withPerms });
});

// GET /api/admin/stats
router.get('/admin/stats', ...canUsers, async (_req, res) => {
  const [{ cnt }] = await db.select({ cnt: count() }).from(users);
  res.json({ totalUsers: Number(cnt) });
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

// GET /api/admin/audit?limit=50&offset=0&action=&username=
router.get('/admin/audit', ...canAudit, async (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const auditConditions: ReturnType<typeof eq>[] = [];
  if (req.query.action)   auditConditions.push(ilike(auditLogs.action,   `%${req.query.action}%`)   as any);
  if (req.query.username) auditConditions.push(ilike(auditLogs.username, `%${req.query.username}%`) as any);
  const auditWhere = auditConditions.length > 0 ? and(...auditConditions) : undefined;

  const rows = await db
    .select()
    .from(auditLogs)
    .where(auditWhere)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ logs: rows, limit, offset });
});

export default router;
