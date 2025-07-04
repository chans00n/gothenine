-- Check current task counts in daily_progress
-- This will show records with incorrect task counts

-- Query 1: Show task counts and identify records with issues
WITH task_counts AS (
  SELECT 
    dp.id,
    dp.date,
    dp.tasks_completed as stored_count,
    dp.is_complete,
    dp.tasks,
    (
      SELECT COUNT(*)::int
      FROM jsonb_each(dp.tasks) as t(key, value)
      WHERE t.value->>'completed' = 'true'
      AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
    ) as actual_completed_count,
    (
      SELECT COUNT(*)::int
      FROM jsonb_object_keys(dp.tasks) as key
    ) as total_task_count,
    (
      SELECT array_agg(key)
      FROM jsonb_object_keys(dp.tasks) as key
      WHERE key NOT IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
    ) as invalid_tasks
  FROM daily_progress dp
  WHERE dp.challenge_id IN (
    SELECT id FROM challenges WHERE is_active = true
  )
)
SELECT 
  date,
  stored_count,
  actual_completed_count,
  total_task_count,
  is_complete,
  CASE 
    WHEN stored_count != actual_completed_count THEN 'COUNT MISMATCH'
    WHEN total_task_count > 6 THEN 'TOO MANY TASKS'
    WHEN invalid_tasks IS NOT NULL THEN 'INVALID TASKS'
    ELSE 'OK'
  END as issue,
  invalid_tasks
FROM task_counts
WHERE stored_count != actual_completed_count 
   OR total_task_count > 6
   OR invalid_tasks IS NOT NULL
ORDER BY date DESC;

-- Query 2: Summary of issues
SELECT 
  COUNT(*) FILTER (WHERE stored_count != actual_completed_count) as count_mismatches,
  COUNT(*) FILTER (WHERE total_task_count > 6) as too_many_tasks,
  COUNT(*) FILTER (WHERE invalid_tasks IS NOT NULL) as has_invalid_tasks,
  COUNT(*) as total_records
FROM (
  SELECT 
    dp.id,
    dp.tasks_completed as stored_count,
    (
      SELECT COUNT(*)::int
      FROM jsonb_each(dp.tasks) as t(key, value)
      WHERE t.value->>'completed' = 'true'
      AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
    ) as actual_completed_count,
    (
      SELECT COUNT(*)::int
      FROM jsonb_object_keys(dp.tasks) as key
    ) as total_task_count,
    (
      SELECT array_agg(key)
      FROM jsonb_object_keys(dp.tasks) as key
      WHERE key NOT IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
    ) as invalid_tasks
  FROM daily_progress dp
  WHERE dp.challenge_id IN (
    SELECT id FROM challenges WHERE is_active = true
  )
) as task_analysis;