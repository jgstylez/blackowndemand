/*
  # Fix get_businesses_with_plan_details function
  
  1. Changes
    - Rename function to get_businesses_with_plan_details_v2 to avoid name conflict
    - Keep the same functionality but with a unique name
    - Grant proper execute permissions
*/

CREATE OR REPLACE FUNCTION get_businesses_with_plan_details_v2(
  p_is_featured BOOLEAN DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_subscription_plan_name TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tagline TEXT,
  description TEXT,
  category business_category_enum,
  is_verified BOOLEAN,
  is_featured BOOLEAN,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  migration_source TEXT,
  subscription_plan_name TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_businesses AS (
    SELECT 
      b.id,
      b.name,
      b.tagline,
      b.description,
      b.category,
      b.is_verified,
      b.is_featured,
      b.city,
      b.state,
      b.zip_code,
      b.country,
      b.image_url,
      b.created_at,
      b.migration_source,
      COALESCE(sp.name, 'Free') as subscription_plan_name
    FROM businesses b
    LEFT JOIN subscriptions s ON b.subscription_id = s.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE 
      -- Apply RLS policies: only show active businesses that are verified or migrated
      b.is_active = true 
      AND (b.is_verified = true OR b.migration_source IS NOT NULL)
      -- Apply optional filters
      AND (p_is_featured IS NULL OR b.is_featured = p_is_featured)
      AND (p_is_active IS NULL OR b.is_active = p_is_active)
      AND (p_subscription_plan_name IS NULL OR 
           (p_subscription_plan_name = 'Migrated' AND b.migration_source IS NOT NULL) OR
           (p_subscription_plan_name != 'Migrated' AND COALESCE(sp.name, 'Free') = p_subscription_plan_name))
    ORDER BY 
      CASE WHEN b.is_featured THEN 0 ELSE 1 END,
      b.created_at DESC
    LIMIT p_limit
  ),
  total_count_query AS (
    SELECT COUNT(*) as total
    FROM businesses b
    LEFT JOIN subscriptions s ON b.subscription_id = s.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE 
      -- Apply same filters for count
      b.is_active = true 
      AND (b.is_verified = true OR b.migration_source IS NOT NULL)
      AND (p_is_featured IS NULL OR b.is_featured = p_is_featured)
      AND (p_is_active IS NULL OR b.is_active = p_is_active)
      AND (p_subscription_plan_name IS NULL OR 
           (p_subscription_plan_name = 'Migrated' AND b.migration_source IS NOT NULL) OR
           (p_subscription_plan_name != 'Migrated' AND COALESCE(sp.name, 'Free') = p_subscription_plan_name))
  )
  SELECT 
    fb.*,
    tc.total as total_count
  FROM filtered_businesses fb
  CROSS JOIN total_count_query tc;
END;
$$;

-- Grant execute permission to public (matches existing business table policies)
GRANT EXECUTE ON FUNCTION get_businesses_with_plan_details_v2 TO public;