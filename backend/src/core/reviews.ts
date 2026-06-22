import { db } from './db';
import { jobReviews } from './db/schema';
import { AGENT_REVIEW_GROUP } from '../routes/reviews';
import log from '../logger';

export async function createReviewForJob(jobId: string, agentName: string): Promise<void> {
  const groupName = AGENT_REVIEW_GROUP[agentName];
  if (!groupName) return;

  try {
    await db.insert(jobReviews).values({
      jobId,
      groupName,
      status: 'pending_review',
    });
  } catch (err: any) {
    log.error({ jobId, agentName, err: err.message }, 'Failed to create review record');
  }
}
