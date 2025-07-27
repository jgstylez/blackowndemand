/*
  # Add plan-specific limits and features

  1. Updates
    - Modify subscription_plans table to include specific feature limits
    - Add image_limit and category_limit columns
    - Update existing plan data with new limits

  2. Changes
    - Basic plan: 5 images, 1 category
    - Enhanced plan: 20 images, 3 categories
    - Added social_links, promo_video, and verified_badge features
*/

-- Add new columns to subscription_plans
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS image_limit integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS category_limit integer NOT NULL DEFAULT 1;

-- Update existing plans with new limits and features
UPDATE subscription_plans
SET 
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
  category_limit = 1
WHERE name = 'Basic';

UPDATE subscription_plans
SET 
  features = jsonb_build_object(
    'directory_listing', true,
    'contact_info', true,
    'image_gallery', true,
    'basic_analytics', true,
    'social_links', true,
    'promo_video', true,
    'verified_badge', true
  ),
  image_limit = 20,
  category_limit = 3
WHERE name = 'Enhanced';

-- Add categories array to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT ARRAY[]::text[];

-- Create function to validate category limit
CREATE OR REPLACE FUNCTION check_category_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the subscription plan for this business
  DECLARE
    plan_limit integer;
  BEGIN
    SELECT sp.category_limit INTO plan_limit
    FROM subscription_plans sp
    JOIN subscriptions s ON s.plan_id = sp.id
    WHERE s.id = NEW.subscription_id;

    -- Check if the number of categories exceeds the plan limit
    IF array_length(NEW.categories, 1) > plan_limit THEN
      RAISE EXCEPTION 'Category limit exceeded for subscription plan';
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce category limit
DROP TRIGGER IF EXISTS enforce_category_limit ON businesses;
CREATE TRIGGER enforce_category_limit
  BEFORE INSERT OR UPDATE OF categories
  ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION check_category_limit();

-- Create function to validate image limit
CREATE OR REPLACE FUNCTION check_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the subscription plan for this business
  DECLARE
    plan_limit integer;
    current_count integer;
  BEGIN
    SELECT sp.image_limit INTO plan_limit
    FROM subscription_plans sp
    JOIN subscriptions s ON s.plan_id = sp.id
    JOIN businesses b ON b.subscription_id = s.id
    WHERE b.id = NEW.business_id;

    -- Count existing images
    SELECT COUNT(*) INTO current_count
    FROM business_images
    WHERE business_id = NEW.business_id;

    -- Check if adding this image would exceed the limit
    IF current_count >= plan_limit THEN
      RAISE EXCEPTION 'Image limit exceeded for subscription plan';
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce image limit
DROP TRIGGER IF EXISTS enforce_image_limit ON business_images;
CREATE TRIGGER enforce_image_limit
  BEFORE INSERT
  ON business_images
  FOR EACH ROW
  EXECUTE FUNCTION check_image_limit();