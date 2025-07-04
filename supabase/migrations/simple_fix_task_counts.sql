-- Simple fix for task counts in daily_progress
-- This will clean up the data and fix the "8 of 6 tasks" issue

-- First, let's see what we're going to fix
SELECT 
  date,
  tasks_completed as stored_count,
  (
    SELECT COUNT(*)::int
    FROM jsonb_each(tasks) as t(key, value)
    WHERE t.value->>'completed' = 'true'
    AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
  ) as actual_count,
  (
    SELECT COUNT(*)::int
    FROM jsonb_object_keys(tasks) as key
  ) as total_tasks,
  tasks
FROM daily_progress
WHERE challenge_id IN (
  SELECT id FROM challenges WHERE is_active = true
)
ORDER BY date DESC;

-- Now fix the records
-- This will remove invalid tasks and recalculate the counts
UPDATE daily_progress dp
SET 
  -- Keep only valid tasks
  tasks = (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(dp.tasks) as t(key, value)
    WHERE key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
  ),
  -- Recalculate completed count
  tasks_completed = (
    SELECT COUNT(*)::int
    FROM jsonb_each(dp.tasks) as t(key, value)
    WHERE t.value->>'completed' = 'true'
    AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
  ),
  -- Update is_complete flag
  is_complete = (
    (
      SELECT COUNT(*)::int
      FROM jsonb_each(dp.tasks) as t(key, value)
      WHERE t.value->>'completed' = 'true'
      AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
    ) = 6
  )
WHERE dp.challenge_id IN (
  SELECT id FROM challenges WHERE is_active = true
);

-- Verify the fix worked
SELECT 
  date,
  tasks_completed,
  is_complete,
  (
    SELECT COUNT(*)::int
    FROM jsonb_object_keys(tasks) as key
  ) as task_count,
  CASE 
    WHEN tasks_completed > 6 THEN 'Still has issues!'
    ELSE 'Fixed'
  END as status
FROM daily_progress
WHERE challenge_id IN (
  SELECT id FROM challenges WHERE is_active = true
)
ORDER BY date DESC;