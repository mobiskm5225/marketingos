import 'dotenv/config';
import express from 'express';
import { httpLogger } from './middleware/logger';
import healthRouter from './routes/health';
import webhookRouter from './routes/webhook';
import ingestRouter from './routes/ingest';
import jobsRouter from './routes/jobs';
import agentsRouter from './routes/agents';
import log from './logger';

const app = express();
const PORT = process.env.PORT ?? 8000;

// Capture raw body for HMAC verification before JSON parsing
app.use((req, _res, next) => {
  let data = Buffer.alloc(0);
  req.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
  req.on('end', () => {
    (req as any).rawBody = data;
    next();
  });
});

app.use(express.json());
app.use(httpLogger);

app.use(healthRouter);
app.use(webhookRouter);
app.use(ingestRouter);
app.use('/api', jobsRouter);
app.use('/api', agentsRouter);

app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});

export default app;
