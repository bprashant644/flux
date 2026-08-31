-- Backfill: give every pre-existing user a membership row so `memberships` is a complete
-- source of truth going forward, without touching users.role/hr_role/manager_id yet —
-- routes still read those directly until the auth-cutover phase migrates the call sites.
-- On a fresh DB (no users yet, e.g. Supabase pre-signup) this is a no-op past the org insert.

INSERT INTO organizations (name)
SELECT 'Default Organization'
WHERE NOT EXISTS (SELECT 1 FROM organizations)
  AND EXISTS (SELECT 1 FROM users);

INSERT INTO memberships (org_id, user_id, role, hr_role)
SELECT (SELECT id FROM organizations ORDER BY created_at LIMIT 1), u.id, u.role, u.hr_role
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id);
