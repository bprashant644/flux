-- Retrospective for completed/archived projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS retro JSONB;

-- Commitment tracking: flag an item as "committed this week"
ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS committed     BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS committed_at  TIMESTAMPTZ;
