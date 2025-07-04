-- Fix task counts in daily_progress table
-- This removes invalid tasks and recalculates counts

-- First, let's see what we're about to fix
SELECT 
  id,
  date,
  tasks_completed,
  jsonb_object_keys(tasks) as task_keys
FROM daily_progress
WHERE jsonb_object_keys(tasks) NOT IN (
  'water-intake', 
  'workout-indoor', 
  'workout-outdoor', 
  'progress-photo', 
  'read-nonfiction', 
  'follow-diet'
);

-- Create a function to clean tasks
CREATE OR REPLACE FUNCTION clean_daily_tasks(tasks_json jsonb)
RETURNS jsonb AS $$
DECLARE
  valid_tasks jsonb := '{}';
  task_key text;
  valid_keys text[] := ARRAY['water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet'];
BEGIN
  FOREACH task_key IN ARRAY valid_keys
  LOOP
    IF tasks_json ? task_key THEN
      valid_tasks := valid_tasks || jsonb_build_object(task_key, tasks_json->task_key);
    END IF;
  END LOOP;
  RETURN valid_tasks;
END;
$$ LANGUAGE plpgsql;

-- Update all records to fix task counts
UPDATE daily_progress
SET 
  tasks = (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(tasks) as t(key, value)
    WHERE key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
  ),
  tasks_completed = (
    SELECT COUNT(*)::int
    FROM jsonb_each(tasks) as t(key, value)
    WHERE t.value->>'completed' = 'true'
    AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
  ),
  is_complete = (
    SELECT COUNT(*)::int = 6
    FROM jsonb_each(tasks) as t(key, value)
    WHERE t.value->>'completed' = 'true'
    AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
  )
WHERE EXISTS (
  SELECT 1
  FROM jsonb_object_keys(tasks) as key
  WHERE key NOT IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
)
OR tasks_completed != (
  SELECT COUNT(*)::int
  FROM jsonb_each(tasks) as t(key, value)
  WHERE t.value->>'completed' = 'true'
  AND t.key IN ('water-intake', 'workout-indoor', 'workout-outdoor', 'progress-photo', 'read-nonfiction', 'follow-diet')
);

-- Clean up the function
DROP FUNCTION IF EXISTS clean_daily_tasks(jsonb);

-- Verify the fix
SELECT 
  date,
  tasks_completed,
  is_complete,
  array_agg(jsonb_object_keys(tasks)) as task_ids
FROM daily_progress
GROUP BY id, date, tasks_completed, is_complete, tasks
ORDER BY date DESC;