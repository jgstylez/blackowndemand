/*
  # Add Discount Codes System
  
  1. New Tables
    - `discount_codes` - Stores promotional discount codes
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `description` (text)
      - `discount_type` (text) - 'percentage' or 'fixed'
      - `discount_value` (numeric) - percentage or fixed amount
      - `max_uses` (integer) - maximum number of times code can be used
      - `current_uses` (integer) - current usage count
      - `valid_from` (timestamptz)
      - `valid_until` (timestamptz)
      - `is_active` (boolean)
      - `applies_to_plan` (text) - which plan(s) this code applies to
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on discount_codes table
    - Public can view active discount codes
    - Only admins can manage discount codes
    
  3. Functions
    - `validate_discount_code` - Checks if a code is valid and returns discount info
    - `apply_discount_code` - Applies a discount code and increments usage count
*/

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  applies_to_plan text, -- NULL means applies to all plans
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active discount codes"
  ON discount_codes
  FOR SELECT
  TO public
  USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );

CREATE POLICY "Admins can manage discount codes"
  ON discount_codes
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create function to validate a discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code text,
  p_plan_name text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  discount_record discount_codes%ROWTYPE;
  result jsonb;
BEGIN
  -- Find the discount code
  SELECT * INTO discount_record
  FROM discount_codes
  WHERE 
    code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (applies_to_plan IS NULL OR applies_to_plan = p_plan_name);
  
  -- Check if code was found
  IF discount_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Invalid or expired discount code'
    );
  END IF;
  
  -- Build result object
  result := jsonb_build_object(
    'valid', true,
    'discount_id', discount_record.id,
    'discount_type', discount_record.discount_type,
    'discount_value', discount_record.discount_value,
    'message', 'Discount code applied successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to apply a discount code (increment usage)
CREATE OR REPLACE FUNCTION apply_discount_code(
  p_code text
)
RETURNS boolean AS $$
DECLARE
  success boolean := false;
BEGIN
  -- Increment usage count
  UPDATE discount_codes
  SET 
    current_uses = current_uses + 1,
    updated_at = now()
  WHERE 
    code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  RETURNING true INTO success;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_discount_code(text, text) TO public;
GRANT EXECUTE ON FUNCTION apply_discount_code(text) TO authenticated;

-- Insert some sample discount codes
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  max_uses,
  valid_from,
  valid_until,
  applies_to_plan
) VALUES
  (
    'WELCOME25',
    '25% off any plan for new users',
    'percentage',
    25,
    100,
    now(),
    now() + interval '30 days',
    NULL
  ),
  (
    'ENHANCED50',
    '50% off Enhanced plan',
    'percentage',
    50,
    50,
    now(),
    now() + interval '14 days',
    'Enhanced'
  ),
  (
    'VIP20OFF',
    '$20 off VIP plan',
    'fixed',
    20,
    25,
    now(),
    now() + interval '30 days',
    'VIP Plan'
  ),
  (
    'MEMBER2025',
    'Special member discount - $25 off any plan',
    'fixed',
    25,
    NULL,
    now(),
    now() + interval '90 days',
    NULL
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON discount_codes(code);