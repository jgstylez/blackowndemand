/*
  # Business Signup Schema Updates

  1. New Tables
    - `business_categories` - Predefined list of business categories
    - `business_amenities` - Predefined list of amenities
    - `business_payment_methods` - Predefined list of payment methods

  2. Changes
    - Add validation triggers for business data
    - Add RLS policies for business management

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create business_categories table
CREATE TABLE IF NOT EXISTS business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business categories"
  ON business_categories
  FOR SELECT
  TO public
  USING (true);

-- Create business_amenities table
CREATE TABLE IF NOT EXISTS business_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business amenities"
  ON business_amenities
  FOR SELECT
  TO public
  USING (true);

-- Create business_payment_methods table
CREATE TABLE IF NOT EXISTS business_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment methods"
  ON business_payment_methods
  FOR SELECT
  TO public
  USING (true);

-- Add validation trigger for business data
CREATE OR REPLACE FUNCTION validate_business_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
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

CREATE TRIGGER validate_business_data_trigger
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION validate_business_data();

-- Add default categories
INSERT INTO business_categories (name, slug) VALUES
  ('Restaurants', 'restaurants'),
  ('Retail', 'retail'),
  ('Professional Services', 'professional-services'),
  ('Health & Beauty', 'health-and-beauty'),
  ('Technology', 'technology'),
  ('Arts & Entertainment', 'arts-and-entertainment'),
  ('Education', 'education'),
  ('Financial Services', 'financial-services')
ON CONFLICT (name) DO NOTHING;

-- Add default amenities
INSERT INTO business_amenities (name) VALUES
  ('Wi-Fi'),
  ('Parking'),
  ('Wheelchair Accessible'),
  ('Family Friendly'),
  ('Pet Friendly'),
  ('Delivery'),
  ('Takeout'),
  ('Online Booking')
ON CONFLICT (name) DO NOTHING;

-- Add default payment methods
INSERT INTO business_payment_methods (name) VALUES
  ('Cash'),
  ('Credit Card'),
  ('Debit Card'),
  ('Mobile Payment'),
  ('Bank Transfer'),
  ('Cryptocurrency')
ON CONFLICT (name) DO NOTHING;