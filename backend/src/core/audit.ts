import { db } from './db';
import { auditLogs } from './db/schema';
import log from '../logger';

export async function logAudit(
  userId: string | null,
  username: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId:     userId ?? undefined,
      username,
      action,
      entityType: entityType ?? undefined,
      entityId:   entityId ?? undefined,
      metadata:   metadata ? JSON.stringify(metadata) : undefined,
    });
  } catch (err: any) {
    log.error({ err: err.message, action }, 'Audit log write failed');
  }
}
