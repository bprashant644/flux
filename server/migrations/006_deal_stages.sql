-- Expand deal stage options to cover the full funnel
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;
ALTER TABLE deals ADD CONSTRAINT deals_stage_check
  CHECK (stage IN ('prospect','qualified','proposal','negotiation','won','lost'));
