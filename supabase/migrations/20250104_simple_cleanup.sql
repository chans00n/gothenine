-- Simple cleanup script to handle duplicate challenges and daily_progress entries
-- Run this step by step to avoid constraint violations

-- Step 1: Identify the challenge to keep for each user (oldest one)
-- Just run this to see what we're working with first:
SELECT 
    user_id,
    COUNT(*) as total_challenges,
    MIN(created_at) as earliest_challenge_date
FROM challenges 
WHERE is_active = true
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Step 2: Create a backup table for daily_progress (just in case)
CREATE TABLE daily_progress_backup AS 
SELECT * FROM daily_progress;

-- Step 3: For each user, merge their daily_progress entries by date
-- This handles the duplicate constraint by combining task data
WITH user_challenge_mapping AS (
    SELECT DISTINCT ON (user_id)
        user_id,
        id as keep_challenge_id
    FROM challenges
    WHERE is_active = true
    ORDER BY user_id, created_at ASC
),
merged_progress AS (
    SELECT 
        dp.user_id,
        ucm.keep_challenge_id,
        dp.date,
        -- Merge all task objects for the same date
        jsonb_object_agg(
            task_key, 
            task_value
        ) FILTER (WHERE task_key IS NOT NULL) as merged_tasks,
        -- Take the maximum values for counters
        MAX(dp.tasks_completed) as max_tasks_completed,
        BOOL_OR(dp.is_complete) as any_complete,
        MIN(dp.created_at) as earliest_created
    FROM daily_progress dp
    JOIN user_challenge_mapping ucm ON dp.user_id = ucm.user_id
    LEFT JOIN LATERAL jsonb_each(dp.tasks) AS j(task_key, task_value) ON true
    GROUP BY dp.user_id, ucm.keep_challenge_id, dp.date
)
-- First, let's see what this query would produce
SELECT * FROM merged_progress LIMIT 10;

-- Step 4: After reviewing the above, delete all existing daily_progress and recreate
-- (Uncomment these lines after reviewing the merged data above)
/*
DELETE FROM daily_progress;

INSERT INTO daily_progress (user_id, challenge_id, date, tasks, tasks_completed, is_complete, created_at)
SELECT 
    user_id,
    keep_challenge_id,
    date,
    COALESCE(merged_tasks, '{}'),
    COALESCE(max_tasks_completed, 0),
    COALESCE(any_complete, false),
    earliest_created
FROM merged_progress;
*/

-- Step 5: After data is cleaned up, deactivate duplicate challenges
-- (Uncomment after data cleanup is complete)
/*
UPDATE challenges
SET is_active = false
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM challenges
    WHERE is_active = true
    ORDER BY user_id, created_at ASC
);
*/ 