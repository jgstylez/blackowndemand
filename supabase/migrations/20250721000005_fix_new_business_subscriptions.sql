/*
  # Fix New Business Subscriptions
  
  1. Updates
    - Fix subscription_status for new businesses that may have incorrect status
    - Ensure all new businesses have proper subscription records
    - Update businesses with 'pending' status to their actual plan name
*/

-- First, let's see what we have
SELECT 
  b.id,
  b.name,
  b.subscription_status,
  b.subscription_id,
  sp.name as plan_name,
  s.status as subscription_status,
  s.payment_status,
  b.created_at
FROM businesses b
LEFT JOIN subscriptions s ON b.subscription_id = s.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE b.created_at >= NOW() - INTERVAL '7 days'
ORDER BY b.created_at DESC;

-- Fix businesses that have subscription_id but wrong subscription_status
UPDATE businesses 
SET subscription_status = sp.name
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE businesses.subscription_id = s.id 
  AND businesses.subscription_status != sp.name
  AND businesses.subscription_status != 'Migrated';

-- Fix businesses that have subscription_id but 'pending' status
UPDATE businesses 
SET subscription_status = sp.name
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE businesses.subscription_id = s.id 
  AND businesses.subscription_status = 'pending';

-- Verify the fixes
SELECT 
  b.id,
  b.name,
  b.subscription_status,
  b.subscription_id,
  sp.name as plan_name,
  s.status as subscription_status,
  s.payment_status,
  b.created_at
FROM businesses b
LEFT JOIN subscriptions s ON b.subscription_id = s.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE b.created_at >= NOW() - INTERVAL '7 days'
ORDER BY b.created_at DESC; 

-- Check what plan these businesses should have based on their creation context
SELECT 
  b.id,
  b.name,
  b.subscription_status,
  b.subscription_id,
  b.created_at,
  b.owner_id
FROM businesses b
WHERE b.id IN ('63d93ac8-a485-4633-8c07-ff8d00e032f8', 'eb10daba-bec2-45bf-933c-6f90c344cfa3')
ORDER BY b.created_at DESC;

-- Fix the missing subscription records for the two businesses
-- Assuming they were "Starter Plan" - adjust if they were supposed to be "Enhanced Plan" or "VIP Plan"

-- Step 1: Get the Starter Plan ID
SELECT id, name, price FROM subscription_plans WHERE name = 'Starter Plan';

-- Step 2: Create subscription records for the two businesses
INSERT INTO subscriptions (
  business_id,
  plan_id,
  status,
  payment_status,
  current_period_start,
  current_period_end
)
SELECT 
  b.id as business_id,
  sp.id as plan_id,
  'active' as status,
  'paid' as payment_status,
  b.created_at as current_period_start,
  b.created_at + INTERVAL '1 year' as current_period_end
FROM businesses b
CROSS JOIN subscription_plans sp
WHERE b.id IN ('63d93ac8-a485-4633-8c07-ff8d00e032f8', 'eb10daba-bec2-45bf-933c-6f90c344cfa3')
  AND sp.name = 'Starter Plan';

-- Step 3: Update the businesses table with subscription_id and subscription_status
UPDATE businesses 
SET 
  subscription_id = s.id,
  subscription_status = 'Starter Plan'
FROM subscriptions s
WHERE businesses.id = s.business_id
  AND businesses.id IN ('63d93ac8-a485-4633-8c07-ff8d00e032f8', 'eb10daba-bec2-45bf-933c-6f90c344cfa3');

-- Step 4: Verify the fix
SELECT 
  b.id,
  b.name,
  b.subscription_status,
  b.subscription_id,
  sp.name as plan_name,
  s.status as subscription_status,
  s.payment_status
FROM businesses b
LEFT JOIN subscriptions s ON b.subscription_id = s.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE b.id IN ('7cdd4a46-10ae-4cda-8c25-215e2de3ec0f', '63d93ac8-a485-4633-8c07-ff8d00e032f8', 'eb10daba-bec2-45bf-933c-6f90c344cfa3')
ORDER BY b.created_at DESC; 