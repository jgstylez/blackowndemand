/*
  # Fix RPC Function Plan Names
  
  Update the get_subscription_stats function to use correct plan names
*/

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
    COUNT(*) FILTER (WHERE sp.name = 'Enhanced Plan') as enhanced_plan_count,
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