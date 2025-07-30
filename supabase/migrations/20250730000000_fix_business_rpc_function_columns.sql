/*
  # Fix get_businesses_with_plan_details function column references
  
  Problem: Function is trying to access nmi_subscription_id and nmi_customer_vault_id from businesses table
  Solution: Update function to access these columns from subscriptions table where they actually exist
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
    s.nmi_subscription_id,  -- Fixed: Get from subscriptions table
    s.nmi_customer_vault_id,  -- Fixed: Get from subscriptions table
    b.next_billing_date,
    b.last_payment_date,
    b.payment_method_last_four,
    b.featured_position,
    b.views_count,
    b.last_viewed_at,
    b.analytics_data,
    b.total_actions,
    COALESCE(sp.name, b.plan_name, 'Free') as subscription_plans,
    total_records
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
    CASE WHEN COALESCE(sp.name, b.plan_name) = 'VIP Plan' THEN 1 ELSE 2 END,
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