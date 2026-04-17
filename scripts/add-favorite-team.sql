-- ============================================================
-- Add favorite_team_id column to app_users
-- Run once in the Supabase SQL Editor.
-- ============================================================

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS favorite_team_id integer REFERENCES teams(id) ON DELETE SET NULL;

-- Optional: create index for joins
CREATE INDEX IF NOT EXISTS idx_app_users_favorite_team ON app_users(favorite_team_id);
