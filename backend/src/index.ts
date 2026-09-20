import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { httpLogger } from './middleware/logger';
import healthRouter from './routes/health';
import agentsRouter from './routes/agents';
import knowledgeRouter from './routes/knowledge';
import settingsRouter from './routes/settings';
import runsRouter from './routes/runs';
import activityRouter from './routes/activity';
import skillsRouter from './routes/skills';
import categoriesRouter from './routes/categories';
import integrationsRouter from './routes/integrations';
import { errorHandler, notFoundHandler } from './middleware/error';
import log from './logger';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(helmet({ contentSecurityPolicy: false }));

// The browser calls the API cross-origin during client-side navigation.
// CORS_ORIGINS is a comma-separated allowlist; defaults cover Vite and Docker frontend ports.
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:8080')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, mobile, curl, or same-origin requests with no origin header
    if (!origin) return callback(null, true);
    // Allow explicitly configured origins or wildcard
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow any localhost / 127.0.0.1 port for local development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));

// Parse JSON and capture raw body in one pass.
// 4mb limit: logo upload sends base64 image in the JSON body.
app.use(express.json({
  limit: '4mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));
app.use(httpLogger);

// Public routes
app.use(healthRouter);       // GET /health
app.use('/api', healthRouter); // GET /api/health

// API routes
app.use('/api', agentsRouter);
app.use('/api', knowledgeRouter);
app.use('/api', settingsRouter);
app.use('/api', runsRouter);
app.use('/api', activityRouter);
app.use('/api', skillsRouter);
app.use('/api', categoriesRouter);
app.use('/api', integrationsRouter);

// Must come last: 404 for anything unmatched, then the single error handler.
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});

export default app;
