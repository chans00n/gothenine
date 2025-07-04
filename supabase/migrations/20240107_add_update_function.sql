-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Also ensure the user_id column exists in daily_progress if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_progress' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE daily_progress 
        ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Update existing records to set user_id from challenges table
        UPDATE daily_progress dp
        SET user_id = c.user_id
        FROM challenges c
        WHERE dp.challenge_id = c.id
        AND dp.user_id IS NULL;
    END IF;
END $$;