-- Check photo status for July 3rd
-- This will help us understand why the photo shows as missing

-- Check the progress-photo task details
SELECT 
  date,
  tasks->'progress-photo' as photo_task_data
FROM daily_progress
WHERE date = '2025-07-03'
  AND challenge_id IN (
    SELECT id FROM challenges WHERE is_active = true
  );

-- Check if there's an entry in progress_photos table
SELECT 
  date,
  photo_url,
  thumbnail_url,
  created_at
FROM progress_photos
WHERE date = '2025-07-03'
  AND challenge_id IN (
    SELECT id FROM challenges WHERE is_active = true
  );

-- Check what the aggregation service would see
SELECT 
  dp.date,
  dp.tasks->'progress-photo'->>'completed' as task_completed,
  dp.tasks->'progress-photo'->>'photoUrl' as photo_url_in_task,
  COUNT(pp.id) as photos_in_table
FROM daily_progress dp
LEFT JOIN progress_photos pp ON pp.date = dp.date AND pp.challenge_id = dp.challenge_id
WHERE dp.date = '2025-07-03'
  AND dp.challenge_id IN (
    SELECT id FROM challenges WHERE is_active = true
  )
GROUP BY dp.date, dp.tasks;