/*
  # Create function to get enum values
  
  1. New Functions
    - get_enum_values: Returns all values for a given enum type
    
  2. Security
    - Function is accessible to public for reading enum values
*/

-- Create function to get enum values
CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = enum_name
    ORDER BY enumsortorder
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION get_enum_values(text) TO public;

-- Test the function
SELECT get_enum_values('business_category_enum') as categories;