import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifyNotionSignature(rawBody: Buffer, header: string): boolean {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) return true;

  // Notion sends: "v1=<hex>" — extract hex part after "="
  const parts = header.split('=');
  const sig = parts.length >= 2 ? parts.slice(1).join('=') : header;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const eBuf = Buffer.from(expected, 'hex');
  const sBuf = Buffer.from(sig, 'hex');
  if (eBuf.length !== sBuf.length) return false;

  return crypto.timingSafeEqual(eBuf, sBuf);
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
