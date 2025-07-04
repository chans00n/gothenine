# Database Setup Instructions

If you're encountering errors during onboarding, you may need to update your database schema.

## Option 1: Run the migration manually in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
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
```

## Option 2: Reset and recreate tables

If you're just starting out, you can drop and recreate the tables:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL from `supabase/schema.sql`
4. Then run the migration from `supabase/migrations/20240110_add_onboarding_fields.sql`

## After Setup

Once the database is updated, the onboarding flow should work correctly. If you continue to have issues:

1. Check the browser console for specific error messages
2. Verify you're logged in before starting onboarding
3. Clear your browser's local storage and try again