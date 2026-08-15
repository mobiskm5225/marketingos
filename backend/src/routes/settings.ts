import { Router } from 'express';
import { db } from '../core/db';
import { modelProviders, integrations } from '../core/db/schema';

const router = Router();

router.get('/models', async (req, res) => {
  try {
    const models = await db.select().from(modelProviders).orderBy(modelProviders.createdAt);
    
    const formatted = models.map(m => ({
      id: m.slug,
      name: m.name,
      kind: m.kind,
      models: m.models,
      status: m.status,
      note: m.note,
    }));
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/integrations', async (req, res) => {
  try {
    const ints = await db.select().from(integrations).orderBy(integrations.createdAt);
    
    const formatted = ints.map(i => ({
      id: i.slug,
      name: i.name,
      blurb: i.blurb,
      status: i.status,
      detail: i.detail,
    }));
    
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
