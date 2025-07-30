/*
  # Fix VIP Migrated Businesses
  
  Problem: 594 businesses have plan_name = "VIP Plan" but are actually unclaimed migrated businesses
  Solution: Update them to have plan_name = "Migrated" until they are claimed
*/

-- First, let's see what we're working with
SELECT 
  COUNT(*) as total_vip_unclaimed,
  COUNT(*) FILTER (WHERE migration_source IS NOT NULL) as migrated_vip,
  COUNT(*) FILTER (WHERE claimed_at IS NULL) as unclaimed_vip
FROM businesses 
WHERE plan_name = 'VIP Plan';

-- Update unclaimed migrated businesses to have "Migrated" plan instead of "VIP Plan"
UPDATE businesses 
SET 
  plan_name = 'Migrated',
  subscription_status = 'active',
  updated_at = now()
WHERE 
  plan_name = 'VIP Plan' 
  AND migration_source IS NOT NULL 
  AND claimed_at IS NULL;

-- Create a function to handle VIP plan restoration when businesses are claimed
CREATE OR REPLACE FUNCTION restore_vip_plan_on_claim(
  business_id uuid,
  user_id uuid
)
RETURNS void AS $$
BEGIN
  -- When a migrated business is claimed, restore their VIP status
  UPDATE businesses
  SET 
    plan_name = 'VIP Plan',
    owner_id = user_id,
    claimed_at = now(),
    updated_at = now()
  WHERE 
    id = business_id 
    AND migration_source IS NOT NULL 
    AND claimed_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Update the claim_business function to restore VIP status
CREATE OR REPLACE FUNCTION claim_business(
  business_id uuid,
  user_id uuid,
  new_subscription_id uuid
)
RETURNS void AS $$
DECLARE
  was_vip boolean;
BEGIN
  -- Check if this was originally a VIP business
  SELECT plan_name = 'VIP Plan' INTO was_vip
  FROM businesses 
  WHERE id = business_id;
  
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
    updated_at = now(),
    -- Restore VIP plan if it was originally VIP
    plan_name = CASE 
      WHEN was_vip THEN 'VIP Plan'
      ELSE 'Migrated'
    END
  WHERE id = business_id;
END;
$$ LANGUAGE plpgsql; 