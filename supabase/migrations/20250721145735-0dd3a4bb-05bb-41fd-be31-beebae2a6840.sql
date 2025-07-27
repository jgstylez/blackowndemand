-- Add featured_position column to businesses table
ALTER TABLE businesses ADD COLUMN featured_position INTEGER;

-- Update existing featured businesses to have sequential positions
WITH featured_businesses AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as position
  FROM businesses 
  WHERE is_featured = true
)
UPDATE businesses 
SET featured_position = featured_businesses.position
FROM featured_businesses
WHERE businesses.id = featured_businesses.id;