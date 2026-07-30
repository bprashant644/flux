-- Add a Medium tier to importance/urgency: 0=Low, 1=Medium, 2=High, NULL=unclassified
-- Existing "High" (1) rows must become 2 *before* the constraint is widened, so the
-- old binary meaning of 1 doesn't silently turn into "Medium". Guarded so this remap
-- only fires once (migrations re-run on every server start) — once the check constraint
-- has been widened to allow 2, the old-constraint text no longer matches and it's skipped.
DO $$
DECLARE
  needs_remap boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_items_importance_check'
      AND pg_get_constraintdef(oid) = 'CHECK ((importance = ANY (ARRAY[0, 1])))'
  ) INTO needs_remap;

  IF needs_remap THEN
    ALTER TABLE project_items DROP CONSTRAINT project_items_importance_check;
    ALTER TABLE project_items DROP CONSTRAINT project_items_urgency_check;
    UPDATE project_items SET importance = 2 WHERE importance = 1;
    UPDATE project_items SET urgency    = 2 WHERE urgency    = 1;
  END IF;
END $$;

ALTER TABLE project_items DROP CONSTRAINT IF EXISTS project_items_importance_check;
ALTER TABLE project_items ADD CONSTRAINT project_items_importance_check
  CHECK (importance IN (0,1,2));

ALTER TABLE project_items DROP CONSTRAINT IF EXISTS project_items_urgency_check;
ALTER TABLE project_items ADD CONSTRAINT project_items_urgency_check
  CHECK (urgency IN (0,1,2));
