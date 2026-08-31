-- Multi-tenancy foundation: organizations + memberships, org_id on every tenant table.
-- org_id is left NULLable here on purpose — backfilling real orgs happens during the
-- Supabase data migration phase, not in this schema-only pass. No NOT NULL yet.

CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) CHECK (role IN ('admin', 'rep')),
  hr_role    VARCHAR(20) CHECK (hr_role IN ('hr_admin', 'manager', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contacts', 'deals', 'tasks', 'projects', 'project_milestones', 'project_items',
    'activity', 'custom_field_defs', 'daily_focus',
    'employee_profiles', 'leave_requests', 'leave_balances', 'leave_types',
    'attendance_logs', 'holidays', 'hr_documents', 'hr_document_acks',
    'salary_structures', 'salary_slips', 'profile_change_requests'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id)',
      t
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_org_id ON %I (org_id)',
      t, t
    );
  END LOOP;
END $$;
