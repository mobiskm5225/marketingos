import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
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
import linkedinRouter from './routes/linkedin';
import settingsRouter from './routes/settings';
import log from './logger';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(helmet({ contentSecurityPolicy: false }));

// Parse JSON and capture raw body in one pass (rawBody used for HMAC on /webhook).
// 4mb limit: logo upload sends base64 image in the JSON body.
app.use(express.json({
  limit: '4mb',
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
app.use('/api', requireAuth, linkedinRouter);
app.use('/api', requireAuth, settingsRouter);

app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});

export default app;
