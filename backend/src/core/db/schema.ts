import { pgTable, uuid, varchar, text, integer, decimal, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';
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

// ─── RBAC tables ─────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  username:     varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  email:        varchar('email', { length: 100 }),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const groups = pgTable('groups', {
  id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:        varchar('name', { length: 50 }).unique().notNull(),
  description: text('description'),
  createdAt:   timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const permissions = pgTable('permissions', {
  id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:        varchar('name', { length: 100 }).unique().notNull(),
  description: text('description'),
});

export const groupPermissions = pgTable('group_permissions', {
  groupId:      uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, t => ({ pk: primaryKey({ columns: [t.groupId, t.permissionId] }) }));

export const userGroups = pgTable('user_groups', {
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId:   uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  groupRole: varchar('group_role', { length: 20 }).notNull().default('member'),
}, t => ({ pk: primaryKey({ columns: [t.userId, t.groupId] }) }));

// ─── Audit + Review ──────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId:     uuid('user_id'),
  username:   varchar('username', { length: 50 }).notNull(),
  action:     varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId:   uuid('entity_id'),
  metadata:   text('metadata'),
  createdAt:  timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const jobReviews = pgTable('job_reviews', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  jobId:        uuid('job_id').notNull().references(() => agentJobs.id, { onDelete: 'cascade' }),
  groupName:    varchar('group_name', { length: 50 }).notNull(),
  status:       varchar('status', { length: 30 }).notNull().default('pending_review'),
  reviewerId:   uuid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  reviewerName: varchar('reviewer_name', { length: 50 }),
  reviewNote:   text('review_note'),
  reviewedAt:   timestamp('reviewed_at', { withTimezone: true }),
  leadId:       uuid('lead_id').references(() => users.id, { onDelete: 'set null' }),
  leadName:     varchar('lead_name', { length: 50 }),
  leadComment:  text('lead_comment'),
  decidedAt:    timestamp('decided_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// ─── Blog Drafts ─────────────────────────────────────────────────────────────

export const blogDrafts = pgTable('blog_drafts', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title:        text('title').notNull(),
  content:      text('content'),
  url:          text('url'),
  source:       varchar('source', { length: 100 }).default('api'),
  status:       varchar('status', { length: 30 }).notNull().default('pending'),
  reviewerId:   uuid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  reviewerName: varchar('reviewer_name', { length: 50 }),
  reviewNote:   text('review_note'),
  reviewedAt:   timestamp('reviewed_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  type:      varchar('type', { length: 30 }).notNull(),   // job_done | job_error | job_started | system
  title:     text('title').notNull(),
  message:   text('message'),
  jobId:     uuid('job_id').references(() => agentJobs.id, { onDelete: 'cascade' }),
  read:      boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});
