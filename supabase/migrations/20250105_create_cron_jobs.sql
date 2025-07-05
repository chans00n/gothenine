-- Enable pg_cron extension (requires Supabase Pro plan)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Important: First, you need to set your service role key as a database setting
-- Run this in SQL Editor with your actual service role key:
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';

-- Create cron job for send-notifications (every 5 minutes)
SELECT cron.schedule(
  'send-notifications-cron',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcXRwZWtvaXFud3VneXpmcml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU3MTM5MCwiZXhwIjoyMDY3MTQ3MzkwfQ.1P-V1DEYNW29SARgaHmmMGuNUY4eYpMn7_HqQDz0B-s'
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
  SELECT
    net.http_post(
      url := 'https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/check-daily-streaks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcXRwZWtvaXFud3VneXpmcml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU3MTM5MCwiZXhwIjoyMDY3MTQ3MzkwfQ.1P-V1DEYNW29SARgaHmmMGuNUY4eYpMn7_HqQDz0B-s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- List all cron jobs to verify
SELECT * FROM cron.job;