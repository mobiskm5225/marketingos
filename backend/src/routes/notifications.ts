import { Router } from 'express';
import { db } from '../core/db';
import { notifications } from '../core/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

const router = Router();

// GET /api/notifications — newest 50, unread first
router.get('/notifications', async (_req, res) => {
  const rows = await db
    .select()
    .from(notifications)
    .orderBy(sql`read ASC, created_at DESC`)
    .limit(50);
  res.json({ notifications: rows });
});

// GET /api/notifications/unread-count
router.get('/notifications/unread-count', async (_req, res) => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(eq(notifications.read, false));
  res.json({ count: row?.count ?? 0 });
});

// PATCH /api/notifications/:id/read — mark one read
router.patch('/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id));
  res.json({ ok: true });
});

// POST /api/notifications/read-all — mark all read
router.post('/notifications/read-all', async (_req, res) => {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.read, false));
  res.json({ ok: true });
});

// DELETE /api/notifications/:id
router.delete('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  await db.delete(notifications).where(eq(notifications.id, id));
  res.json({ ok: true });
});

// DELETE /api/notifications — clear all read
router.delete('/notifications', async (_req, res) => {
  await db.delete(notifications).where(eq(notifications.read, true));
  res.json({ ok: true });
});

export default router;
