/*
  # Add Migrated Businesses Plan

  1. New Plan Type
    - Add a special "Migrated" plan for imported businesses
    - Limited features: only business name, image, and description
    - No cost ($0)
    - Maximum 1 image
    - Maximum 1 category

  2. Updates
    - Add migration_source column to track where businesses were imported from
    - Add claimed_at timestamp to track when businesses are claimed
*/

-- Add new plan for migrated businesses
INSERT INTO subscription_plans (
  name,
  price,
  interval,
  features,
  image_limit,
  category_limit
) VALUES (
  'Migrated',
  0,
  'year',
  jsonb_build_object(
    'directory_listing', true,
    'contact_info', false,
    'image_gallery', true,
    'basic_analytics', false,
    'social_links', false,
    'promo_video', false,
    'verified_badge', false
  ),
  1,
  1
) ON CONFLICT DO NOTHING;

-- Add columns for tracking migration source and claiming
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS migration_source text,
ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Update RLS policies to allow public access to migrated businesses
CREATE POLICY "Public can view migrated businesses"
  ON businesses
  FOR SELECT
  TO public
  USING (
    migration_source IS NOT NULL
    OR
    is_verified = true
  );

-- Create function to handle business claiming
CREATE OR REPLACE FUNCTION claim_business(
  business_id uuid,
  user_id uuid,
  new_subscription_id uuid
)
RETURNS void AS $$
BEGIN
  -- Verify business exists and is unclaimed
  IF NOT EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = business_id 
    AND migration_source IS NOT NULL 
    AND claimed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Business not found or already claimed';
  END IF;

  -- Update business record
  UPDATE businesses
  SET 
    owner_id = user_id,
    subscription_id = new_subscription_id,
    claimed_at = now(),
    updated_at = now()
  WHERE id = business_id;
END;
$$ LANGUAGE plpgsql;