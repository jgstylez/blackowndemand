/*
  # Add plan_name field and fix subscription_status values
  
  1. Changes
    - Add plan_name field to businesses table to store the actual plan name
    - Update subscription_status to only allow 'pending' or 'active' values
    - Migrate existing data to use the correct field structure
*/

-- Add plan_name field to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS plan_name text;

-- Update subscription_status to only allow 'pending' or 'active'
-- First, update existing businesses that have plan names in subscription_status
UPDATE businesses 
SET 
  plan_name = subscription_status,
  subscription_status = CASE 
    WHEN subscription_status IN ('Starter Plan', 'Enhanced Plan', 'VIP Plan', 'Migrated') THEN 'active'
    WHEN subscription_status = 'pending' THEN 'pending'
    ELSE 'pending'
  END
WHERE subscription_status IS NOT NULL;

-- Create a check constraint to ensure subscription_status only allows 'pending' or 'active'
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS check_subscription_status;

ALTER TABLE businesses 
ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('pending', 'active'));

-- Update the default value for subscription_status
ALTER TABLE businesses 
ALTER COLUMN subscription_status SET DEFAULT 'pending';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS businesses_plan_name_idx ON businesses(plan_name);
CREATE INDEX IF NOT EXISTS businesses_subscription_status_idx ON businesses(subscription_status);

-- Verify the changes
SELECT 
  id,
  name,
  subscription_status,
  plan_name,
  subscription_id
FROM businesses 
WHERE subscription_status IS NOT NULL
ORDER BY created_at DESC
LIMIT 10; 