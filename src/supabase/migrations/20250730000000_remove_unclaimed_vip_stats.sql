/*
  # Remove Unclaimed VIP Business Statistics
  
  Problem: The "Unclaimed VIP Businesses" concept doesn't make sense since
  once a business is claimed, it gets categorized as Starter, Enhanced, or VIP.
  
  Solution: Remove the unclaimed_vip_businesses field from the stats function
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_business_stats();

-- Create updated function without unclaimed_vip_businesses
CREATE OR REPLACE FUNCTION get_business_stats()
RETURNS TABLE(
  total_businesses bigint,
  active_businesses bigint,
  inactive_businesses bigint,
  verified_businesses bigint,
  featured_businesses bigint,
  member_businesses bigint,
  unclaimed_businesses bigint,
  vip_members bigint
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
    COUNT(*) FILTER (WHERE migration_source IS NOT NULL AND claimed_at IS NULL) as unclaimed_businesses,
    -- Count actual VIP members (claimed businesses with VIP Plan)
    COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND (migration_source IS NULL OR claimed_at IS NOT NULL)) as vip_members
  FROM businesses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_business_stats() TO authenticated;

-- Drop the VIP business overview view since it's no longer needed
DROP VIEW IF EXISTS vip_business_overview;

-- Drop the VIP business stats function since it's no longer needed
DROP FUNCTION IF EXISTS get_vip_business_stats(); 