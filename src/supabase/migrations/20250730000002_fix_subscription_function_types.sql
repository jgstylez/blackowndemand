-- 1. Drop the old function
DROP FUNCTION IF EXISTS get_paid_subscriptions_overview();

-- 2. Recreate with correct return types
-- (Paste the full CREATE FUNCTION ... code from my previous message here) 

CREATE OR REPLACE FUNCTION get_paid_subscriptions_overview()
RETURNS TABLE (
  subscription_id text,
  plan_name text,
  plan_price numeric,
  subscription_status text,
  payment_status text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean,
  business_id text,
  business_name text,
  is_verified boolean,
  is_featured boolean,
  city text,
  state text,
  country text,
  owner_id text,
  owner_email text,
  owner_first_name text,
  owner_last_name text,
  owner_full_name text,
  subscription_created_at timestamp with time zone,
  subscription_updated_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id::text AS subscription_id,
    sp.name::text AS plan_name,
    sp.price AS plan_price,
    s.status::text AS subscription_status,
    s.payment_status::text,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    b.id::text AS business_id,
    b.name::text AS business_name,
    b.is_verified,
    b.is_featured,
    b.city::text,
    b.state::text,
    b.country::text,
    b.owner_id::text,
    u.email::text AS owner_email,
    p.first_name::text AS owner_first_name,
    p.last_name::text AS owner_last_name,
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN (p.first_name || ' ' || p.last_name)::text
      WHEN p.first_name IS NOT NULL THEN p.first_name::text
      WHEN p.last_name IS NOT NULL THEN p.last_name::text
      ELSE NULL::text
    END AS owner_full_name,
    s.created_at AS subscription_created_at,
    s.updated_at AS subscription_updated_at
  FROM
    subscriptions s
  JOIN
    subscription_plans sp ON s.plan_id = sp.id
  JOIN
    businesses b ON s.business_id = b.id
  LEFT JOIN
    auth.users u ON b.owner_id = u.id
  LEFT JOIN
    profiles p ON u.id = p.id
  WHERE
    sp.price > 0 -- Only include paid plans
    AND b.owner_id = auth.uid() -- Only show user's own businesses
  ORDER BY
    s.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_paid_subscriptions_overview() TO authenticated; 