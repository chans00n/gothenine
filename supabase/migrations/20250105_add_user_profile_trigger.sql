-- Create function to handle new user signup (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, timezone, notification_preferences)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'timezone', 'America/New_York'),
    COALESCE(
      (new.raw_user_meta_data->>'notification_preferences')::jsonb,
      '{"daily_reminder": true, "reminder_time": "09:00", "motivational_messages": true}'::jsonb
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users who don't have one
INSERT INTO public.user_profiles (id, display_name, timezone, notification_preferences)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1), 'User'),
  COALESCE(au.raw_user_meta_data->>'timezone', 'America/New_York'),
  COALESCE(
    (au.raw_user_meta_data->>'notification_preferences')::jsonb,
    '{"daily_reminder": true, "reminder_time": "09:00", "motivational_messages": true}'::jsonb
  )
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;