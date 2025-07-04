/*
  # Add Member Status and Migration Sources
  
  1. New Tables
    - migration_sources: Tracks sources of imported business data
    - vip_member: Tracks founding member benefits and status
    
  2. Changes
    - Add migration tracking for imported businesses
    - Set up member status for initial businesses
    
  3. Security
    - Enable RLS on new tables
    - Add public read access policies
*/

-- Create migration_sources table
CREATE TABLE IF NOT EXISTS migration_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create vip_member table
CREATE TABLE IF NOT EXISTS vip_member (
  business_id uuid PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  benefits jsonb DEFAULT '{
    "lifetime_status": true,
    "priority_support": true,
    "private_network": true,
    "exclusive_access": true
  }'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE migration_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_member ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can view migration sources"
  ON migration_sources
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view member status"
  ON vip_member
  FOR SELECT
  TO public
  USING (true);

-- Import initial businesses and set member status
DO $$
DECLARE
  v_source_id uuid;
  v_business_id1 uuid;
  v_business_id2 uuid;
BEGIN
  -- Create migration source
  INSERT INTO migration_sources (name, description)
  VALUES ('bdn_initial_import', 'Initial business import from BDN launch')
  RETURNING id INTO v_source_id;

  -- Import first business
  INSERT INTO businesses (
    id,
    name,
    description,
    email,
    image_url,
    migration_source,
    is_verified,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    'Black Dollar Movement',
    'Educating consumers and businesses on how group economics impacts our overall community.',
    'admin@blackdollarmovement.org',
    'bdn-default-ad.webp',
    v_source_id,
    true,
    now()
  )
  RETURNING id INTO v_business_id1;

  -- Import second business
  INSERT INTO businesses (
    id,
    name,
    description,
    email,
    image_url,
    migration_source,
    is_verified,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    'BodyAqua',
    'BodyAqua is a health infused beverage line; which supporta healthier skin from within and naturally boost metabolism naturally. BodyAqua had a great soothing taste and is diabetic friendly with no colors.',
    'body.water.customerservice@gmail.com',
    'images/pzTdd7XFuHmtcHTw53sxYGiFNXaFrZls.webp',
    v_source_id,
    true,
    now()
  )
  RETURNING id INTO v_business_id2;

  -- Set member status for imported businesses
  INSERT INTO vip_member (business_id)
  VALUES 
    (v_business_id1),
    (v_business_id2);

END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS businesses_migration_source_idx ON businesses(migration_source);
CREATE INDEX IF NOT EXISTS vip_member_joined_at_idx ON vip_member(joined_at);