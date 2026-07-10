// CLI: pull all pages from the Notion Blog Tracker into blog_drafts.
// Same logic as POST /api/blog-drafts/sync. Idempotent.
//   npx tsx scripts/sync-blog-tracker.ts
import 'dotenv/config';
import { syncBlogTracker } from '../src/core/blog-tracker-sync';
import { pool } from '../src/core/db';

syncBlogTracker()
  .then(result => {
    console.log('Sync result:', result);
    return pool.end();
  })
  .catch(err => {
    console.error('Sync failed:', err.message);
    process.exit(1);
  });
