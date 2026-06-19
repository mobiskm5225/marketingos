import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from '../src/core/db';

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../src/core/db/migrations/001_init.sql'),
    'utf8'
  );
  console.log('Running migration...');
  await pool.query(sql);
  console.log('Migration complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
