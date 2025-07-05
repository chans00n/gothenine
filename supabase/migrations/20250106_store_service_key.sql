-- This migration stores your service role key securely
-- You only need to run this once after getting your service role key

-- Create private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Create secure key storage table
CREATE TABLE IF NOT EXISTS private.keys (
  name TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA private TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA private TO postgres;

-- Create function to safely store/update keys
CREATE OR REPLACE FUNCTION private.store_key(key_name TEXT, key_value TEXT) RETURNS void AS $$
BEGIN
  INSERT INTO private.keys (name, secret)
  VALUES (key_name, key_value)
  ON CONFLICT (name) DO UPDATE
  SET secret = EXCLUDED.secret,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get service role key from private schema
CREATE OR REPLACE FUNCTION get_service_role_key() RETURNS text AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT secret INTO secret_value 
  FROM private.keys 
  WHERE name = 'service_role_key';
  RETURN secret_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the edge function caller to use the new key retrieval
CREATE OR REPLACE FUNCTION call_edge_function(function_name text) RETURNS void AS $$
DECLARE
  service_key text;
  function_url text;
BEGIN
  -- Get service role key from private schema
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

-- IMPORTANT: Run this query with your actual service role key
-- You can find it in the Supabase Dashboard > Settings > API
-- Look for "service_role" (NOT anon)
/*
SELECT private.store_key('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE');
*/

-- To verify the key is stored (it will show as masked):
-- SELECT name, left(secret, 20) || '...' as masked_secret, updated_at FROM private.keys;