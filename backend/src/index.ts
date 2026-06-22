import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import { eq, count } from 'drizzle-orm';
import { httpLogger } from './middleware/logger';
import { requireAuth } from './middleware/requireAuth';
import healthRouter from './routes/health';
import webhookRouter from './routes/webhook';
import ingestRouter from './routes/ingest';
import jobsRouter from './routes/jobs';
import agentsRouter from './routes/agents';
import notificationsRouter from './routes/notifications';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import { db } from './core/db';
import { users, groups, userGroups } from './core/db/schema';
import log from './logger';

const app = express();
const PORT = process.env.PORT ?? 8000;

// Parse JSON and capture raw body in one pass (rawBody used for HMAC on /webhook)
app.use(express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));
app.use(httpLogger);

// Public routes — no auth required
app.use(healthRouter);       // GET /health
app.use(authRouter);         // POST /auth/login, GET /auth/me
app.use(webhookRouter);      // POST /webhook  (Notion HMAC auth)
app.use(ingestRouter);       // POST /ingest   (ingest secret auth)

// Protected routes — JWT required
app.use('/api', requireAuth, jobsRouter);
app.use('/api', requireAuth, agentsRouter);
app.use('/api', requireAuth, notificationsRouter);
app.use('/api', adminRouter);  // admin routes handle their own requireAuth + requirePermission

async function seedAdminIfEmpty(): Promise<void> {
  try {
    const [{ cnt }] = await db.select({ cnt: count() }).from(users);
    if (Number(cnt) > 0) return;

    const username = process.env.ADMIN_USERNAME ?? 'admin';
    const password = process.env.ADMIN_PASSWORD ?? 'changeme';
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id });

    const [adminGroup] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.name, 'admins'))
      .limit(1);

    if (adminGroup) {
      await db.insert(userGroups).values({ userId: user.id, groupId: adminGroup.id });
    }

    log.info({ username }, 'Seeded initial admin user');
  } catch (err: any) {
    log.error({ err: err.message }, 'Admin seed failed — RBAC migration may not have run yet');
  }
}

app.listen(PORT, async () => {
  await seedAdminIfEmpty();
  log.info(`Server running on port ${PORT}`);
});

export default app;
