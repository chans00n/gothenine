-- Fix duplicate daily_progress records
-- The issue is that we have multiple rows per day instead of one row with all tasks

-- First, let's see what we have
SELECT 
  date,
  challenge_id,
  COUNT(*) as record_count,
  array_agg(DISTINCT jsonb_object_keys(tasks)) as all_tasks,
  array_agg(tasks_completed) as task_counts
FROM daily_progress 
WHERE challenge_id IN (SELECT id FROM challenges WHERE is_active = true)
GROUP BY date, challenge_id
ORDER BY date DESC;

-- Check individual records for today
SELECT 
  id,
  date,
  tasks_completed,
  jsonb_object_keys(tasks) as task_key,
  jsonb_pretty(tasks) as task_data
FROM daily_progress 
WHERE date = CURRENT_DATE
ORDER BY created_at;

-- Create a temporary table to hold consolidated data
CREATE TEMP TABLE consolidated_progress AS
WITH consolidated_tasks AS (
  SELECT 
    date,
    challenge_id,
    user_id,
    -- Merge all tasks from all records for this date
    jsonb_object_agg(
      task_key, 
      task_data
    ) as merged_tasks,
    MIN(created_at) as created_at
  FROM daily_progress dp,
       LATERAL jsonb_each(dp.tasks) AS t(task_key, task_data)
  WHERE dp.challenge_id IN (SELECT id FROM challenges WHERE is_active = true)
  GROUP BY date, challenge_id, user_id
)
SELECT 
  user_id,
  challenge_id,
  date,
  merged_tasks,
  (
    SELECT COUNT(*)::int
    FROM jsonb_each(merged_tasks) AS t(key, value)
    WHERE t.value->>'completed' = 'true'
  ) as completed_count,
  created_at
FROM consolidated_tasks;

-- Delete all existing records for active challenges
DELETE FROM daily_progress 
WHERE challenge_id IN (SELECT id FROM challenges WHERE is_active = true);

-- Insert consolidated records
INSERT INTO daily_progress (user_id, challenge_id, date, tasks, tasks_completed, is_complete, created_at)
SELECT 
  user_id,
  challenge_id,
  date,
  merged_tasks,
  completed_count,
  (completed_count = 6),
  created_at
FROM consolidated_progress;

-- Clean up
DROP TABLE consolidated_progress;

-- Verify the fix
SELECT 
  date,
  challenge_id,
  COUNT(*) as record_count,
  tasks_completed,
  array_agg(jsonb_object_keys(tasks)) as task_keys
FROM daily_progress 
WHERE challenge_id IN (SELECT id FROM challenges WHERE is_active = true)
GROUP BY date, challenge_id, tasks_completed
ORDER BY date DESC; 