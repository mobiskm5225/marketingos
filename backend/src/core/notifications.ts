import { db } from './db';
import { notifications } from './db/schema';
import log from '../logger';

export type NotificationType = 'job_done' | 'job_error' | 'job_started' | 'system';

export async function createNotification(
  type: NotificationType,
  title: string,
  message?: string,
  jobId?: string,
): Promise<void> {
  try {
    await db.insert(notifications).values({ type, title, message, jobId });
  } catch (err: any) {
    log.warn({ err: err.message }, 'Failed to create notification — non-fatal');
  }
}
