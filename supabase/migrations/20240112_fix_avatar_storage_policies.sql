-- Fix avatar storage policies
-- The issue is that the policies were checking folder names instead of filenames
-- The file path structure is: avatars/[user_id]_[timestamp].[extension]

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create corrected policies that check the filename instead of folder
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = split_part(split_part(name, '/', 2), '_', 1)
);

CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = split_part(split_part(name, '/', 2), '_', 1)
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = split_part(split_part(name, '/', 2), '_', 1)
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = split_part(split_part(name, '/', 2), '_', 1)
);

-- Also add a policy to allow public viewing of avatars (for displaying them in the UI)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars'); 