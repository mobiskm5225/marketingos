import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  vector,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Categories ───────────────────────────────────────────────────────────────
//
// One shared vocabulary for agents and skills. Both reference it by slug, so
// "pick an agent category, get suggested skills" is an exact match rather than
// a fuzzy comparison of two free-text fields that drift apart.

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// ─── Skills library ───────────────────────────────────────────────────────────
//
// A skill is an authored markdown document (a SKILL.md), not a tag. `bodyMd`
// holds the file verbatim so skills round-trip with the user's existing corpus
// and with git; `frontmatter` is the parsed YAML header, mirrored into `name`
// and `description` so the library is searchable without reparsing.

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description').notNull().default(''),
    // References categories.slug. Kept as a slug rather than an FK id so an
    // import can set it before the category row is looked up.
    category: varchar('category', { length: 100 }),
    bodyMd: text('body_md').notNull(),
    frontmatter: jsonb('frontmatter').default('{}').notNull(),
    // Where it came from: 'manual' | 'folder' | 'github'
    source: varchar('source', { length: 20 }).notNull().default('manual'),
    sourceRef: text('source_ref'), // repo URL or import path
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('skills_category_idx').on(t.category)],
);

// ─── Agents ───────────────────────────────────────────────────────────────────
//
// An agent is an orchestrator over skills, not a single prompt. `defaultModel`
// is the fallback every stage inherits unless it overrides it — that is what
// lets one agent run cheap local inference for research stages and a paid API
// for the final action stage.

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'active' | 'draft' | 'paused'
  icon: varchar('icon', { length: 50 }).notNull().default('Bot'),
  // Same vocabulary as skills.category — drives skill suggestions in the builder.
  category: varchar('category', { length: 100 }),

  // The AGENT.md source, kept verbatim for round-tripping and re-export.
  agentMd: text('agent_md'),
  // "What this agent CANNOT do" — negative constraints carried into every prompt.
  guardrails: text('guardrails'),

  defaultProviderId: uuid('default_provider_id').references(() => modelProviders.id, {
    onDelete: 'set null',
  }),
  defaultModel: varchar('default_model', { length: 100 }),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).default('0.4'),
  maxTokens: integer('max_tokens').default(4096),

  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// One stage = one use of a library skill inside one agent's pipeline.
//
// `dependsOn` holds other agent_stages ids. Storing the DAG as data (rather than
// parsing "needs 3+6+7" out of prose at runtime) is what makes execution order,
// parallel groups and the visual map reliable. Cycles are rejected on write.
//
// `bodyOverride` exists because the same library skill legitimately differs
// between agents — e.g. gather-context is not identical across two pipelines.
// When set, it is used instead of skills.bodyMd for this agent only.
export const agentStages = pgTable(
  'agent_stages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: uuid('agent_id')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    skillId: uuid('skill_id')
      .references(() => skills.id, { onDelete: 'restrict' })
      .notNull(),
    position: integer('position').notNull(),
    dependsOn: uuid('depends_on').array().default(sql`'{}'::uuid[]`).notNull(),

    // A gate does not just fail — it names the stage that must redo work.
    isGate: boolean('is_gate').default(false).notNull(),

    // NULL on both = inherit the agent's default. This is the per-layer routing.
    providerId: uuid('provider_id').references(() => modelProviders.id, { onDelete: 'set null' }),
    model: varchar('model', { length: 100 }),

    bodyOverride: text('body_override'),
    config: jsonb('config').default('{}').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('agent_stages_agent_idx').on(t.agentId, t.position)],
);

// Small curated documents injected into every prompt for this agent. Distinct
// from knowledge bases, which are large corpora retrieved from by similarity.
export const agentReferences = pgTable(
  'agent_references',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: uuid('agent_id')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    bodyMd: text('body_md').notNull(),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('agent_references_agent_idx').on(t.agentId)],
);

// Typed per-run inputs, e.g. a design PDF path plus a page name. Drives both the
// run form and server-side validation of POST /api/agents/:slug/run.
export const agentInputs = pgTable(
  'agent_inputs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    agentId: uuid('agent_id')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    label: varchar('label', { length: 200 }).notNull(),
    // 'text' | 'textarea' | 'file' | 'url' | 'select'
    type: varchar('type', { length: 20 }).notNull().default('text'),
    required: boolean('required').default(true).notNull(),
    placeholder: text('placeholder'),
    options: jsonb('options').default('[]').notNull(),
    position: integer('position').default(0).notNull(),
  },
  (t) => [index('agent_inputs_agent_idx').on(t.agentId)],
);

// ─── Knowledge bases ──────────────────────────────────────────────────────────
//
// `type` IS the memory layer: 'Raw corpus' | 'Curated notes' | 'Distilled memory'.
// Doc and chunk counts are derived with aggregates, never stored as counters.

export const knowledgeBases = pgTable('knowledge_bases', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull().default('FileText'),
  integrationId: uuid('integration_id').references(() => integrations.id, { onDelete: 'set null' }),
  config: jsonb('config').default('{}').notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const agentKnowledgeBases = pgTable(
  'agent_knowledge_bases',
  {
    agentId: uuid('agent_id')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    kbId: uuid('kb_id')
      .references(() => knowledgeBases.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.agentId, t.kbId] })],
);

// Layer 1 — raw context, exactly as it arrived.
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    kbId: uuid('kb_id')
      .references(() => knowledgeBases.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    sourceType: varchar('source_type', { length: 30 }).notNull(), // upload | notion | obsidian | web
    sourceRef: text('source_ref'),
    mimeType: varchar('mime_type', { length: 100 }),
    sizeBytes: integer('size_bytes'),
    content: text('content'),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending|indexed|error
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('documents_kb_idx').on(t.kbId)],
);

