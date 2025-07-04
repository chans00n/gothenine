-- Fix duplicate daily_progress records
-- The issue is that we have multiple rows per day instead of one row with all tasks

-- Create a temporary table to hold consolidated data
CREATE TEMP TABLE consolidated_daily_progress AS
WITH task_consolidation AS (
  SELECT 
    date,
    challenge_id,
    user_id,
    MIN(created_at) as created_at,
    -- Merge all tasks from all records for this date
    jsonb_object_agg(
      task_key, 
      task_data
    ) as merged_tasks
  FROM daily_progress dp,
       LATERAL jsonb_each(dp.tasks) AS t(task_key, task_data)
  GROUP BY date, challenge_id, user_id
)
SELECT 
  user_id,
  challenge_id,
  date,
  merged_tasks as tasks,
  (
    SELECT COUNT(*)::int
    FROM jsonb_each(merged_tasks) AS t(key, value)
    WHERE t.value->>'completed' = 'true'
  ) as tasks_completed,
  (
    SELECT COUNT(*)::int
    FROM jsonb_each(merged_tasks) AS t(key, value)
    WHERE t.value->>'completed' = 'true'
  ) = 6 as is_complete,
  created_at
FROM task_consolidation;

-- Delete all existing records
DELETE FROM daily_progress;

-- Insert consolidated records
INSERT INTO daily_progress (user_id, challenge_id, date, tasks, tasks_completed, is_complete, created_at)
SELECT 
  user_id,
  challenge_id,
  date,
  tasks,
  tasks_completed,
  is_complete,
  created_at
FROM consolidated_daily_progress;

-- Drop the temporary table
DROP TABLE consolidated_daily_progress;

-- Verify the fix
SELECT 
  'After fix' as status,
  date,
  tasks_completed,
  array_agg(jsonb_object_keys(tasks)) as task_keys
FROM daily_progress 
GROUP BY date, tasks_completed
ORDER BY date DESC; 