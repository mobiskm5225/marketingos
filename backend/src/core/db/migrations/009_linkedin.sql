-- Migration 009: LinkedIn creatives pipeline
-- Posts arrive from Claude routines via /ingest/linkedin; the linkedin-creatives
-- agent generates image variations per post.

CREATE TABLE IF NOT EXISTS linkedin_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  content     TEXT NOT NULL,
  source      VARCHAR(100) DEFAULT 'claude-routine',
  status      VARCHAR(30)  NOT NULL DEFAULT 'pending',   -- pending | generating | done | error
  error_message TEXT,
  last_job_id UUID REFERENCES agent_jobs(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS linkedin_creatives (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES linkedin_posts(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES agent_jobs(id) ON DELETE SET NULL,
  variant     INTEGER NOT NULL DEFAULT 1,
  concept     TEXT,                                       -- creative angle / hook
  image_prompt TEXT,                                      -- prompt sent to the image model
  caption     TEXT,                                       -- suggested post caption
  image_b64   TEXT,                                       -- PNG, base64
  cost_usd    DECIMAL(10,6),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS linkedin_posts_status_idx     ON linkedin_posts(status);
CREATE INDEX IF NOT EXISTS linkedin_posts_created_idx    ON linkedin_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS linkedin_creatives_post_idx   ON linkedin_creatives(post_id);
