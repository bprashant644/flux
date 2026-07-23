-- 011: effort estimates, waiting-on, DoD checklist, context tag
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS effort_size VARCHAR(1) CHECK (effort_size IN ('S','M','L'));
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS effort_hours NUMERIC(5,1);
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS waiting_on VARCHAR(200);
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS waiting_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS waiting_since DATE;
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS checklist JSONB;
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS context_tag VARCHAR(10) CHECK (context_tag IN ('deep','calls','admin'));
CREATE INDEX IF NOT EXISTS idx_project_items_due ON project_items (due_date)
  WHERE due_date IS NOT NULL AND status NOT IN ('done','delivered','approved');
