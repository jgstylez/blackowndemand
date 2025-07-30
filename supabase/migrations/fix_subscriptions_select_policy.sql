-- Add SELECT policy for subscriptions table
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

-- Also add a policy for service role
CREATE POLICY "Service role can view all subscriptions"
  ON subscriptions
  FOR SELECT
  TO service_role
  USING (true); 