import { Router } from 'express';
import { asc } from 'drizzle-orm';
import { db } from '../core/db';
import { categories } from '../core/db/schema';

const router = Router();

/** The shared vocabulary agents and skills both pick from. */
router.get('/categories', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.position), asc(categories.name));
    res.json(rows.map((c) => ({ id: c.slug, name: c.name })));
  } catch (err) {
    next(err);
  }
});

export default router;
