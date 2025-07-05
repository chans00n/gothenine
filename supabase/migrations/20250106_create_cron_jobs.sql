-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Important: You need to get your service role key and insert it below
-- Get it from: https://supabase.com/dashboard/project/xkqtpekoiqnwugyzfrit/settings/api
-- Look for "service_role" key (keep this secret!)

-- Create cron job for send-notifications (every 5 minutes)
SELECT cron.schedule(
  'send-notifications-cron',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Create cron job for check-daily-streaks (daily at 6 AM UTC)
SELECT cron.schedule(
  'check-daily-streaks-cron',
  '0 6 * * *', -- Daily at 6 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/check-daily-streaks',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- To view scheduled jobs
-- SELECT * FROM cron.job;

-- To unschedule jobs (if needed)
-- SELECT cron.unschedule('send-notifications-cron');
-- SELECT cron.unschedule('check-daily-streaks-cron');