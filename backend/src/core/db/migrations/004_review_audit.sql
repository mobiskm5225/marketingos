-- Add group_role to user_groups (manager | member)
ALTER TABLE user_groups ADD COLUMN IF NOT EXISTS group_role VARCHAR(20) NOT NULL DEFAULT 'member';

-- Audit log — append-only, never deleted
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  username    VARCHAR(50) NOT NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_logs (entity_type, entity_id);

-- Job reviews — one record per job, updated as it moves through states
-- statuses: pending_review | under_review | reviewed | approved | rejected | needs_changes
CREATE TABLE IF NOT EXISTS job_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
  group_name    VARCHAR(50) NOT NULL,
  status        VARCHAR(30) NOT NULL DEFAULT 'pending_review',
  reviewer_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(50),
  review_note   TEXT,
  reviewed_at   TIMESTAMPTZ,
  lead_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  lead_name     VARCHAR(50),
  lead_comment  TEXT,
  decided_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_reviews_job_id ON job_reviews (job_id);
CREATE INDEX IF NOT EXISTS idx_job_reviews_status        ON job_reviews (status);
CREATE INDEX IF NOT EXISTS idx_job_reviews_group         ON job_reviews (group_name, status);

-- New permissions
INSERT INTO permissions (name, description) VALUES
  ('jobs:review',  'Claim and submit member review for completed jobs'),
  ('jobs:approve', 'Approve, reject, or request changes on reviewed jobs (manager)'),
  ('admin:audit',  'View system audit log')
ON CONFLICT (name) DO NOTHING;

-- seo-analysts → jobs:review (approve auto-derived from group_role = manager)
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'seo-analysts' AND p.name = 'jobs:review'
ON CONFLICT DO NOTHING;

-- content-team → jobs:review (for future new-blog flow)
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'content-team' AND p.name = 'jobs:review'
ON CONFLICT DO NOTHING;

-- marketing-ops → jobs:review + jobs:approve
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'marketing-ops'
    AND p.name IN ('jobs:review', 'jobs:approve')
ON CONFLICT DO NOTHING;

-- admins already have * wildcard
