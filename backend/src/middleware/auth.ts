import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifyNotionSignature(rawBody: Buffer, header: string): boolean {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) return true;

  let sig = header;
  if (header.includes(',')) sig = header.split(',')[1];

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
}

export function ingestAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.INGEST_SECRET;
  if (!secret) { next(); return; }

  const provided = req.headers['x-ingest-secret'];
  if (provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
