/*
  # Fix get_businesses_with_plan_details function to include missing fields
  
  1. Changes
    - Add promo_video_url field to the SELECT statement
    - Add other missing fields that are needed for business display
    - Ensure all business fields are properly returned
    - NOTE: nmi_subscription_id and nmi_customer_vault_id are accessed from subscriptions table, not businesses table
*/

CREATE OR REPLACE FUNCTION public.get_businesses_with_plan_details(
  p_is_active boolean DEFAULT NULL,
  p_is_featured boolean DEFAULT NULL,
  p_subscription_plans text DEFAULT NULL,
  p_business_id uuid DEFAULT NULL,
  p_search_term text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  tagline text,
  description text,
  category business_category_enum,
  is_verified boolean,
  is_featured boolean,
  is_active boolean,
  city text,
  state text,
  zip_code text,
  country text,
  website_url text,
  phone text,
  email text,
  image_url text,
  promo_video_url text,
  social_links jsonb,
  business_hours jsonb,
  amenities text[],
  payment_methods text[],
  categories text[],
  tags business_tag_enum[],
  created_at timestamptz,
  updated_at timestamptz,
  owner_id uuid,
  subscription_id uuid,
  is_claimed boolean,
  claimed_at timestamptz,
  migration_source text,
  is_resource boolean,
  subscription_status text,
  nmi_subscription_id text,
  nmi_customer_vault_id text,
  next_billing_date timestamptz,
  last_payment_date timestamptz,
  payment_method_last_four text,
  featured_position integer,
  views_count bigint,
  last_viewed_at timestamptz,
  analytics_data jsonb,
  total_actions bigint,
  subscription_plans text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_records bigint;
BEGIN
  -- First, get the total count for pagination
  SELECT COUNT(*)
  INTO total_records
  FROM businesses b
  LEFT JOIN subscriptions s ON b.subscription_id = s.id
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE 
    -- Apply all the same filters as the main query
    (p_is_active IS NULL OR b.is_active = p_is_active)
    AND (p_is_featured IS NULL OR b.is_featured = p_is_featured)
    AND (p_business_id IS NULL OR b.id = p_business_id)
    AND (p_subscription_plans IS NULL OR sp.name = p_subscription_plans)
    AND (
      p_search_term IS NULL OR 
      b.name ILIKE '%' || p_search_term || '%' OR
      b.tagline ILIKE '%' || p_search_term || '%' OR
      b.description ILIKE '%' || p_search_term || '%'
    )
    AND (
      p_category IS NULL OR 
      b.category::text = p_category OR
      b.category::text ILIKE '%' || p_category || '%'
    )
    AND (
      p_location IS NULL OR
      b.city ILIKE '%' || p_location || '%' OR
      b.state ILIKE '%' || p_location || '%' OR
      b.country ILIKE '%' || p_location || '%'
    );

  -- Return the paginated results with total count
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.tagline,
    b.description,
    b.category,
    b.is_verified,
    b.is_featured,
    b.is_active,
    b.city,
    b.state,
    b.zip_code,
    b.country,
    b.website_url,
    b.phone,
    b.email,
    b.image_url,
    b.promo_video_url,
    b.social_links,
    b.business_hours,
    b.amenities,
    b.payment_methods,
    b.categories,
    b.tags,
    b.created_at,
    b.updated_at,
    b.owner_id,
    b.subscription_id,
    b.is_claimed,
    b.claimed_at,
    b.migration_source,
    b.is_resource,
    b.subscription_status,
    b.nmi_subscription_id,
    b.nmi_customer_vault_id,
    b.next_billing_date,
    b.last_payment_date,
    b.payment_method_last_four,
    b.featured_position,
    b.views_count,
    b.last_viewed_at,
    b.analytics_data,
    b.total_actions,
    COALESCE(sp.name, 'Free') as subscription_plans,
    total_records as total_count
  FROM businesses b
  LEFT JOIN subscriptions s ON b.subscription_id = s.id
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE 
    (p_is_active IS NULL OR b.is_active = p_is_active)
    AND (p_is_featured IS NULL OR b.is_featured = p_is_featured)
    AND (p_business_id IS NULL OR b.id = p_business_id)
    AND (p_subscription_plans IS NULL OR sp.name = p_subscription_plans)
    AND (
      p_search_term IS NULL OR 
      b.name ILIKE '%' || p_search_term || '%' OR
      b.tagline ILIKE '%' || p_search_term || '%' OR
      b.description ILIKE '%' || p_search_term || '%'
    )
    AND (
      p_category IS NULL OR 
      b.category::text = p_category OR
      b.category::text ILIKE '%' || p_category || '%'
    )
    AND (
      p_location IS NULL OR
      b.city ILIKE '%' || p_location || '%' OR
      b.state ILIKE '%' || p_location || '%' OR
      b.country ILIKE '%' || p_location || '%'
    )
  ORDER BY 
    -- VIP businesses first
    CASE WHEN sp.name = 'VIP Plan' THEN 1 ELSE 2 END,
    -- Then featured businesses
    CASE WHEN b.is_featured THEN 1 ELSE 2 END,
    -- Then by creation date (newest first)
    b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_businesses_with_plan_details TO anon;
GRANT EXECUTE ON FUNCTION public.get_businesses_with_plan_details TO authenticated;

-- Also update the v2 function to include the missing fields
CREATE OR REPLACE FUNCTION get_businesses_with_plan_details_v2(
  p_is_featured BOOLEAN DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_subscription_plans TEXT DEFAULT NULL,
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
  is_active BOOLEAN,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  promo_video_url TEXT,
  social_links JSONB,
  business_hours JSONB,
  amenities TEXT[],
  payment_methods TEXT[],
  categories TEXT[],
  tags business_tag_enum[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  owner_id UUID,
  subscription_id UUID,
  is_claimed BOOLEAN,
  claimed_at TIMESTAMPTZ,
  migration_source TEXT,
  is_resource BOOLEAN,
  subscription_status TEXT,
  nmi_subscription_id TEXT,
  nmi_customer_vault_id TEXT,
  next_billing_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  payment_method_last_four TEXT,
  featured_position INTEGER,
  views_count BIGINT,
  last_viewed_at TIMESTAMPTZ,
  analytics_data JSONB,
  total_actions BIGINT,
  subscription_plans TEXT,
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
      b.is_active,
      b.city,
      b.state,
      b.zip_code,
      b.country,
      b.website_url,
      b.phone,
      b.email,
      b.image_url,
      b.promo_video_url,
      b.social_links,
      b.business_hours,
      b.amenities,
      b.payment_methods,
      b.categories,
      b.tags,
      b.created_at,
      b.updated_at,
      b.owner_id,
      b.subscription_id,
      b.is_claimed,
      b.claimed_at,
      b.migration_source,
      b.is_resource,
      b.subscription_status,
      b.nmi_subscription_id,
      b.nmi_customer_vault_id,
      b.next_billing_date,
      b.last_payment_date,
      b.payment_method_last_four,
      b.featured_position,
      b.views_count,
      b.last_viewed_at,
      b.analytics_data,
      b.total_actions,
      COALESCE(sp.name, 'Free') as subscription_plans
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
      AND (p_subscription_plans IS NULL OR 
           (p_subscription_plans = 'Migrated' AND b.migration_source IS NOT NULL) OR
           (p_subscription_plans != 'Migrated' AND COALESCE(sp.name, 'Free') = p_subscription_plans))
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
      AND (p_subscription_plans IS NULL OR 
           (p_subscription_plans = 'Migrated' AND b.migration_source IS NOT NULL) OR
           (p_subscription_plans != 'Migrated' AND COALESCE(sp.name, 'Free') = p_subscription_plans))
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