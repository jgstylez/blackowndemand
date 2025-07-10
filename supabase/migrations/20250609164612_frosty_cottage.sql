-- Image Migration Script for Supabase SQL Editor
-- This script migrates images from CDN to Supabase storage and updates database records

-- First, let's see what we're working with
DO $$
DECLARE
  total_businesses integer;
  businesses_with_images integer;
  cdn_images integer;
  supabase_images integer;
  relative_images integer;
BEGIN
  -- Count total businesses
  SELECT COUNT(*) INTO total_businesses FROM businesses;
  RAISE NOTICE 'Total businesses: %', total_businesses;
  
  -- Count businesses with images
  SELECT COUNT(*) INTO businesses_with_images 
  FROM businesses 
  WHERE image_url IS NOT NULL AND image_url != '';
  RAISE NOTICE 'Businesses with images: %', businesses_with_images;
  
  -- Count CDN images
  SELECT COUNT(*) INTO cdn_images 
  FROM businesses 
  WHERE image_url LIKE '%cdn.blackdollarnetwork.com%';
  RAISE NOTICE 'CDN images to migrate: %', cdn_images;
  
  -- Count already migrated Supabase images
  SELECT COUNT(*) INTO supabase_images 
  FROM businesses 
  WHERE image_url LIKE '%supabase.co%';
  RAISE NOTICE 'Already migrated (Supabase): %', supabase_images;
  
  -- Count relative path images
  SELECT COUNT(*) INTO relative_images 
  FROM businesses 
  WHERE image_url IS NOT NULL 
    AND image_url != ''
    AND image_url NOT LIKE 'http%'
    AND image_url NOT LIKE '%supabase.co%';
  RAISE NOTICE 'Relative path images: %', relative_images;
END $$;

-- Show sample images that need migration
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN image_url LIKE '%cdn.blackdollarnetwork.com%' THEN 'CDN'
    WHEN image_url LIKE '%supabase.co%' THEN 'Supabase (migrated)'
    WHEN image_url NOT LIKE 'http%' THEN 'Relative path'
    ELSE 'Other'
  END as url_type
FROM businesses 
WHERE image_url IS NOT NULL AND image_url != ''
ORDER BY 
  CASE 
    WHEN image_url LIKE '%cdn.blackdollarnetwork.com%' THEN 1
    WHEN image_url NOT LIKE 'http%' THEN 2
    WHEN image_url LIKE '%supabase.co%' THEN 3
    ELSE 4
  END,
  name
LIMIT 20;

-- Create a function to generate Supabase storage URLs
-- Since we can't actually download/upload files via SQL, we'll simulate the migration
-- by updating URLs to point to a Supabase storage structure

CREATE OR REPLACE FUNCTION migrate_image_url(old_url text, business_id uuid)
RETURNS text AS $$
DECLARE
  new_url text;
  file_extension text;
  filename text;
BEGIN
  -- Skip if already migrated
  IF old_url LIKE '%supabase.co%' THEN
    RETURN old_url;
  END IF;
  
  -- Extract file extension
  file_extension := COALESCE(
    CASE 
      WHEN old_url LIKE '%.jpg' OR old_url LIKE '%.jpeg' THEN 'jpg'
      WHEN old_url LIKE '%.png' THEN 'png'
      WHEN old_url LIKE '%.webp' THEN 'webp'
      WHEN old_url LIKE '%.gif' THEN 'gif'
      ELSE 'jpg'
    END
  );
  
  -- Generate new filename
  filename := business_id::text || '_' || extract(epoch from now())::bigint || '_migrated.' || file_extension;
  
  -- Generate Supabase storage URL
  -- Replace with your actual Supabase project URL
  new_url := 'https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/business-images/businesses/' || filename;
  
  RETURN new_url;
END;
$$ LANGUAGE plpgsql;

-- Preview what the migration would look like
SELECT 
  id,
  name,
  image_url as old_url,
  migrate_image_url(image_url, id) as new_url,
  CASE 
    WHEN image_url LIKE '%supabase.co%' THEN 'Already migrated'
    ELSE 'Will be migrated'
  END as status
FROM businesses 
WHERE image_url IS NOT NULL AND image_url != ''
ORDER BY name
LIMIT 10;

-- IMPORTANT: The actual migration would require manual file transfer
-- For now, let's create migration log entries for tracking

-- Insert migration log entries for all images that need migration
INSERT INTO image_migration_log (
  old_url,
  new_url,
  business_id,
  table_name,
  column_name,
  status,
  created_at
)
SELECT 
  image_url,
  migrate_image_url(image_url, id),
  id,
  'businesses',
  'image_url',
  'pending',
  now()
FROM businesses 
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND image_url NOT LIKE '%supabase.co%'
  AND NOT EXISTS (
    SELECT 1 FROM image_migration_log 
    WHERE old_url = businesses.image_url 
    AND business_id = businesses.id
  );

-- Show migration log summary
SELECT 
  status,
  COUNT(*) as count
FROM image_migration_log
GROUP BY status
ORDER BY status;

-- Show businesses that need manual image migration
SELECT 
  b.id,
  b.name,
  b.image_url as current_url,
  iml.new_url as target_url,
  iml.status
FROM businesses b
JOIN image_migration_log iml ON iml.business_id = b.id AND iml.table_name = 'businesses'
WHERE iml.status = 'pending'
ORDER BY b.name;

-- Function to mark migration as complete (call this after manually uploading files)
CREATE OR REPLACE FUNCTION mark_migration_complete(p_business_id uuid, p_new_url text)
RETURNS void AS $$
BEGIN
  -- Update the business record
  UPDATE businesses 
  SET image_url = p_new_url,
      updated_at = now()
  WHERE id = p_business_id;
  
  -- Update migration log
  UPDATE image_migration_log
  SET status = 'success',
      new_url = p_new_url,
      migrated_at = now()
  WHERE business_id = p_business_id 
    AND table_name = 'businesses'
    AND status = 'pending';
    
  RAISE NOTICE 'Migration marked complete for business %', p_business_id;
END;
$$ LANGUAGE plpgsql;

-- Example of how to mark a migration complete:
-- SELECT mark_migration_complete('business-uuid-here', 'https://your-supabase-url/storage/v1/object/public/business-images/businesses/filename.jpg');

-- Clean up function
DROP FUNCTION IF EXISTS migrate_image_url(text, uuid);

-- Final summary
SELECT 
  'Migration preparation complete!' as message,
  COUNT(*) as pending_migrations
FROM image_migration_log 
WHERE status = 'pending';