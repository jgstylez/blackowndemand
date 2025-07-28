-- Fix email validation to allow + characters and be more permissive
-- The current regex is too restrictive and doesn't properly handle + characters

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS validate_business_data_trigger ON businesses;

-- Update the validation function with a more permissive email regex
CREATE OR REPLACE FUNCTION validate_business_data()
RETURNS TRIGGER AS $$
BEGIN
  -- More permissive email validation that properly handles + characters
  -- This regex allows: user+tag@domain.com, user.name@domain.com, etc.
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Validate phone format (basic validation)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[0-9()-\s]{10,}$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;

  -- Validate website URL
  IF NEW.website_url IS NOT NULL AND NEW.website_url !~ '^https?://' THEN
    RAISE EXCEPTION 'Website URL must start with http:// or https://';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER validate_business_data_trigger
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION validate_business_data();

-- Test the new email validation with some examples
DO $$
BEGIN
  -- These should all pass validation
  RAISE NOTICE 'Testing email validation...';
  
  -- Test with + character (this was failing before)
  IF 'user+1@example.com' !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Email validation failed for user+1@example.com';
  END IF;
  
  -- Test with dots
  IF 'user.name@example.com' !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Email validation failed for user.name@example.com';
  END IF;
  
  -- Test with hyphens
  IF 'user-name@example.com' !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Email validation failed for user-name@example.com';
  END IF;
  
  -- Test with underscores
  IF 'user_name@example.com' !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Email validation failed for user_name@example.com';
  END IF;
  
  RAISE NOTICE 'Email validation tests passed!';
END $$; 