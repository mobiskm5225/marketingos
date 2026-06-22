import { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — token required' });
    return;
  }
  try {
    req.user = verifyToken(auth.slice(7));
    next();
  } catch (err: any) {
    res.status(401).json({ error: err.message ?? 'Invalid token' });
  }
}
