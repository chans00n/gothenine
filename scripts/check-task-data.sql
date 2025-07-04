-- Check the current daily progress data to understand the task duplication issue

-- 1. Check today's progress record with task details
SELECT 
  id,
  user_id,
  challenge_id,
  date,
  tasks_completed,
  is_complete,
  jsonb_pretty(tasks) as tasks_detail
FROM daily_progress 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;

-- 2. Check what tasks are being stored (should only be 6 unique tasks)
SELECT 
  date,
  tasks_completed,
  jsonb_object_keys(tasks) as task_keys
FROM daily_progress 
WHERE date = CURRENT_DATE;

-- 3. Count task keys per record
SELECT 
  id,
  date,
  tasks_completed,
  jsonb_object_keys(tasks) as task_key,
  (SELECT COUNT(*) FROM jsonb_object_keys(tasks)) as total_task_keys
FROM daily_progress 
WHERE date = CURRENT_DATE;

-- 4. Check for any duplicate task definitions
SELECT 
  task_key,
  COUNT(*) as count
FROM (
  SELECT 
    date,
    jsonb_object_keys(tasks) as task_key
  FROM daily_progress 
  WHERE date = CURRENT_DATE
) subquery
GROUP BY task_key
HAVING COUNT(*) > 1; 