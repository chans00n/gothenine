-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;

-- Create new policies that allow viewing data for community features

-- Users can view all profiles (needed for community page)
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can still only update their own profile
-- (Keep existing UPDATE, INSERT policies as they are)

-- Users can view all active challenges (needed for community page)
CREATE POLICY "Users can view all challenges" ON challenges
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can only insert/update/delete their own challenges
-- (Keep existing INSERT, UPDATE, DELETE policies as they are)

-- Users can view all daily progress (needed for community page)
CREATE POLICY "Users can view all progress" ON daily_progress
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can only insert/update their own progress
-- (Keep existing INSERT, UPDATE policies as they are)