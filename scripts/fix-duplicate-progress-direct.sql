-- DIRECT SQL FIX for duplicate daily_progress records
-- Run this directly in the Supabase SQL Editor

-- First, let's see what we have (diagnostic query)
SELECT 
  'Before fix' as status,
  date,
  COUNT(*) as record_count,
  array_agg(tasks_completed) as task_counts,
  array_agg(id) as record_ids
FROM daily_progress 
GROUP BY date
HAVING COUNT(*) > 1
ORDER BY date DESC;

-- Consolidate duplicate records
-- Step 1: Create temporary table with consolidated data
CREATE TEMP TABLE temp_consolidated AS
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

-- Step 2: Delete all existing records
DELETE FROM daily_progress;

-- Step 3: Insert consolidated records
INSERT INTO daily_progress (user_id, challenge_id, date, tasks, tasks_completed, is_complete, created_at)
SELECT 
  user_id,
  challenge_id,
  date,
  tasks,
  tasks_completed,
  is_complete,
  created_at
FROM temp_consolidated;

-- Step 4: Verify the fix
SELECT 
  'After fix' as status,
  date,
  tasks_completed,
  is_complete,
  jsonb_object_keys(tasks) as task_keys
FROM daily_progress 
ORDER BY date DESC;

-- Final verification: should show 1 record per date
SELECT 
  date,
  COUNT(*) as record_count,
  MAX(tasks_completed) as max_tasks_completed
FROM daily_progress 
GROUP BY date
ORDER BY date DESC; 