-- Test the edge function manually
SELECT call_edge_function('send-notifications');

-- Check if the function was called
SELECT * FROM cron.job_run_details 
WHERE command LIKE '%send-notifications%' 
ORDER BY start_time DESC 
LIMIT 5;

-- Test daily streaks function
SELECT call_edge_function('check-daily-streaks');

-- View all cron jobs
SELECT * FROM cron.job;