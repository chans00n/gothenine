-- Add onboarding_completed to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add updated_at to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add is_active to challenges
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Make name optional in challenges table
ALTER TABLE challenges 
ALTER COLUMN name DROP NOT NULL;

-- Set default name for challenges
ALTER TABLE challenges 
ALTER COLUMN name SET DEFAULT '75 Hard Challenge';

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index for active challenges
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(user_id, is_active) WHERE is_active = true;