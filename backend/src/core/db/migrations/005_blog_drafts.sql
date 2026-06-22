-- Migration 005: Blog drafts table for content-team new blog review workflow

CREATE TABLE IF NOT EXISTS blog_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  content      TEXT,
  url          TEXT,
  source       VARCHAR(100) DEFAULT 'api',
  status       VARCHAR(30)  NOT NULL DEFAULT 'pending',
  reviewer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(50),
  review_note  TEXT,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blog_drafts_status_idx    ON blog_drafts(status);
CREATE INDEX IF NOT EXISTS blog_drafts_created_idx   ON blog_drafts(created_at DESC);

-- New permission
INSERT INTO permissions (name, description)
VALUES ('blog-drafts:manage', 'View and review new blog drafts submitted by Go routines')
ON CONFLICT (name) DO NOTHING;

-- Assign to content-team
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM groups g
JOIN permissions p ON p.name = 'blog-drafts:manage'
WHERE g.name = 'content-team'
ON CONFLICT DO NOTHING;
