-- Clean up duplicate challenges and ensure only one active challenge per user
-- Copy this SQL to run directly in Supabase SQL Editor
-- This script will:
-- 1. Keep the earliest active challenge for each user
-- 2. Deactivate all other challenges for that user
-- 3. Migrate any daily_progress data to the kept challenge

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

-- Step 2: Update daily_progress to point to the kept challenge
UPDATE daily_progress dp
SET challenge_id = ctk.id
FROM challenges_to_keep ctk
WHERE dp.user_id = ctk.user_id 
  AND dp.challenge_id != ctk.id;

-- Step 3: Deactivate all challenges except the ones we're keeping
UPDATE challenges
SET is_active = false
WHERE id NOT IN (SELECT id FROM challenges_to_keep)
  AND is_active = true;

-- Step 4: Add a unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_challenge 
ON challenges(user_id) 
WHERE is_active = true;

-- Verify the cleanup
SELECT 
    user_id,
    COUNT(*) as total_challenges,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_challenges
FROM challenges
GROUP BY user_id
ORDER BY user_id; 