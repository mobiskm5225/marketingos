import type { ErrorRequestHandler, RequestHandler } from 'express';
import log from '../logger';

/** Thrown by routes that want a specific status instead of a 500. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

/**
 * One place that turns a thrown error into a response. Routes used to each
 * repeat `catch (err) { res.status(500).json({ error: err.message }) }`, which
 * leaked table names and connection details to the client. Full detail is
 * logged; the client gets a generic message unless the route chose the status.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  log.error({ err: err instanceof Error ? err.stack : err }, 'Unhandled request error');
  res.status(500).json({ error: 'Internal server error' });
};
