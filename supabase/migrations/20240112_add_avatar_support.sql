-- Add avatar_url field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN avatar_url TEXT;

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true);

-- Storage policies for user avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE TO authenticated 
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE TO authenticated 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar images are publicly viewable" ON storage.objects
FOR SELECT TO public 
USING (bucket_id = 'user-avatars'); 