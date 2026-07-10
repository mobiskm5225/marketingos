import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from '../src/core/db';

// Runs every .sql file in migrations/ in filename order. All migrations are
// idempotent (IF NOT EXISTS / ON CONFLICT), so re-running is safe.
async function migrate() {
  const dir = path.join(__dirname, '../src/core/db/migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Running ${file}...`);
    await pool.query(sql);
  }

  console.log(`Migration complete — ${files.length} files applied.`);
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
