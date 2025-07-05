-- Force update your notification preferences to trigger in 1 minute
-- First, get your user ID
WITH your_user AS (
  SELECT id FROM auth.users WHERE email = 'chanson@stblcreative.com' -- Replace with your email
)
UPDATE notification_preferences 
SET 
  enabled = true,
  daily_reminder = true,
  daily_reminder_time = TO_CHAR(NOW() AT TIME ZONE 'UTC' + INTERVAL '1 minute', 'HH24:MI')
WHERE user_id = (SELECT id FROM your_user);

-- Verify the update
SELECT 
  daily_reminder_time,
  TO_CHAR(NOW() AT TIME ZONE 'UTC', 'HH24:MI') as current_time,
  TO_CHAR(NOW() AT TIME ZONE 'UTC' + INTERVAL '1 minute', 'HH24:MI') as notification_time
FROM notification_preferences 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'chanson@stblcreative.com');