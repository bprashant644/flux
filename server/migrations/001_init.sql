CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'rep' CHECK (role IN ('admin', 'rep')),
  color         VARCHAR(7) DEFAULT '#5B5BD6',
  teams_webhook_url TEXT,
  email_digest  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  company        VARCHAR(255),
  title          VARCHAR(255),
  email          VARCHAR(255),
  phone          VARCHAR(100),
  source         VARCHAR(100),
  stage          VARCHAR(50) DEFAULT 'new',
  value          INTEGER DEFAULT 0,
  notes          TEXT,
  owner_id       UUID REFERENCES users(id),
  next_followup  DATE,
  recurrence     VARCHAR(50) DEFAULT 'none',
  last_contacted DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(50),
  text        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlook_tokens (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ
);
