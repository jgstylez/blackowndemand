-- Update the VIP Plan's price in the subscription_plans table to its regular annual price ($120)
UPDATE subscription_plans
SET price = 120, updated_at = now()
WHERE name = 'VIP Plan';

-- Create a temporary table to store the VIP plan ID
CREATE TEMPORARY TABLE temp_vip_plan AS
SELECT id FROM subscription_plans WHERE name = 'VIP Plan';

-- Check if a promotion with this name already exists
DO $$
DECLARE
  vip_plan_id uuid;
  existing_promo_id uuid;
BEGIN
  -- Get the VIP plan ID
  SELECT id INTO vip_plan_id FROM temp_vip_plan;
  
  -- Check if promotion exists
  SELECT id INTO existing_promo_id 
  FROM promotions 
  WHERE name = 'Limited Time VIP Offer';
  
  IF existing_promo_id IS NOT NULL THEN
    -- Update existing promotion
    UPDATE promotions
    SET 
      description = 'Get the VIP plan at a special annual price of $99 (regularly $120)',
      original_plan_id = vip_plan_id,
      promotional_price = 99,
      start_date = now(),
      end_date = now() + interval '90 days',
      target_audience = 'all',
      is_active = true,
      updated_at = now()
    WHERE id = existing_promo_id;
  ELSE
    -- Insert new promotion
    INSERT INTO promotions (
      name,
      description,
      original_plan_id,
      promotional_price,
      start_date,
      end_date,
      target_audience,
      is_active
    ) VALUES (
      'Limited Time VIP Offer',
      'Get the VIP plan at a special annual price of $99 (regularly $120)',
      vip_plan_id,
      99,
      now(),
      now() + interval '90 days',
      'all',
      true
    );
  END IF;
END $$;

-- Drop the temporary table
DROP TABLE temp_vip_plan;

-- Create function to get active promotions for a plan
CREATE OR REPLACE FUNCTION get_active_promotion_for_plan(plan_name text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  original_plan_id uuid,
  original_plan_name text,
  original_price numeric,
  promotional_price numeric,
  start_date timestamptz,
  end_date timestamptz,
  savings_amount numeric,
  savings_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.original_plan_id,
    sp.name as original_plan_name,
    sp.price as original_price,
    p.promotional_price,
    p.start_date,
    p.end_date,
    (sp.price - p.promotional_price) as savings_amount,
    ROUND(((sp.price - p.promotional_price) / sp.price * 100)::numeric, 1) as savings_percentage
  FROM promotions p
  JOIN subscription_plans sp ON p.original_plan_id = sp.id
  WHERE 
    p.is_active = true
    AND (p.end_date IS NULL OR p.end_date > now())
    AND p.start_date <= now()
    AND sp.name = plan_name
    AND (p.target_audience = 'all' OR p.target_audience = 'new_users')
  ORDER BY p.promotional_price ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_promotion_for_plan(text) TO public;