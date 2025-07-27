-- Add RLS policy for admins to manage all businesses
CREATE POLICY "Admins can manage all businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add specific policy for featured position updates
CREATE POLICY "Admins can update featured positions"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin()); 