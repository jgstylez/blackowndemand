/*
  # Fix VIP Business Statistics
  
  Problem: The get_business_stats() function doesn't properly distinguish between:
  - Regular unclaimed migrated businesses
  - VIP unclaimed migrated businesses
  
  Solution: Update the function to provide more granular statistics
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_business_stats();

-- Create updated function with better VIP statistics
CREATE OR REPLACE FUNCTION get_business_stats()
RETURNS TABLE(
  total_businesses bigint,
  active_businesses bigint,
  inactive_businesses bigint,
  verified_businesses bigint,
  featured_businesses bigint,
  member_businesses bigint,
  unclaimed_businesses bigint,
  vip_members bigint,
  unclaimed_vip_businesses bigint
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
    COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND (migration_source IS NULL OR claimed_at IS NOT NULL)) as vip_members,
    -- Count unclaimed VIP businesses (migrated businesses with VIP Plan that haven't been claimed)
    COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND migration_source IS NOT NULL AND claimed_at IS NULL) as unclaimed_vip_businesses
  FROM businesses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_business_stats() TO authenticated;

-- Create a view for better VIP business tracking
CREATE OR REPLACE VIEW vip_business_overview AS
SELECT 
  COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND (migration_source IS NULL OR claimed_at IS NOT NULL)) as active_vip_members,
  COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND migration_source IS NOT NULL AND claimed_at IS NULL) as unclaimed_vip_businesses,
  COUNT(*) FILTER (WHERE plan_name = 'VIP Plan') as total_vip_plan_businesses
FROM businesses;

-- Grant access to the view
GRANT SELECT ON vip_business_overview TO authenticated;

-- Add a function to get detailed VIP statistics
CREATE OR REPLACE FUNCTION get_vip_business_stats()
RETURNS TABLE(
  active_vip_members bigint,
  unclaimed_vip_businesses bigint,
  total_vip_plan_businesses bigint,
  vip_claim_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND (migration_source IS NULL OR claimed_at IS NOT NULL)) as active_vip_members,
    COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND migration_source IS NOT NULL AND claimed_at IS NULL) as unclaimed_vip_businesses,
    COUNT(*) FILTER (WHERE plan_name = 'VIP Plan') as total_vip_plan_businesses,
    CASE 
      WHEN COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND migration_source IS NOT NULL) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND migration_source IS NOT NULL AND claimed_at IS NOT NULL)::numeric / 
         COUNT(*) FILTER (WHERE plan_name = 'VIP Plan' AND migration_source IS NOT NULL)::numeric) * 100, 2
      )
      ELSE 0 
    END as vip_claim_rate
  FROM businesses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_vip_business_stats() TO authenticated; 