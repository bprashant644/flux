-- HR Module: extend users, employee profiles, leave, attendance, documents, payroll

ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_role VARCHAR(20)
  CHECK (hr_role IN ('hr_admin','manager','employee'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS employee_profiles (
  user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_id             VARCHAR(50),
  department              VARCHAR(100),
  designation             VARCHAR(100),
  joining_date            DATE,
  date_of_birth           DATE,
  phone                   VARCHAR(50),
  address                 TEXT,
  emergency_contact_name  VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  pan_number              VARCHAR(20),
  bank_account_number     VARCHAR(50),
  bank_ifsc               VARCHAR(20),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_types (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) UNIQUE NOT NULL,
  days_per_year  INTEGER NOT NULL DEFAULT 0,
  carry_forward  BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO leave_types (name, days_per_year, carry_forward) VALUES
  ('Casual Leave',  12, FALSE),
  ('Sick Leave',    12, FALSE),
  ('Annual Leave',  15, TRUE)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS leave_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id   UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  allocated_days  NUMERIC(5,1) NOT NULL DEFAULT 0,
  UNIQUE(user_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id    UUID REFERENCES leave_types(id),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  days             NUMERIC(4,1) NOT NULL,
  reason           TEXT,
  status           VARCHAR(20) DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      VARCHAR(20) NOT NULL
              CHECK (status IN ('present','absent','wfh','half_day','leave')),
  marked_by   UUID REFERENCES users(id),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS hr_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  version      VARCHAR(50) DEFAULT '1.0',
  is_mandatory BOOLEAN DEFAULT FALSE,
  body         TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_document_acks (
  document_id     UUID REFERENCES hr_documents(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(document_id, user_id)
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  ctc_annual     INTEGER NOT NULL,
  components     JSONB NOT NULL DEFAULT '{}',
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_slips (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  month        VARCHAR(7) NOT NULL,
  gross        INTEGER NOT NULL,
  deductions   JSONB NOT NULL DEFAULT '{}',
  net          INTEGER NOT NULL,
  components   JSONB NOT NULL DEFAULT '{}',
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS profile_change_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  field_name       VARCHAR(50) NOT NULL
                   CHECK (field_name IN ('pan_number','bank_account_number','bank_ifsc')),
  old_value        TEXT,
  new_value        TEXT NOT NULL,
  status           VARCHAR(20) DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  requested_at     TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT
);
