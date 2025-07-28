/*
  # Initial schema for Black Business Directory

  1. New Tables
    - `businesses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `tagline` (text)
      - `description` (text)
      - `category` (text)
      - `is_verified` (boolean)
      - `is_featured` (boolean)
      - `city` (text)
      - `state` (text)
      - `zip_code` (text)
      - `country` (text)
      - `website_url` (text)
      - `phone` (text)
      - `email` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `owner_id` (uuid, references auth.users)

    - `business_tags`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `tag` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for:
      - Public read access to verified businesses
      - Owner CRUD access to their own businesses
      - Owner CRUD access to their business tags
*/

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  description text,
  category text,
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'USA',
  website_url text,
  phone text,
  email text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create business_tags table
CREATE TABLE IF NOT EXISTS business_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  tag text NOT NULL
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tags ENABLE ROW LEVEL SECURITY;

-- Policies for businesses
CREATE POLICY "Public can view verified businesses"
  ON businesses
  FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users can manage their own businesses"
  ON businesses
  USING (auth.uid() = owner_id);

-- Policies for business_tags
CREATE POLICY "Public can view tags of verified businesses"
  ON business_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_tags.business_id 
      AND businesses.is_verified = true
    )
  );

CREATE POLICY "Users can manage their own business tags"
  ON business_tags
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_tags.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS businesses_owner_id_idx ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS business_tags_business_id_idx ON business_tags(business_id);
CREATE INDEX IF NOT EXISTS businesses_verified_idx ON businesses(is_verified);