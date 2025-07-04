-- Fix missing photos in progress_photos table
-- This will create entries in progress_photos based on the photoUrl in tasks

-- First, let's see what photos are missing
SELECT 
  dp.date,
  dp.challenge_id,
  c.user_id,
  dp.tasks->'progress-photo'->>'photoUrl' as photo_url,
  REPLACE(
    dp.tasks->'progress-photo'->>'photoUrl',
    '/main_',
    '/thumb_'
  ) as thumbnail_url
FROM daily_progress dp
JOIN challenges c ON c.id = dp.challenge_id
WHERE dp.tasks->'progress-photo'->>'completed' = 'true'
  AND dp.tasks->'progress-photo'->>'photoUrl' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM progress_photos pp 
    WHERE pp.date = dp.date 
    AND pp.challenge_id = dp.challenge_id
  )
  AND c.is_active = true;

-- Insert missing photo records
INSERT INTO progress_photos (challenge_id, user_id, photo_url, thumbnail_url, date, task_id)
SELECT 
  dp.challenge_id,
  c.user_id,
  dp.tasks->'progress-photo'->>'photoUrl' as photo_url,
  REPLACE(
    dp.tasks->'progress-photo'->>'photoUrl',
    '/main_',
    '/thumb_'
  ) as thumbnail_url,
  dp.date,
  'progress-photo' as task_id
FROM daily_progress dp
JOIN challenges c ON c.id = dp.challenge_id
WHERE dp.tasks->'progress-photo'->>'completed' = 'true'
  AND dp.tasks->'progress-photo'->>'photoUrl' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM progress_photos pp 
    WHERE pp.date = dp.date 
    AND pp.challenge_id = dp.challenge_id
  )
  AND c.is_active = true;

-- Verify the fix
SELECT 
  dp.date,
  dp.tasks->'progress-photo'->>'completed' as task_completed,
  COUNT(pp.id) as photos_in_table,
  pp.photo_url
FROM daily_progress dp
LEFT JOIN progress_photos pp ON pp.date = dp.date AND pp.challenge_id = dp.challenge_id
WHERE dp.challenge_id IN (
  SELECT id FROM challenges WHERE is_active = true
)
GROUP BY dp.date, dp.tasks, pp.photo_url
ORDER BY dp.date DESC;