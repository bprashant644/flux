-- Module access control: which app modules each user can access
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS module_access JSONB
  NOT NULL DEFAULT '{"crm":true,"projects":true,"hr":true}'::jsonb;
