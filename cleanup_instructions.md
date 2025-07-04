# Manual Database Cleanup Instructions

## Step 1: Identify the Problem
Run this in Supabase SQL Editor to see what we're dealing with:

```sql
-- See how many challenges each user has
SELECT 
    user_id,
    COUNT(*) as total_challenges,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_challenges
FROM challenges
GROUP BY user_id
ORDER BY total_challenges DESC;
```

## Step 2: Find Your User ID
```sql
-- Find your user ID (replace with your email)
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

## Step 3: Clean Up Daily Progress (Replace USER_ID with your actual user ID)
```sql
-- First, let's see what daily_progress entries exist for your user
SELECT 
    challenge_id,
    date,
    tasks,
    tasks_completed,
    is_complete
FROM daily_progress 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY date DESC;
```

## Step 4: Manual Cleanup (Replace USER_ID)
```sql
-- Delete all daily_progress entries for your user (we'll recreate them)
DELETE FROM daily_progress WHERE user_id = 'YOUR_USER_ID';

-- Keep only the oldest challenge for your user
UPDATE challenges 
SET is_active = false 
WHERE user_id = 'YOUR_USER_ID' 
AND id NOT IN (
    SELECT id 
    FROM challenges 
    WHERE user_id = 'YOUR_USER_ID' 
    ORDER BY created_at ASC 
    LIMIT 1
);
```

## Step 5: Test the Fix
After running the cleanup, go back to your app and:
1. Complete a few tasks
2. Navigate away from the dashboard
3. Come back - tasks should persist

## Step 6: Prevent Future Issues
```sql
-- Add constraint to prevent duplicate active challenges
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_challenge 
ON challenges(user_id) 
WHERE is_active = true;
```

## Alternative: Quick Reset (If you don't mind losing progress)
If you just want to start fresh:

```sql
-- Replace USER_ID with your actual user ID
DELETE FROM daily_progress WHERE user_id = 'YOUR_USER_ID';
DELETE FROM challenges WHERE user_id = 'YOUR_USER_ID';
```

Then restart your app and it will create a single new challenge. 