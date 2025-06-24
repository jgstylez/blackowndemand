/*
  # Fix enum function for categories page
  
  1. Updates
    - Create a more robust function to get enum values
    - Add proper error handling
    - Test the function works correctly
    
  2. Security
    - Ensure proper permissions for public access
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_enum_values(text);

-- Create a more robust function to get enum values
CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
RETURNS text[] AS $$
DECLARE
  result text[];
BEGIN
  -- Get enum values from pg_enum
  SELECT ARRAY(
    SELECT enumlabel::text
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = enum_name
    ORDER BY e.enumsortorder
  ) INTO result;
  
  -- Return the result
  RETURN COALESCE(result, ARRAY[]::text[]);
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return empty array
    RETURN ARRAY[]::text[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_enum_values(text) TO public;
GRANT EXECUTE ON FUNCTION get_enum_values(text) TO anon;
GRANT EXECUTE ON FUNCTION get_enum_values(text) TO authenticated;

-- Test the function and show results
DO $$
DECLARE
  enum_values text[];
  enum_count integer;
BEGIN
  -- Test the function
  SELECT get_enum_values('business_category_enum') INTO enum_values;
  enum_count := array_length(enum_values, 1);
  
  RAISE NOTICE 'Found % enum values for business_category_enum', COALESCE(enum_count, 0);
  
  -- Show first few values
  IF enum_count > 0 THEN
    FOR i IN 1..LEAST(5, enum_count) LOOP
      RAISE NOTICE 'Enum value %: %', i, enum_values[i];
    END LOOP;
  ELSE
    RAISE NOTICE 'No enum values found - checking if enum exists...';
    
    -- Check if the enum type exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_category_enum') THEN
      RAISE NOTICE 'Enum type exists but has no values';
    ELSE
      RAISE NOTICE 'Enum type business_category_enum does not exist';
    END IF;
  END IF;
END $$;

-- Alternative: Create a simple view that can be queried directly
CREATE OR REPLACE VIEW business_category_enum_values AS
SELECT 
  enumlabel as category_value,
  enumsortorder as sort_order
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'business_category_enum'
ORDER BY e.enumsortorder;

-- Grant select on the view
GRANT SELECT ON business_category_enum_values TO public;
GRANT SELECT ON business_category_enum_values TO anon;
GRANT SELECT ON business_category_enum_values TO authenticated;

-- Show what's in the view
SELECT 'View contents:' as info;
SELECT * FROM business_category_enum_values LIMIT 10;