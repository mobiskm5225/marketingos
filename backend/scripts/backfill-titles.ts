// One-off: backfill agent_jobs.title from Notion for jobs created before
// titles were stored. Safe to re-run — only touches rows with empty titles.
//   npx tsx scripts/backfill-titles.ts
import 'dotenv/config';
import { isNull, or, eq, and, isNotNull } from 'drizzle-orm';
import { db, pool } from '../src/core/db';
import { agentJobs } from '../src/core/db/schema';
import { getPageTitle } from '../src/core/notion/reader';

async function main() {
  const rows = await db
    .select({ id: agentJobs.id, notionPageId: agentJobs.notionPageId })
    .from(agentJobs)
    .where(and(
      or(isNull(agentJobs.title), eq(agentJobs.title, '')),
      isNotNull(agentJobs.notionPageId),
    ));

  console.log(`${rows.length} jobs with missing titles`);
  let fixed = 0, failed = 0;

  for (const row of rows) {
    try {
      const title = await getPageTitle(row.notionPageId!);
      if (title) {
        await db.update(agentJobs).set({ title }).where(eq(agentJobs.id, row.id));
        console.log(`  ✓ ${row.id} → ${title.slice(0, 60)}`);
        fixed++;
      } else {
        console.log(`  - ${row.id} → page has no title`);
        failed++;
      }
    } catch (err: any) {
      console.log(`  ✗ ${row.id} → ${err.message}`);
      failed++;
    }
  }

  console.log(`Done: ${fixed} fixed, ${failed} unresolved`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
