-- Update challenges table to add is_active field
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update daily_progress table to match our implementation
ALTER TABLE daily_progress 
DROP COLUMN IF EXISTS tasks_completed,
DROP COLUMN IF EXISTS photos,
DROP COLUMN IF EXISTS completed_at;

ALTER TABLE daily_progress
ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false;

-- Create index for active challenges
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(user_id, is_active) WHERE is_active = true;

-- Update the unique constraint to use proper date comparison
ALTER TABLE daily_progress 
DROP CONSTRAINT IF EXISTS daily_progress_user_id_challenge_id_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_progress_unique 
ON daily_progress(challenge_id, date);

-- Create a function to clean up old date entries (for proper date handling)
CREATE OR REPLACE FUNCTION normalize_date() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.date = NEW.date::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_daily_progress_date
BEFORE INSERT OR UPDATE ON daily_progress
FOR EACH ROW
EXECUTE FUNCTION normalize_date();