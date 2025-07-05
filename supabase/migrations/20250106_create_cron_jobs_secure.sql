-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vault;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- First, store your service role key in the vault
-- You'll need to run this with your actual service role key:
-- INSERT INTO vault.secrets (name, secret) 
-- VALUES ('service_role_key', 'YOUR_ACTUAL_SERVICE_ROLE_KEY')
-- ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- Create function to get service role key from vault
CREATE OR REPLACE FUNCTION get_service_role_key() RETURNS text AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key';
  RETURN secret_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to call Edge Functions with auth
CREATE OR REPLACE FUNCTION call_edge_function(function_name text) RETURNS void AS $$
DECLARE
  service_key text;
  function_url text;
BEGIN
  -- Get service role key from vault
  service_key := get_service_role_key();
  
  -- Build function URL
  function_url := 'https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/' || function_name;
  
  -- Make HTTP request
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cron job for send-notifications (every 5 minutes)
SELECT cron.schedule(
  'send-notifications-cron',
  '*/5 * * * *', -- Every 5 minutes
  $$ SELECT call_edge_function('send-notifications'); $$
);

-- Create cron job for check-daily-streaks (daily at 6 AM UTC)
SELECT cron.schedule(
  'check-daily-streaks-cron',
  '0 6 * * *', -- Daily at 6 AM UTC
  $$ SELECT call_edge_function('check-daily-streaks'); $$
);

-- Helpful queries:

-- View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- View job run details
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Unschedule jobs (if needed)
-- SELECT cron.unschedule('send-notifications-cron');
-- SELECT cron.unschedule('check-daily-streaks-cron');

-- Test the edge functions manually
-- SELECT call_edge_function('send-notifications');
-- SELECT call_edge_function('check-daily-streaks');