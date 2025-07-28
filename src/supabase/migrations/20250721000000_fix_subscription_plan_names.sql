/*
  # Fix Subscription Plan Names
  
  1. Updates
    - Ensure all subscription plans use correct names
    - "Starter Plan" (not "Basic")
    - "Enhanced Plan" (not "Enhanced") 
    - "VIP Plan"
    
  2. Fixes
    - Update any existing plans with incorrect names
    - Ensure consistency across the application
*/

-- Update any existing "Enhanced" plans to "Enhanced Plan"
UPDATE subscription_plans
SET name = 'Enhanced Plan', updated_at = now()
WHERE name = 'Enhanced';

-- Update any existing "Basic" plans to "Starter Plan"
UPDATE subscription_plans
SET name = 'Starter Plan', updated_at = now()
WHERE name = 'Basic';

-- Verify the correct plans exist
DO $$
DECLARE
  starter_plan_exists boolean;
  enhanced_plan_exists boolean;
  vip_plan_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM subscription_plans WHERE name = 'Starter Plan') INTO starter_plan_exists;
  SELECT EXISTS(SELECT 1 FROM subscription_plans WHERE name = 'Enhanced Plan') INTO enhanced_plan_exists;
  SELECT EXISTS(SELECT 1 FROM subscription_plans WHERE name = 'VIP Plan') INTO vip_plan_exists;
  
  IF NOT starter_plan_exists THEN
    RAISE WARNING 'Starter Plan does not exist - please create it';
  END IF;
  
  IF NOT enhanced_plan_exists THEN
    RAISE WARNING 'Enhanced Plan does not exist - please create it';
  END IF;
  
  IF NOT vip_plan_exists THEN
    RAISE WARNING 'VIP Plan does not exist - please create it';
  END IF;
  
  RAISE NOTICE 'Plan verification complete - Starter Plan: %, Enhanced Plan: %, VIP Plan: %', 
    starter_plan_exists, enhanced_plan_exists, vip_plan_exists;
END $$;

-- Show all plans for verification
SELECT name, price, interval FROM subscription_plans ORDER BY price; 