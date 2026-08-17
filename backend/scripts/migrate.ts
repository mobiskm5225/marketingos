import 'dotenv/config';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { pool } from '../src/core/db';

// Drizzle's migrator reads migrations/meta/_journal.json and records what it has
// applied in a __drizzle_migrations table, so re-running is safe and partial
// migration sets resume correctly. Do not replace this with a raw glob over
// *.sql — the generated files are not idempotent.
async function main() {
  const db = drizzle(pool);

  // pgvector backs chunk and fact embeddings. The extension has to exist before
  // any migration declares a vector column.
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);

  await migrate(db, {
    migrationsFolder: path.join(__dirname, '../src/core/db/migrations'),
  });

  console.log('Migration complete.');
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  });
