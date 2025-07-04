/*
  # Update Subscription Plans
  
  1. Changes
    - Rename "Basic" plan to "Starter Plan"
    - Update Enhanced Plan features and pricing
    - Add VIP Plan with appropriate features
    
  2. Fixes
    - Uses EXISTS check instead of ON CONFLICT for safer updates
    - Maintains data integrity with transaction
*/

-- Start a transaction
BEGIN;

-- Update the Starter Plan (formerly Basic)
UPDATE subscription_plans
SET 
  name = 'Starter Plan',
  price = 12,
  interval = 'year',
  features = jsonb_build_object(
    'directory_listing', true,
    'contact_info', true,
    'image_gallery', true,
    'basic_analytics', true
  ),
  image_limit = 5,
  category_limit = 1,
  updated_at = now()
WHERE name = 'Basic';

-- Update the Enhanced Plan
UPDATE subscription_plans
SET 
  price = 60,
  interval = 'year',
  features = jsonb_build_object(
    'directory_listing', true,
    'contact_info', true,
    'image_gallery', true,
    'basic_analytics', true,
    'social_links', true,
    'promo_video', true,
    'verified_badge', true,
    'higher_directory_placement', true,
    'category_prioritization', true,
    'special_offers', true
  ),
  image_limit = 20,
  category_limit = 3,
  updated_at = now()
WHERE name = 'Enhanced';

-- Check if VIP Plan exists, then update or insert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'VIP Plan') THEN
    -- Update existing VIP Plan
    UPDATE subscription_plans
    SET 
      price = 99,
      interval = 'year',
      features = jsonb_build_object(
        'directory_listing', true,
        'contact_info', true,
        'image_gallery', true,
        'basic_analytics', true,
        'social_links', true,
        'promo_video', true,
        'verified_badge', true,
        'higher_directory_placement', true,
        'category_prioritization', true,
        'special_offers', true,
        'exclusive_badge', true,
        'special_recognition', true,
        'bod_credits', true,
        'priority_placement', true,
        'exclusive_benefits', true
      ),
      image_limit = 20,
      category_limit = 3,
      updated_at = now()
    WHERE name = 'VIP Plan';
  ELSE
    -- Insert new VIP Plan
    INSERT INTO subscription_plans (
      name,
      price,
      interval,
      features,
      image_limit,
      category_limit,
      created_at,
      updated_at
    ) VALUES (
      'VIP Plan',
      99,
      'year',
      jsonb_build_object(
        'directory_listing', true,
        'contact_info', true,
        'image_gallery', true,
        'basic_analytics', true,
        'social_links', true,
        'promo_video', true,
        'verified_badge', true,
        'higher_directory_placement', true,
        'category_prioritization', true,
        'special_offers', true,
        'exclusive_badge', true,
        'special_recognition', true,
        'bod_credits', true,
        'priority_placement', true,
        'exclusive_benefits', true
      ),
      20,
      3,
      now(),
      now()
    );
  END IF;
END $$;

-- Clear all VIP member data as requested
DELETE FROM vip_member;

-- Verify the updates
DO $$
DECLARE
  starter_plan_exists boolean;
  enhanced_plan_exists boolean;
  vip_plan_exists boolean;
  starter_price numeric;
  enhanced_price numeric;
  vip_price numeric;
  vip_member_count integer;
BEGIN
  -- Check if plans exist with correct prices
  SELECT EXISTS(
    SELECT 1 FROM subscription_plans WHERE name = 'Starter Plan'
  ) INTO starter_plan_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM subscription_plans WHERE name = 'Enhanced'
  ) INTO enhanced_plan_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM subscription_plans WHERE name = 'VIP Plan'
  ) INTO vip_plan_exists;
  
  SELECT price INTO starter_price FROM subscription_plans WHERE name = 'Starter Plan';
  SELECT price INTO enhanced_price FROM subscription_plans WHERE name = 'Enhanced';
  SELECT price INTO vip_price FROM subscription_plans WHERE name = 'VIP Plan';
  
  -- Check VIP member count
  SELECT COUNT(*) INTO vip_member_count FROM vip_member;
  
  -- Log results
  RAISE NOTICE 'Starter Plan: exists=%, price=$%', starter_plan_exists, starter_price;
  RAISE NOTICE 'Enhanced Plan: exists=%, price=$%', enhanced_plan_exists, enhanced_price;
  RAISE NOTICE 'VIP Plan: exists=%, price=$%', vip_plan_exists, vip_price;
  RAISE NOTICE 'VIP member count after clearing: %', vip_member_count;
END $$;

-- Show all plans for verification
SELECT 
  name, 
  price, 
  interval, 
  image_limit, 
  category_limit, 
  jsonb_pretty(features) as features
FROM subscription_plans
ORDER BY price;

COMMIT;