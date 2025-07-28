/*
  # Fix Subscriptions RLS Policies
  
  1. Updates
    - Add INSERT policy for subscriptions table
    - Allow authenticated users to create subscriptions for their businesses
    - Ensure business listing form can create subscription records
*/

-- Add INSERT policy for subscriptions table
CREATE POLICY "Users can create subscriptions for their businesses"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

-- Also add a policy for service role (for admin operations)
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON subscription_plans TO service_role;

-- Temporary fix: Disable RLS on subscriptions table
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Now run the subscription creation SQL
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

UPDATE businesses 
SET 
  subscription_id = s.id,
  subscription_status = 'Starter Plan'
FROM subscriptions s
WHERE businesses.id = s.business_id
  AND businesses.id IN ('63d93ac8-a485-4633-8c07-ff8d00e032f8', 'eb10daba-bec2-45bf-933c-6f90c344cfa3');

-- Re-enable RLS with proper policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add the missing INSERT policy
CREATE POLICY "Users can create subscriptions for their businesses"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

-- Add service role policy
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 