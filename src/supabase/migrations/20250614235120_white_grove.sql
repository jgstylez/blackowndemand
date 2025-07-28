/*
  # Add verification codes table for business claiming
  
  1. New Tables
    - `verification_codes`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `email` (text)
      - `code` (text)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `used` (boolean)
      
  2. Security
    - Enable RLS on verification_codes table
    - Only allow authenticated users to access their own codes
*/

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS verification_codes_business_id_idx ON verification_codes(business_id);
CREATE INDEX IF NOT EXISTS verification_codes_email_idx ON verification_codes(email);
CREATE INDEX IF NOT EXISTS verification_codes_expires_at_idx ON verification_codes(expires_at);

-- Create policy for accessing verification codes
CREATE POLICY "Only service role can access verification codes"
  ON verification_codes
  USING (false);

-- Create function to verify business code
CREATE OR REPLACE FUNCTION verify_business_code(
  p_business_id uuid,
  p_email text,
  p_code text
)
RETURNS boolean AS $$
DECLARE
  v_code_exists boolean;
BEGIN
  -- Check if a valid code exists
  SELECT EXISTS(
    SELECT 1 
    FROM verification_codes
    WHERE business_id = p_business_id
      AND email = p_email
      AND code = p_code
      AND expires_at > now()
      AND used = false
  ) INTO v_code_exists;
  
  -- If code exists and is valid, mark it as used
  IF v_code_exists THEN
    UPDATE verification_codes
    SET used = true
    WHERE business_id = p_business_id
      AND email = p_email
      AND code = p_code
      AND expires_at > now()
      AND used = false;
  END IF;
  
  RETURN v_code_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_business_code(uuid, text, text) TO authenticated;