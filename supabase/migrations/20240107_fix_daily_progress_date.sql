-- Ensure daily_progress has a proper date column
ALTER TABLE daily_progress 
ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_daily_progress_date 
ON daily_progress(challenge_id, date);

-- Drop and recreate the unique constraint with proper columns
ALTER TABLE daily_progress 
DROP CONSTRAINT IF EXISTS idx_daily_progress_unique;

ALTER TABLE daily_progress
ADD CONSTRAINT daily_progress_challenge_date_key 
UNIQUE (challenge_id, date);

-- Ensure the date is always stored as a date (not timestamp)
CREATE OR REPLACE FUNCTION ensure_date_format() 
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure date is stored as date type
  NEW.date = NEW.date::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_daily_progress_date ON daily_progress;
CREATE TRIGGER ensure_daily_progress_date
BEFORE INSERT OR UPDATE ON daily_progress
FOR EACH ROW
EXECUTE FUNCTION ensure_date_format();