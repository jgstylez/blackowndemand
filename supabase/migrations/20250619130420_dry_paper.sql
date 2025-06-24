-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'feature_flags' AND policyname = 'Public can view feature flags'
  ) THEN
    CREATE POLICY "Public can view feature flags"
      ON feature_flags
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'feature_flags' AND policyname = 'Admins can manage feature flags'
  ) THEN
    CREATE POLICY "Admins can manage feature flags"
      ON feature_flags
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- Create function to get feature flag status
CREATE OR REPLACE FUNCTION get_feature_flag_status(flag_name text)
RETURNS boolean AS $$
DECLARE
  flag_enabled boolean;
BEGIN
  SELECT is_enabled INTO flag_enabled
  FROM feature_flags
  WHERE name = flag_name;
  
  -- If flag doesn't exist, return false
  RETURN COALESCE(flag_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_feature_flag_status(text) TO public;

-- Insert initial feature flags
INSERT INTO feature_flags (name, description, is_enabled) VALUES
  ('enable_newsletter_management', 'Controls the visibility of the Newsletter Management tab in the admin dashboard', false),
  ('enable_announcement_bar', 'Controls the visibility of the Announcement Bar', false),
  ('show_test_card_logos', 'Controls the visibility of test credit card logos in the payment modal', false),
  ('enable_tip_feature', 'Controls the visibility of the "Tip this Business" button on business detail pages', false),
  ('show_test_card_buttons', 'Controls the visibility of test card buttons in the payment modal', false)
ON CONFLICT (name) DO NOTHING;

-- Create function to toggle feature flag
CREATE OR REPLACE FUNCTION toggle_feature_flag(flag_name text, new_status boolean)
RETURNS boolean AS $$
DECLARE
  success boolean := false;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can toggle feature flags';
  END IF;

  -- Update the feature flag
  UPDATE feature_flags
  SET 
    is_enabled = new_status,
    updated_at = now()
  WHERE name = flag_name
  RETURNING true INTO success;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_feature_flag(text, boolean) TO authenticated;