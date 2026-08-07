UPDATE projects SET tags = array_replace(tags, 'Onboarding', 'PoC / Prospect') WHERE 'Onboarding' = ANY(tags);
UPDATE projects SET tags = array_replace(tags, 'Retainer/Support', 'Support') WHERE 'Retainer/Support' = ANY(tags);
