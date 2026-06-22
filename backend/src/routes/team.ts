import { Router, Request, Response } from 'express';
import { eq, and, ne } from 'drizzle-orm';
import { db } from '../core/db';
import { users, groups, userGroups } from '../core/db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { logAudit } from '../core/audit';

const router = Router();

function managedGroups(req: Request): string[] {
  return (req.user?.groupMemberships ?? [])
    .filter(m => m.role === 'manager' || (req.user?.permissions ?? []).includes('*'))
    .map(m => m.group);
}

// GET /api/team — list all members of groups I manage
router.get('/team', requireAuth, async (req: Request, res: Response) => {
  const myGroups = managedGroups(req);
  if (myGroups.length === 0) {
    res.status(403).json({ error: 'No groups managed' });
    return;
  }

  const rows = await db
    .select({
      userId:    users.id,
      username:  users.username,
      email:     users.email,
      isActive:  users.isActive,
      groupName: groups.name,
      groupRole: userGroups.groupRole,
    })
    .from(userGroups)
    .innerJoin(users,  eq(users.id,  userGroups.userId))
    .innerJoin(groups, eq(groups.id, userGroups.groupId))
    .orderBy(groups.name, users.username);

  // filter to only groups I manage
  const filtered = rows.filter(r => myGroups.includes(r.groupName));
  res.json({ members: filtered, managedGroups: myGroups });
});

// GET /api/team/candidates — users not yet in a given group (for "add member" dropdown)
router.get('/team/candidates/:groupName', requireAuth, async (req: Request, res: Response) => {
  const groupName = String(req.params.groupName);
  const myGroups = managedGroups(req);

  if (!myGroups.includes(groupName)) {
    res.status(403).json({ error: 'Not a manager of this group' });
    return;
  }

  const [group] = await db.select().from(groups).where(eq(groups.name, groupName)).limit(1);
  if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

  const alreadyIn = await db.select({ userId: userGroups.userId })
    .from(userGroups).where(eq(userGroups.groupId, group.id));
  const alreadyIds = alreadyIn.map(r => r.userId);

  const allUsers = await db.select({ id: users.id, username: users.username, email: users.email })
    .from(users).where(eq(users.isActive, true));

  const candidates = allUsers.filter(u => !alreadyIds.includes(u.id));
  res.json({ candidates });
});

// POST /api/team/:groupName/members — add existing user to my group
router.post('/team/:groupName/members', requireAuth, async (req: Request, res: Response) => {
  const groupName = String(req.params.groupName);
  const myGroups  = managedGroups(req);

  if (!myGroups.includes(groupName)) {
    res.status(403).json({ error: 'Not a manager of this group' });
    return;
  }

  const { userId, role = 'member' } = req.body as { userId: string; role?: string };
  if (!userId) { res.status(400).json({ error: 'userId required' }); return; }
  if (!['member', 'manager'].includes(role)) { res.status(400).json({ error: 'role must be member or manager' }); return; }

  const [group] = await db.select().from(groups).where(eq(groups.name, groupName)).limit(1);
  if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

  const [targetUser] = await db.select({ id: users.id, username: users.username })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) { res.status(404).json({ error: 'User not found' }); return; }

  await db.insert(userGroups)
    .values({ userId, groupId: group.id, groupRole: role })
    .onConflictDoUpdate({ target: [userGroups.userId, userGroups.groupId], set: { groupRole: role } });

  await logAudit(req.user!.userId, req.user!.username, 'team.member_added', 'user', userId,
    { groupName, role, targetUsername: targetUser.username });

  res.json({ ok: true, username: targetUser.username, groupName, role });
});

// PATCH /api/team/:groupName/members/:userId/role — promote/demote within my group
router.patch('/team/:groupName/members/:userId/role', requireAuth, async (req: Request, res: Response) => {
  const { groupName, userId } = req.params as { groupName: string; userId: string };
  const myGroups = managedGroups(req);

  if (!myGroups.includes(groupName)) {
    res.status(403).json({ error: 'Not a manager of this group' });
    return;
  }

  const { role } = req.body as { role: string };
  if (!['member', 'manager'].includes(role)) { res.status(400).json({ error: 'role must be member or manager' }); return; }

  const [group] = await db.select().from(groups).where(eq(groups.name, groupName)).limit(1);
  if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

  const [updated] = await db.update(userGroups)
    .set({ groupRole: role })
    .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, group.id)))
    .returning();

  if (!updated) { res.status(404).json({ error: 'Membership not found' }); return; }

  const [targetUser] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);

  await logAudit(req.user!.userId, req.user!.username, 'team.role_changed', 'user', userId,
    { groupName, role, targetUsername: targetUser?.username });

  res.json({ ok: true, role });
});

// DELETE /api/team/:groupName/members/:userId — remove user from my group
router.delete('/team/:groupName/members/:userId', requireAuth, async (req: Request, res: Response) => {
  const { groupName, userId } = req.params as { groupName: string; userId: string };
  const myGroups = managedGroups(req);

  if (!myGroups.includes(groupName)) {
    res.status(403).json({ error: 'Not a manager of this group' });
    return;
  }

  // prevent removing self
  if (userId === req.user!.userId) {
    res.status(400).json({ error: 'Cannot remove yourself from a group' });
    return;
  }

  const [group] = await db.select().from(groups).where(eq(groups.name, groupName)).limit(1);
  if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

  await db.delete(userGroups)
    .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, group.id)));

  const [targetUser] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);

  await logAudit(req.user!.userId, req.user!.username, 'team.member_removed', 'user', userId,
    { groupName, targetUsername: targetUser?.username });

  res.json({ ok: true });
});

export default router;
