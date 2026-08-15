import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { httpLogger } from './middleware/logger';
import healthRouter from './routes/health';
import agentsRouter from './routes/agents';
import knowledgeRouter from './routes/knowledge';
import settingsRouter from './routes/settings';
import runsRouter from './routes/runs';
import activityRouter from './routes/activity';
import log from './logger';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(helmet({ contentSecurityPolicy: false }));

// Parse JSON and capture raw body in one pass.
// 4mb limit: logo upload sends base64 image in the JSON body.
app.use(express.json({
  limit: '4mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));
app.use(httpLogger);

// Public routes
app.use(healthRouter);       // GET /health

// API routes
app.use('/api', agentsRouter);
app.use('/api', knowledgeRouter);
app.use('/api', settingsRouter);
app.use('/api', runsRouter);
app.use('/api', activityRouter);

app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});

export default app;
