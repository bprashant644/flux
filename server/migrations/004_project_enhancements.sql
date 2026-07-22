-- Follow-up items: who the follow-up is with (CRM contact) + recurrence
ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS followup_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence          VARCHAR(50) DEFAULT 'none';

-- Project-level notes/context scratchpad
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS notes TEXT;
