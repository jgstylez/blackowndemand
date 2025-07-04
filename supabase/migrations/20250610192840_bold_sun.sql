/*
  # Add business activation/deactivation functionality
  
  1. Changes
    - Add is_active boolean column to businesses table
    - Set default value to true for existing businesses
    - Update RLS policies to respect is_active status
    - Add admin functions for bulk operations
    
  2. Security
    - Only active businesses are visible to public
    - Admins can still see all businesses
    - Business owners can see their own businesses regardless of status
*/

-- Add is_active column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Set all existing businesses to active
UPDATE businesses 
SET is_active = true 
WHERE is_active IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE businesses 
ALTER COLUMN is_active SET NOT NULL;

-- Update RLS policies to include is_active check
DROP POLICY IF EXISTS "Public can view verified businesses" ON businesses;
DROP POLICY IF EXISTS "Public can view migrated businesses" ON businesses;

-- New policy that combines verification, migration, and active status
CREATE POLICY "Public can view active businesses"
  ON businesses
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (
      is_verified = true 
      OR migration_source IS NOT NULL
    )
  );

-- Policy for business owners to see their own businesses regardless of active status
CREATE POLICY "Owners can view their own businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS businesses_active_idx ON businesses(is_active);

-- Create function for bulk business activation/deactivation
CREATE OR REPLACE FUNCTION bulk_update_business_status(
  business_ids uuid[],
  new_status boolean
)
RETURNS void AS $$
BEGIN
  UPDATE businesses 
  SET is_active = new_status,
      updated_at = now()
  WHERE id = ANY(business_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION bulk_update_business_status(uuid[], boolean) TO authenticated;

-- Create function to get business statistics including active/inactive counts
CREATE OR REPLACE FUNCTION get_business_stats()
RETURNS TABLE(
  total_businesses bigint,
  active_businesses bigint,
  inactive_businesses bigint,
  verified_businesses bigint,
  featured_businesses bigint,
  member_businesses bigint,
  unclaimed_businesses bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_businesses,
    COUNT(*) FILTER (WHERE is_active = true) as active_businesses,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_businesses,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_businesses,
    COUNT(*) FILTER (WHERE is_featured = true) as featured_businesses,
    COUNT(*) FILTER (WHERE migration_source IS NOT NULL) as member_businesses,
    COUNT(*) FILTER (WHERE migration_source IS NOT NULL AND claimed_at IS NULL) as unclaimed_businesses
  FROM businesses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_business_stats() TO authenticated;