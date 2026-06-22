import { Router } from 'express';
import bcrypt from 'bcrypt';
import { eq, count } from 'drizzle-orm';
import { db } from '../core/db';
import { users, groups, permissions, groupPermissions, userGroups } from '../core/db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { loadUserPermissions, loadUserGroupNames } from './auth';

const router = Router();
const canUsers  = [requireAuth, requirePermission('admin:users')];
const canGroups = [requireAuth, requirePermission('admin:groups')];

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

  const withGroups = await Promise.all(allUsers.map(async u => ({
    ...u,
    groups: await loadUserGroupNames(u.id),
  })));

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
    res.status(201).json({ user: { ...user, groups: [] } });
  } catch (err: any) {
    if (err.message?.includes('unique')) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/groups — set user's groups (replaces existing)
router.patch('/admin/users/:id/groups', ...canUsers, async (req, res) => {
  const id = String(req.params.id);
  const { groupIds } = req.body ?? {};
  if (!Array.isArray(groupIds)) {
    res.status(400).json({ error: 'groupIds must be an array' });
    return;
  }

  await db.delete(userGroups).where(eq(userGroups.userId, id));
  if (groupIds.length > 0) {
    await db.insert(userGroups).values((groupIds as string[]).map(gid => ({ userId: id, groupId: gid })));
  }

  const groupNames = await loadUserGroupNames(id);
  const perms = await loadUserPermissions(id);
  res.json({ ok: true, groups: groupNames, permissions: perms });
});

// PATCH /api/admin/users/:id/active — activate / deactivate
router.patch('/admin/users/:id/active', ...canUsers, async (req, res) => {
  const id = String(req.params.id);
  const { isActive } = req.body ?? {};
  if (typeof isActive !== 'boolean') {
    res.status(400).json({ error: 'isActive must be a boolean' });
    return;
  }
  await db.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, id));
  res.json({ ok: true });
});

// ─── Groups ───────────────────────────────────────────────────────────────────

// GET /api/admin/groups
router.get('/admin/groups', ...canGroups, async (_req, res) => {
  const allGroups = await db.select().from(groups).orderBy(groups.name);

  const withPerms = await Promise.all(allGroups.map(async g => {
    const rows = await db
      .select({ permName: permissions.name, permDesc: permissions.description })
      .from(groupPermissions)
      .innerJoin(permissions, eq(permissions.id, groupPermissions.permissionId))
      .where(eq(groupPermissions.groupId, g.id));
    return { ...g, permissions: rows.map(r => ({ name: r.permName, description: r.permDesc })) };
  }));

  res.json({ groups: withPerms });
});

// GET /api/admin/users/:id/count (used by frontend to confirm user exists)
router.get('/admin/stats', ...canUsers, async (_req, res) => {
  const [{ cnt }] = await db.select({ cnt: count() }).from(users);
  res.json({ totalUsers: Number(cnt) });
});

export default router;
