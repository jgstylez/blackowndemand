/*
  # Business Listings Schema Update

  1. New Tables
    - `subscription_plans`
      - Stores available subscription plans
      - Fields for price, features, and duration
    
    - `subscriptions`
      - Links businesses to their subscription plans
      - Tracks payment status and renewal dates
    
    - `business_images`
      - Stores additional business images
      - Linked to businesses table

  2. Updates to Existing Tables
    - Added new columns to `businesses` table
      - `subscription_id` for linking to subscriptions
      - `is_claimed` for business verification status
      - `social_links` for social media profiles
      - Additional contact and business details

  3. Security
    - RLS policies for all new tables
    - Updated policies for existing tables
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal NOT NULL,
  interval text NOT NULL,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (true);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

-- Create business_images table
CREATE TABLE IF NOT EXISTS business_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business images"
  ON business_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their business images"
  ON business_images
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

-- Update businesses table
ALTER TABLE businesses 
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES subscriptions(id),
  ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT '{}';

-- Create index for faster subscription lookups
CREATE INDEX IF NOT EXISTS businesses_subscription_id_idx ON businesses(subscription_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, interval, features) VALUES
  ('Basic', 12, 'year', '{"directory_listing": true, "contact_info": true, "image_gallery": true, "basic_analytics": true}'::jsonb),
  ('Enhanced', 60, 'year', '{"directory_listing": true, "contact_info": true, "image_gallery": true, "basic_analytics": true, "verified_badge": true, "priority_placement": true, "social_links": true, "promo_video": true}'::jsonb)
ON CONFLICT DO NOTHING;