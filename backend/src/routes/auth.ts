import { Router } from 'express';
import bcrypt from 'bcrypt';
import { eq, count } from 'drizzle-orm';
import { db } from '../core/db';
import { users, userGroups, groupPermissions, permissions, groups } from '../core/db/schema';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

export async function loadUserPermissions(userId: string): Promise<string[]> {
  const rows = await db
    .select({ permName: permissions.name })
    .from(userGroups)
    .innerJoin(groupPermissions, eq(groupPermissions.groupId, userGroups.groupId))
    .innerJoin(permissions, eq(permissions.id, groupPermissions.permissionId))
    .where(eq(userGroups.userId, userId));
  return rows.map(r => r.permName);
}

export async function loadUserGroupNames(userId: string): Promise<string[]> {
  const rows = await db
    .select({ groupName: groups.name })
    .from(userGroups)
    .innerJoin(groups, eq(groups.id, userGroups.groupId))
    .where(eq(userGroups.userId, userId));
  return rows.map(r => r.groupName);
}

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  // DB-backed auth
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
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const perms = await loadUserPermissions(user.id);
    const token = signToken({ username: user.username, userId: user.id, permissions: perms });
    res.json({ token, user: { username: user.username, userId: user.id, permissions: perms } });
    return;
  }

  // Fallback: env-var admin (only if users table is still empty — pre-seed state)
  const [{ cnt }] = await db.select({ cnt: count() }).from(users);
  if (Number(cnt) === 0) {
    const validUser = process.env.ADMIN_USERNAME ?? 'admin';
    const validPass = process.env.ADMIN_PASSWORD ?? 'admin';
    if (username === validUser && password === validPass) {
      const token = signToken({ username, userId: 'env-admin', permissions: ['*'] });
      res.json({ token, user: { username, userId: 'env-admin', permissions: ['*'] } });
      return;
    }
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  if (userId === 'env-admin') {
    res.json({ user: { username: req.user!.username, userId: 'env-admin', permissions: ['*'] } });
    return;
  }
  const perms = await loadUserPermissions(userId);
  res.json({ user: { username: req.user!.username, userId, permissions: perms } });
});

export default router;
