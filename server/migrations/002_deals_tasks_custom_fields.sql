-- Custom field definitions (admin-managed)
CREATE TABLE IF NOT EXISTS custom_field_defs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL UNIQUE,
  label       VARCHAR(255) NOT NULL,
  field_type  VARCHAR(50)  NOT NULL DEFAULT 'text',
  options     JSONB        DEFAULT '[]',
  required    BOOLEAN      DEFAULT FALSE,
  position    INTEGER      DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Add custom_fields column to contacts (safe if already exists)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Deals (multiple opportunities per contact)
CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title           VARCHAR(500) NOT NULL,
  value           INTEGER DEFAULT 0,
  stage           VARCHAR(50) DEFAULT 'prospect',
  expected_close  DATE,
  owner_id        UUID REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (linked to contacts, assignable to users)
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title         VARCHAR(500) NOT NULL,
  due_date      DATE,
  assigned_to   UUID REFERENCES users(id),
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
