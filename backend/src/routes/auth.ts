import { Router } from 'express';
import bcrypt from 'bcrypt';
import { eq, count, and } from 'drizzle-orm';
import { db } from '../core/db';
import { users, userGroups, groupPermissions, permissions, groups } from '../core/db/schema';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/requireAuth';
import { logAudit } from '../core/audit';

const router = Router();

export async function loadUserPermissions(userId: string): Promise<string[]> {
  const rows = await db
    .select({ permName: permissions.name })
    .from(userGroups)
    .innerJoin(groupPermissions, eq(groupPermissions.groupId, userGroups.groupId))
    .innerJoin(permissions, eq(permissions.id, groupPermissions.permissionId))
    .where(eq(userGroups.userId, userId));

  const perms = rows.map(r => r.permName);

  // managers in any group auto-get jobs:approve
  const managerRows = await db
    .select({ groupRole: userGroups.groupRole })
    .from(userGroups)
    .where(and(eq(userGroups.userId, userId), eq(userGroups.groupRole, 'manager')))
    .limit(1);

  if (managerRows.length > 0 && !perms.includes('jobs:approve') && !perms.includes('*')) {
    perms.push('jobs:approve');
  }

  return [...new Set(perms)];
}

export async function loadUserGroupMemberships(userId: string) {
  const rows = await db
    .select({ groupName: groups.name, groupRole: userGroups.groupRole })
    .from(userGroups)
    .innerJoin(groups, eq(groups.id, userGroups.groupId))
    .where(eq(userGroups.userId, userId));
  return rows.map(r => ({ group: r.groupName, role: r.groupRole as 'member' | 'manager' }));
}

export async function loadUserGroupNames(userId: string): Promise<string[]> {
  const memberships = await loadUserGroupMemberships(userId);
  return memberships.map(m => m.group);
}

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user) {
    if (!user.isActive) {
      res.status(401).json({ error: 'Account disabled' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logAudit(user.id, username, 'auth.login_failed', 'user', user.id);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const [perms, memberships] = await Promise.all([
      loadUserPermissions(user.id),
      loadUserGroupMemberships(user.id),
    ]);
    await logAudit(user.id, username, 'auth.login', 'user', user.id);
    const token = signToken({ username: user.username, userId: user.id, permissions: perms, groupMemberships: memberships });
    res.json({ token, user: { username: user.username, userId: user.id, permissions: perms, groupMemberships: memberships } });
    return;
  }

  // Fallback: env-var admin (only when users table empty)
  const [{ cnt }] = await db.select({ cnt: count() }).from(users);
  if (Number(cnt) === 0) {
    const validUser = process.env.ADMIN_USERNAME ?? 'admin';
    const validPass = process.env.ADMIN_PASSWORD ?? 'admin';
    if (username === validUser && password === validPass) {
      const token = signToken({ username, userId: 'env-admin', permissions: ['*'], groupMemberships: [{ group: 'admins', role: 'manager' }] });
      res.json({ token, user: { username, userId: 'env-admin', permissions: ['*'], groupMemberships: [{ group: 'admins', role: 'manager' }] } });
      return;
    }
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  if (userId === 'env-admin') {
    res.json({ user: { username: req.user!.username, userId: 'env-admin', permissions: ['*'], groupMemberships: [{ group: 'admins', role: 'manager' }] } });
    return;
  }
  const [perms, memberships] = await Promise.all([
    loadUserPermissions(userId),
    loadUserGroupMemberships(userId),
  ]);
  res.json({ user: { username: req.user!.username, userId, permissions: perms, groupMemberships: memberships } });
});

export default router;
