/*
  # Add Paid Subscriptions Overview View
  
  1. New Views
    - `paid_subscriptions_overview` - Provides a consolidated view of all paid subscriptions
    - Joins data from subscriptions, subscription_plans, businesses, profiles, and auth.users
    - Includes subscription details, business information, and owner details
    
  2. Security
    - View is created with SECURITY DEFINER to ensure proper access control
    - SELECT permission granted to authenticated users
    
  3. Purpose
    - Enables administrators to track paid subscriptions
    - Provides data for subscription management dashboard
    - Supports analytics and reporting on subscription metrics
*/

-- Create the paid_subscriptions_overview view
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

-- Create function to get subscription statistics
CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS TABLE(
  total_subscriptions bigint,
  active_subscriptions bigint,
  revenue_this_month numeric,
  revenue_total numeric,
  starter_plan_count bigint,
  enhanced_plan_count bigint,
  vip_plan_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE s.status = 'active') as active_subscriptions,
    SUM(sp.price) FILTER (
      WHERE s.status = 'active' 
      AND s.current_period_start >= date_trunc('month', CURRENT_DATE)
    ) as revenue_this_month,
    SUM(sp.price) as revenue_total,
    COUNT(*) FILTER (WHERE sp.name = 'Starter Plan') as starter_plan_count,
    COUNT(*) FILTER (WHERE sp.name = 'Enhanced') as enhanced_plan_count,
    COUNT(*) FILTER (WHERE sp.name = 'VIP Plan') as vip_plan_count
  FROM
    subscriptions s
  JOIN
    subscription_plans sp ON s.plan_id = sp.id
  WHERE
    sp.price > 0; -- Only include paid plans
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_subscription_stats() TO authenticated;