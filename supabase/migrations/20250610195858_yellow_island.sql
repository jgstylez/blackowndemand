/*
  # Debug Business Visibility
  
  1. Check specific business status
  2. Verify RLS policies are working correctly
  3. Add debugging functions for admin use
*/

-- Function to check a specific business's visibility status
CREATE OR REPLACE FUNCTION debug_business_visibility(business_uuid uuid)
RETURNS TABLE(
  business_id uuid,
  business_name text,
  is_active boolean,
  is_verified boolean,
  migration_source text,
  claimed_at timestamptz,
  owner_id uuid,
  visible_to_public boolean,
  visibility_reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as business_id,
    b.name as business_name,
    b.is_active,
    b.is_verified,
    b.migration_source,
    b.claimed_at,
    b.owner_id,
    (
      b.is_active = true 
      AND (
        b.is_verified = true 
        OR b.migration_source IS NOT NULL
      )
    ) as visible_to_public,
    CASE 
      WHEN b.is_active = false THEN 'Business is inactive'
      WHEN b.is_verified = false AND b.migration_source IS NULL THEN 'Business is not verified and not a member'
      WHEN b.is_active = true AND (b.is_verified = true OR b.migration_source IS NOT NULL) THEN 'Business should be visible'
      ELSE 'Unknown visibility issue'
    END as visibility_reason
  FROM businesses b
  WHERE b.id = business_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_business_visibility(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_business_visibility(uuid) TO anon;

-- Check the specific business you mentioned
SELECT * FROM debug_business_visibility('fd860244-435f-4af7-ba99-9a3ad9b99426');

-- Also check if the business exists at all
SELECT 
  id,
  name,
  is_active,
  is_verified,
  migration_source,
  claimed_at,
  created_at
FROM businesses 
WHERE id = 'fd860244-435f-4af7-ba99-9a3ad9b99426';

-- Check all businesses that should be visible
SELECT 
  id,
  name,
  is_active,
  is_verified,
  migration_source IS NOT NULL as is_member,
  (
    is_active = true 
    AND (
      is_verified = true 
      OR migration_source IS NOT NULL
    )
  ) as should_be_visible
FROM businesses 
ORDER BY created_at DESC
LIMIT 20;

-- Function to fix common visibility issues
CREATE OR REPLACE FUNCTION fix_business_visibility(business_uuid uuid)
RETURNS text AS $$
DECLARE
  business_record businesses%ROWTYPE;
  result_message text;
BEGIN
  -- Get the business record
  SELECT * INTO business_record FROM businesses WHERE id = business_uuid;
  
  IF NOT FOUND THEN
    RETURN 'Business not found';
  END IF;
  
  -- Check and fix common issues
  IF business_record.is_active = false THEN
    UPDATE businesses 
    SET is_active = true, updated_at = now()
    WHERE id = business_uuid;
    result_message := 'Activated business';
  ELSIF business_record.is_verified = false AND business_record.migration_source IS NULL THEN
    -- If it's not verified and not a member, we can't auto-fix this
    result_message := 'Business needs verification or member status';
  ELSE
    result_message := 'Business should already be visible';
  END IF;
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fix_business_visibility(uuid) TO authenticated;