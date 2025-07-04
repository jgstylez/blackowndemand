/*
  # Mark some sample businesses as featured
  
  1. Updates
    - Mark a few existing businesses as featured to populate the Featured Businesses section
    - This will make the section visible on the homepage
*/

-- Mark the first 3 businesses as featured for demonstration
UPDATE businesses 
SET is_featured = true, updated_at = now()
WHERE id IN (
  SELECT id 
  FROM businesses 
  WHERE (is_verified = true OR migration_source IS NOT NULL)
    AND is_active = true
  ORDER BY created_at DESC 
  LIMIT 3
);

-- Verify the update
SELECT 
  id,
  name,
  is_featured,
  is_verified,
  migration_source IS NOT NULL as is_member
FROM businesses 
WHERE is_featured = true;