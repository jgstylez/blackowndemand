-- Drop the conflicting admin policy that might interfere with owner updates
DROP POLICY IF EXISTS "Admins can manage all businesses" ON businesses;

-- Recreate the admin policy with more specific permissions
CREATE POLICY "Admins can manage all businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (
    is_admin() AND (
      -- Admins can manage any business
      true
    )
  )
  WITH CHECK (
    is_admin() AND (
      -- Admins can update any business
      true
    )
  );

-- Ensure the owner policy is working correctly
DROP POLICY IF EXISTS "Users can manage their own businesses" ON businesses;

CREATE POLICY "Users can manage their own businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id); 