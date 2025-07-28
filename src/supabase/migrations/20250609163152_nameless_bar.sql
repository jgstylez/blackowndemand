/*
  # Setup Supabase Storage for Business Images

  1. Storage Setup
    - Create business-images bucket
    - Set up proper access policies
    - Enable public access for image viewing

  2. Migration Tracking
    - Create table to track migration progress
    - Store mapping of old URLs to new URLs
*/

-- Create storage bucket for business images
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public can view business images"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-images');

CREATE POLICY "Authenticated users can upload business images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own business images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own business images"
ON storage.objects FOR DELETE
USING (bucket_id = 'business-images' AND auth.role() = 'authenticated');

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS image_migration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_url text NOT NULL,
  new_url text,
  business_id uuid REFERENCES businesses(id),
  table_name text NOT NULL,
  column_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, success, failed
  error_message text,
  migrated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE image_migration_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access to migration log for monitoring
CREATE POLICY "Public can view migration log"
ON image_migration_log
FOR SELECT
TO public
USING (true);