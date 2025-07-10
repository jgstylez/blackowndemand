/*
  # Rename Basic Plan to Starter Plan
  
  1. Updates
    - Rename the "Basic" plan to "Starter Plan"
    - Update price, interval, features, image_limit, and category_limit
    - Maintain existing relationships and references
    
  2. Security
    - Maintains existing RLS policies
    - No changes to access control
*/

-- Update the Basic plan to Starter Plan
UPDATE subscription_plans
SET 
  name = 'Starter Plan',
  price = 12,
  interval = 'year',
  features = jsonb_build_object(
    'directory_listing', true,
    'contact_info', true,
    'image_gallery', true,
    'basic_analytics', true,
    'social_links', false,
    'promo_video', false,
    'verified_badge', false
  ),
  image_limit = 5,
  category_limit = 1,
  updated_at = now()
WHERE name = 'Basic';

-- Verify the update
DO $$
DECLARE
  plan_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM subscription_plans WHERE name = 'Starter Plan'
  ) INTO plan_exists;
  
  IF plan_exists THEN
    RAISE NOTICE 'Plan successfully renamed to "Starter Plan"';
  ELSE
    RAISE WARNING 'Plan rename failed - "Starter Plan" not found';
  END IF;
END $$;

-- Update any references to the Basic plan in promotions
UPDATE promotions
SET 
  name = REPLACE(name, 'Basic', 'Starter Plan'),
  description = REPLACE(description, 'Basic', 'Starter Plan'),
  updated_at = now()
WHERE name LIKE '%Basic%' OR description LIKE '%Basic%';