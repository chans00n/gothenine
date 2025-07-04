-- Storage bucket configuration for progress photos
-- Run this in your Supabase SQL editor

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress', 
  'progress', 
  true, -- Make bucket public so authenticated users can view photos
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']::text[];

-- Create RLS policies for the progress bucket
-- These policies ensure users can only manage photos in their own challenge folders

-- Policy 1: Allow authenticated users to upload photos to their challenge folders
CREATE POLICY "Users can upload to their challenge folders" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'progress' AND
  auth.uid() IS NOT NULL
);

-- Policy 2: Allow authenticated users to view all photos (since bucket is public)
CREATE POLICY "Users can view progress photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'progress');

-- Policy 3: Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'progress' AND
  auth.uid() IS NOT NULL
);

-- Policy 4: Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'progress' AND
  auth.uid() IS NOT NULL
);