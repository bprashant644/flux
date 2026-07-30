-- Leave Calendar: company holidays + per-leave-type carry-forward cap

CREATE TABLE IF NOT EXISTS holidays (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  name        VARCHAR(200) NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS max_carry_forward_days NUMERIC(5,1) NOT NULL DEFAULT 0;
