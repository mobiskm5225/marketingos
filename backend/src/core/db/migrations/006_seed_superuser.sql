-- Migration 006: seed default superuser
-- Username: superuser | Password: Admin@123
-- Change password immediately after first login.

INSERT INTO users (id, username, password_hash, email, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'superuser',
  '$2b$10$KM6TLw9bCayUS4h0jIfDwOJ3q9aLDMU6oEeLBzEroov9fO8Nix.Gu',
  'admin@acefone.com',
  true
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_groups (user_id, group_id, group_role)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  g.id,
  'manager'
FROM groups g
WHERE g.name = 'admins'
ON CONFLICT (user_id, group_id) DO NOTHING;
