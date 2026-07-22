-- HR upload support: file attachments for documents + salary slips,
-- document categorisation (company vs employee), and per-employee doc assignment.

ALTER TABLE hr_documents
  ADD COLUMN IF NOT EXISTS doc_category VARCHAR(20) NOT NULL DEFAULT 'company'
    CHECK (doc_category IN ('company','employee')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE salary_slips
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;
