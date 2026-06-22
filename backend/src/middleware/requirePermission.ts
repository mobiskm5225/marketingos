import { Request, Response, NextFunction } from 'express';

export function requirePermission(perm: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const perms = req.user?.permissions ?? [];
    if (perms.includes('*') || perms.includes(perm)) {
      next();
      return;
    }
    res.status(403).json({ error: 'Forbidden — insufficient permissions' });
  };
}
