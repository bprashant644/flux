CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  color       VARCHAR(7)  DEFAULT '#5B5BD6',
  owner_id    UUID REFERENCES users(id)    ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id)    NOT NULL,
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id     UUID REFERENCES deals(id)    ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title       VARCHAR(500) NOT NULL,
  due_date    DATE,
  completed   BOOLEAN DEFAULT FALSE,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- section_type: task | context | deliverable | followup
-- importance/urgency: 1=high, 0=low, NULL=unclassified (context always NULL)
-- status by type:
--   task/followup  -> open | done
--   context        -> open
--   deliverable    -> draft | review | approved | delivered
-- doc_type: deliverable only (SoW, Proposal, Report, Spreadsheet, Presentation, Contract, Calculations, Other)
-- sync_to_crm: followup only — completing syncs next_followup on linked contact + logs activity
CREATE TABLE IF NOT EXISTS project_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  section_type VARCHAR(20) NOT NULL CHECK (section_type IN ('task','context','deliverable','followup')),
  title        VARCHAR(500) NOT NULL,
  body         TEXT,
  status       VARCHAR(20) DEFAULT 'open',
  importance   SMALLINT CHECK (importance IN (0,1)),
  urgency      SMALLINT CHECK (urgency IN (0,1)),
  assignee_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date     DATE,
  doc_type     VARCHAR(50),
  sync_to_crm  BOOLEAN DEFAULT FALSE,
  created_by   UUID REFERENCES users(id) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_items_project_id     ON project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
