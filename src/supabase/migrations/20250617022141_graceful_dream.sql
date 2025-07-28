/*
  # Add Promotions Table
  
  1. New Tables
    - `promotions` - Stores promotional offers for subscription plans
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `original_plan_id` (uuid, references subscription_plans)
      - `promotional_price` (numeric)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz, nullable)
      - `target_audience` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on promotions table
    - Public can view active promotions
    - Only admins can manage promotions
    
  3. Initial Data
    - Add VIP at Basic price promotion for claimed businesses
*/

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  original_plan_id uuid REFERENCES subscription_plans(id),
  promotional_price numeric NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  target_audience text NOT NULL DEFAULT 'all',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active promotions"
  ON promotions
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create function to get active promotions for a specific audience
CREATE OR REPLACE FUNCTION get_active_promotions(audience text DEFAULT 'all')
RETURNS SETOF promotions AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM promotions p
  WHERE p.is_active = true
    AND (p.target_audience = audience OR p.target_audience = 'all')
    AND (p.end_date IS NULL OR p.end_date > now())
    AND p.start_date <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_promotions(text) TO public;

-- Insert initial VIP promotion for claimed businesses
DO $$
DECLARE
  vip_plan_id uuid;
  basic_price numeric;
BEGIN
  -- Get VIP plan ID
  SELECT id INTO vip_plan_id
  FROM subscription_plans
  WHERE name = 'VIP Plan';
  
  -- Get Basic plan price
  SELECT price INTO basic_price
  FROM subscription_plans
  WHERE name = 'Basic';
  
  -- If we found both, create the promotion
  IF vip_plan_id IS NOT NULL AND basic_price IS NOT NULL THEN
    INSERT INTO promotions (
      name,
      description,
      original_plan_id,
      promotional_price,
      target_audience,
      is_active
    ) VALUES (
      'VIP Special Offer',
      'Get our premium VIP plan at the price of our Basic plan',
      vip_plan_id,
      basic_price,
      'claimed_businesses',
      true
    );
  END IF;
END $$;