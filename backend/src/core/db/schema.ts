import { pgTable, uuid, varchar, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Agents ───────────────────────────────────────────────────────────────────

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // e.g. "atlas"
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'active', 'draft', 'paused'
  icon: varchar('icon', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  skills: jsonb('skills').default('[]').notNull(), // string[]
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// ─── Knowledge Bases ──────────────────────────────────────────────────────────

export const knowledgeBases = pgTable('knowledge_bases', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  docsCount: integer('docs_count').default(0).notNull(),
  chunksCount: integer('chunks_count').default(0).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// Join table for many-to-many relationship between Agents and Knowledge Bases
export const agentKnowledgeBases = pgTable('agent_knowledge_bases', {
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  kbId: uuid('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }).notNull(),
});

// ─── Integrations & Models ────────────────────────────────────────────────────

export const modelProviders = pgTable('model_providers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  kind: varchar('kind', { length: 50 }).notNull(),
  models: jsonb('models').default('[]').notNull(), // string[]
  status: varchar('status', { length: 20 }).notNull(), // 'connected', 'available'
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  blurb: text('blurb').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'connected', 'available'
  detail: text('detail').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// ─── Runs & Activity ──────────────────────────────────────────────────────────

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // e.g. "run-2041"
  title: text('title').notNull(),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'complete', 'running', 'needs review'
  startedAt: timestamp('started_at', { withTimezone: true }).default(sql`now()`).notNull(),
  duration: varchar('duration', { length: 50 }).notNull(), // e.g. "3m 41s"
  model: varchar('model', { length: 100 }).notNull(),
  summary: text('summary').notNull(),
  
  // JSONB arrays to match frontend expectations
  metrics: jsonb('metrics').default('[]').notNull(),
  sections: jsonb('sections').default('[]').notNull(),
  sources: jsonb('sources').default('[]').notNull(),
  attachments: jsonb('attachments').default('[]').notNull(),
  comments: jsonb('comments').default('[]').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});
