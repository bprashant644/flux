-- 012: daily focus plan — per-user, per-day pins on project items
CREATE TABLE IF NOT EXISTS daily_focus (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES project_items(id) ON DELETE CASCADE,
  focus_date DATE NOT NULL DEFAULT CURRENT_DATE,
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_id, focus_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_focus_user_date ON daily_focus (user_id, focus_date);
