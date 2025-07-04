-- Clean up duplicate challenges and ensure only one active challenge per user
-- This migration will:
-- 1. Keep the earliest active challenge for each user
-- 2. Consolidate daily_progress data by merging task data
-- 3. Deactivate all other challenges for that user

-- Step 1: Create a temporary table with the challenge to keep for each user
CREATE TEMP TABLE challenges_to_keep AS
SELECT DISTINCT ON (user_id) 
    id, 
    user_id, 
    start_date,
    created_at
FROM challenges 
WHERE is_active = true
ORDER BY user_id, created_at ASC;

-- Step 2: Create a temporary table with consolidated daily progress
CREATE TEMP TABLE consolidated_progress AS
SELECT 
    dp.user_id,
    ctk.id as challenge_id,
    dp.date,
    -- Merge all task data from duplicate entries
    jsonb_object_agg(
        COALESCE(task_key, ''), 
        COALESCE(task_value, '{}')
    ) FILTER (WHERE task_key IS NOT NULL) as tasks,
    -- Get the maximum tasks completed count
    MAX(dp.tasks_completed) as tasks_completed,
    -- Mark as complete if any entry was complete
    BOOL_OR(dp.is_complete) as is_complete,
    -- Use the earliest created_at
    MIN(dp.created_at) as created_at
FROM daily_progress dp
JOIN challenges_to_keep ctk ON dp.user_id = ctk.user_id
LEFT JOIN LATERAL jsonb_each(dp.tasks) AS j(task_key, task_value) ON true
GROUP BY dp.user_id, ctk.id, dp.date;

-- Step 3: Delete existing daily_progress entries for users with multiple challenges
DELETE FROM daily_progress dp
WHERE dp.user_id IN (
    SELECT user_id FROM challenges_to_keep
);

-- Step 4: Insert consolidated progress data
INSERT INTO daily_progress (user_id, challenge_id, date, tasks, tasks_completed, is_complete, created_at)
SELECT 
    user_id,
    challenge_id,
    date,
    COALESCE(tasks, '{}'),
    COALESCE(tasks_completed, 0),
    COALESCE(is_complete, false),
    created_at
FROM consolidated_progress;

-- Step 5: Deactivate all challenges except the ones we're keeping
UPDATE challenges
SET is_active = false
WHERE id NOT IN (SELECT id FROM challenges_to_keep)
  AND is_active = true;

-- Step 6: Add a unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_challenge 
ON challenges(user_id) 
WHERE is_active = true; 