import { Router } from 'express';
import { db } from '../core/db';
import { activities } from '../core/db/schema';
import { desc } from 'drizzle-orm';

const router = Router();

router.get('/activity', async (req, res) => {
  try {
    const allActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt));
      
    const formatted = allActivities.map(a => ({
      id: a.slug,
      text: a.text,
      time: a.createdAt.toISOString(),
    }));
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
