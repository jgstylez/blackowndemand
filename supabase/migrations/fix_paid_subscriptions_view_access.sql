-- Fix paid_subscriptions_overview view access
-- Remove SECURITY DEFINER and let view inherit RLS from underlying tables

-- Drop the existing view
DROP VIEW IF EXISTS paid_subscriptions_overview;

-- Recreate the view without SECURITY DEFINER (default is SECURITY INVOKER)
CREATE OR REPLACE VIEW paid_subscriptions_overview AS
SELECT
  s.id AS subscription_id,
  sp.name AS plan_name,
  sp.price AS plan_price,
  s.status AS subscription_status,
  s.payment_status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  b.id AS business_id,
  b.name AS business_name,
  b.is_verified,
  b.is_featured,
  b.city,
  b.state,
  b.country,
  b.owner_id,
  u.email AS owner_email,
  p.first_name AS owner_first_name,
  p.last_name AS owner_last_name,
  CASE 
    WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN p.first_name || ' ' || p.last_name
    WHEN p.first_name IS NOT NULL THEN p.first_name
    WHEN p.last_name IS NOT NULL THEN p.last_name
    ELSE NULL
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
ORDER BY
  s.created_at DESC;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON paid_subscriptions_overview TO authenticated;
GRANT SELECT ON paid_subscriptions_overview TO service_role; 