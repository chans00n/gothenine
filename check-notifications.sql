-- Check if you have notification preferences set up
SELECT * FROM notification_preferences;

-- Check if you have any push subscriptions
SELECT 
  ps.id,
  ps.user_id,
  ps.endpoint,
  ps.created_at,
  u.email
FROM push_subscriptions ps
JOIN auth.users u ON u.id = ps.user_id;

-- Check current UTC time
SELECT NOW() AT TIME ZONE 'UTC' as current_utc_time,
       TO_CHAR(NOW() AT TIME ZONE 'UTC', 'HH24:MI') as current_time_string;

-- Check if any daily reminders should fire now (within 5 minute window)
WITH current_time AS (
  SELECT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'HH24:MI') as now_time
)
SELECT 
  np.user_id,
  np.daily_reminder_time,
  ct.now_time as current_time,
  ABS(
    EXTRACT(EPOCH FROM (
      TO_TIMESTAMP(np.daily_reminder_time, 'HH24:MI')::TIME - 
      TO_TIMESTAMP(ct.now_time, 'HH24:MI')::TIME
    )) / 60
  ) as minutes_difference
FROM notification_preferences np
CROSS JOIN current_time ct
WHERE np.enabled = true 
  AND np.daily_reminder = true;