CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email         VARCHAR(100),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS group_permissions (
  group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_groups (
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

-- Seed groups
INSERT INTO groups (name, description) VALUES
  ('admins',        'Full access — user management, all agents, system config'),
  ('marketing-ops', 'All agents, full job visibility, manage notifications'),
  ('seo-analysts',  'SEO Analyzer only, view jobs/stats, manage notifications'),
  ('content-team',  'Existing Blog Reviewer only, view jobs/stats, manage notifications'),
  ('viewers',       'Read-only — jobs and stats, no agent triggers')
ON CONFLICT (name) DO NOTHING;

-- Seed permissions
INSERT INTO permissions (name, description) VALUES
  ('jobs:read',                    'View job list, job detail, stats dashboard'),
  ('agents:trigger:seo-analyzer',  'Trigger SEO Analyzer agent'),
  ('agents:trigger:blog-reviewer', 'Trigger Existing Blog Reviewer agent'),
  ('notifications:manage',         'Read, mark, dismiss, and clear notifications'),
  ('admin:users',                  'Create, deactivate, and assign groups to users'),
  ('admin:groups',                 'View group definitions and their permissions'),
  ('*',                            'Wildcard — all permissions (admins only)')
ON CONFLICT (name) DO NOTHING;

-- admins → wildcard
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'admins' AND p.name = '*'
ON CONFLICT DO NOTHING;

-- marketing-ops
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'marketing-ops'
    AND p.name IN ('jobs:read', 'agents:trigger:seo-analyzer', 'agents:trigger:blog-reviewer', 'notifications:manage')
ON CONFLICT DO NOTHING;

-- seo-analysts
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'seo-analysts'
    AND p.name IN ('jobs:read', 'agents:trigger:seo-analyzer', 'notifications:manage')
ON CONFLICT DO NOTHING;

-- content-team
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'content-team'
    AND p.name IN ('jobs:read', 'agents:trigger:blog-reviewer', 'notifications:manage')
ON CONFLICT DO NOTHING;

-- viewers
INSERT INTO group_permissions (group_id, permission_id)
  SELECT g.id, p.id FROM groups g, permissions p
  WHERE g.name = 'viewers' AND p.name = 'jobs:read'
ON CONFLICT DO NOTHING;
