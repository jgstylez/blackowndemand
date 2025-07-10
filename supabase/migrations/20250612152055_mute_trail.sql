/*
  # Create business_images table

  1. New Tables
    - `business_images`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key to businesses table)
      - `url` (text, image URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `business_images` table
    - Add policy for public to view business images
    - Add policy for business owners to manage their images

  3. Changes
    - Creates the missing business_images table that the application is trying to query
    - Establishes proper foreign key relationship with businesses table
    - Sets up appropriate security policies for image management
*/

-- Create business_images table
CREATE TABLE IF NOT EXISTS business_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE business_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view business images"
  ON business_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Business owners can manage their images"
  ON business_images
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS business_images_business_id_idx ON business_images(business_id);
CREATE INDEX IF NOT EXISTS business_images_created_at_idx ON business_images(created_at);