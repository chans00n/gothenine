-- Quick check to see the task data issue
-- Run this first to see what's in your database

-- Show yesterday's task data
SELECT 
  date,
  tasks_completed,
  is_complete,
  tasks::text
FROM daily_progress
WHERE date = '2025-07-03'
  AND challenge_id IN (
    SELECT id FROM challenges WHERE is_active = true
  );

-- List all task IDs in yesterday's record
SELECT 
  date,
  key as task_id,
  value->>'completed' as completed
FROM daily_progress dp,
     jsonb_each(dp.tasks) as t(key, value)
WHERE dp.date = '2025-07-03'
  AND dp.challenge_id IN (
    SELECT id FROM challenges WHERE is_active = true
  )
ORDER BY key;