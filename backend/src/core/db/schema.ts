import { pgTable, uuid, varchar, text, integer, decimal, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const agentJobs = pgTable('agent_jobs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  agentName: varchar('agent_name', { length: 50 }).notNull(),
  notionPageId: varchar('notion_page_id', { length: 50 }),
  title: text('title'),
  status: varchar('status', { length: 20 }).notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),
  errorMessage: text('error_message'),
  source: varchar('source', { length: 30 }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

export const agentResults = pgTable('agent_results', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid('job_id').references(() => agentJobs.id),
  resultType: varchar('result_type', { length: 50 }),
  content: text('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

export const kbCache = pgTable('kb_cache', {
  kbKey: varchar('kb_key', { length: 100 }).primaryKey(),
  content: text('content'),
  cachedAt: timestamp('cached_at', { withTimezone: true }).default(sql`now()`),
  ttlSeconds: integer('ttl_seconds').default(3600),
});
