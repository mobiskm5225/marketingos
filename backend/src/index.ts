import 'dotenv/config';
import express from 'express';
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
import reviewsRouter from './routes/reviews';
import blogDraftsRouter from './routes/blog-drafts';
import teamRouter from './routes/team';
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
app.use('/api', adminRouter);    // admin routes handle their own requireAuth + requirePermission
app.use('/api', requireAuth, reviewsRouter);
app.use('/api', blogDraftsRouter);
app.use('/api', teamRouter);

app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});

export default app;