export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    documentId: uuid('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    kbId: uuid('kb_id')
      .references(() => knowledgeBases.id, { onDelete: 'cascade' })
      .notNull(),
    ordinal: integer('ordinal').notNull(),
    content: text('content').notNull(),
    tokenCount: integer('token_count'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [
    index('chunks_kb_idx').on(t.kbId),
    index('chunks_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  ],
);

// Layer 2 — an agent-written summary per document, refreshed on every sync.
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    documentId: uuid('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    kbId: uuid('kb_id')
      .references(() => knowledgeBases.id, { onDelete: 'cascade' })
      .notNull(),
    summary: text('summary').notNull(),
    refreshedAt: timestamp('refreshed_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('notes_kb_idx').on(t.kbId)],
);

// Layer 3 — deduped, conflict-checked statements. `supersededBy` retires a fact
// that a newer, contradicting one replaced, rather than deleting the history.
export const facts = pgTable(
  'facts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    kbId: uuid('kb_id')
      .references(() => knowledgeBases.id, { onDelete: 'cascade' })
      .notNull(),
    statement: text('statement').notNull(),
    confidence: numeric('confidence', { precision: 3, scale: 2 }).default('0.5').notNull(),
    sourceNoteIds: jsonb('source_note_ids').default('[]').notNull(),
    supersededBy: uuid('superseded_by'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [
    index('facts_kb_idx').on(t.kbId),
    index('facts_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  ],
);

// Layer 4 — always-in-prompt essentials.
export const coreMemory = pgTable('core_memory', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  kbId: uuid('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 200 }).notNull(),
  value: text('value').notNull(),
  pinned: boolean('pinned').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const distillationRuns = pgTable('distillation_runs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  kbId: uuid('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  factsAdded: integer('facts_added').default(0).notNull(),
  conflictsResolved: integer('conflicts_resolved').default(0).notNull(),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).default(sql`now()`).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

// ─── Providers, integrations, settings ────────────────────────────────────────

export const modelProviders = pgTable('model_providers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  kind: varchar('kind', { length: 50 }).notNull(), // 'Hosted API' | 'Open source'
  models: jsonb('models').default('[]').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'connected' | 'available'
  note: text('note').notNull(),
  // AES-256-GCM ciphertext. Never returned by any endpoint — only whether it is set.
  apiKeyEnc: text('api_key_enc'),
  baseUrl: text('base_url'),
  defaultModel: varchar('default_model', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  blurb: text('blurb').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  detail: text('detail').notNull(),
  config: jsonb('config').default('{}').notNull(),
  credentialsEnc: text('credentials_enc'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});

// ─── Runs ─────────────────────────────────────────────────────────────────────
//
// This table doubles as the job queue: the worker claims `pending` rows with
// FOR UPDATE SKIP LOCKED, so it stays correct if a second process is added.

export const runs = pgTable(
  'runs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    title: text('title').notNull(),
    agentId: uuid('agent_id')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    // 'pending' | 'running' | 'complete' | 'needs review' | 'error'
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    input: jsonb('input').default('{}').notNull(),
    summary: text('summary').default('').notNull(),

    // Generated output. Kept as jsonb because it is rendered whole and never
    // queried by field, which lets any agent's output render without special-casing.
    metrics: jsonb('metrics').default('[]').notNull(),
    sections: jsonb('sections').default('[]').notNull(),
    sources: jsonb('sources').default('[]').notNull(),

    model: varchar('model', { length: 100 }),
    inputTokens: integer('input_tokens').default(0).notNull(),
    outputTokens: integer('output_tokens').default(0).notNull(),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).default('0').notNull(),

    error: text('error'),
    parentRunId: uuid('parent_run_id'), // set when re-running with edits

    startedAt: timestamp('started_at', { withTimezone: true }).default(sql`now()`).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('runs_status_idx').on(t.status, t.createdAt)],
);

// One row per stage execution. `model` records what the stage actually resolved
// to after the override/default chain, which is how per-layer routing is audited.
export const runStages = pgTable(
  'run_stages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .references(() => runs.id, { onDelete: 'cascade' })
      .notNull(),
    agentStageId: uuid('agent_stage_id').references(() => agentStages.id, { onDelete: 'set null' }),
    position: integer('position').notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    attempt: integer('attempt').default(1).notNull(),
    model: varchar('model', { length: 100 }),
    inputTokens: integer('input_tokens').default(0).notNull(),
    outputTokens: integer('output_tokens').default(0).notNull(),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).default('0').notNull(),
    output: jsonb('output'),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [index('run_stages_run_idx').on(t.runId, t.position)],
);

export const runArtifacts = pgTable(
  'run_artifacts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .references(() => runs.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    mimeType: varchar('mime_type', { length: 100 }),
    sizeBytes: integer('size_bytes'),
    storagePath: text('storage_path').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('run_artifacts_run_idx').on(t.runId)],
);

export const runComments = pgTable(
  'run_comments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .references(() => runs.id, { onDelete: 'cascade' })
      .notNull(),
    author: varchar('author', { length: 100 }).notNull(),
    initials: varchar('initials', { length: 4 }).notNull(),
    body: text('body').notNull(),
    anchor: text('anchor'), // ties a comment to a section heading
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('run_comments_run_idx').on(t.runId)],
);

export const runAttachments = pgTable(
  'run_attachments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .references(() => runs.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    kind: varchar('kind', { length: 20 }).notNull(), // image | pdf | doc
    sizeBytes: integer('size_bytes'),
    storagePath: text('storage_path').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('run_attachments_run_idx').on(t.runId)],
);

export const runEvents = pgTable(
  'run_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .references(() => runs.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 30 }).notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (t) => [index('run_events_run_idx').on(t.runId, t.createdAt)],
);

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
});
