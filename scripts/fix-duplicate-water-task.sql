-- Fix duplicate water task keys in daily_progress
-- Issue: Both 'water-intake' and 'water_intake' exist, causing 7 tasks instead of 6

-- First, let's see the current state
SELECT 
  id,
  date,
  tasks_completed,
  jsonb_object_keys(tasks) as task_keys
FROM daily_progress 
WHERE tasks ? 'water-intake' OR tasks ? 'water_intake'
ORDER BY date DESC;

-- Update: Merge water_intake into water-intake and remove the duplicate
UPDATE daily_progress 
SET tasks = (
  -- Remove the water_intake key and keep water-intake
  tasks - 'water_intake'
),
tasks_completed = tasks_completed - 1
WHERE tasks ? 'water_intake' AND tasks ? 'water-intake';

-- Verify the fix
SELECT 
  id,
  date,
  tasks_completed,
  jsonb_object_keys(tasks) as task_keys,
  jsonb_pretty(tasks) as tasks_detail
FROM daily_progress 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC; 