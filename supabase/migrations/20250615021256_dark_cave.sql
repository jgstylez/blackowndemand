/*
  # Newsletter Management System
  
  1. New Tables
    - `newsletter_issues` - Stores newsletter metadata and content
    - `newsletter_content_items` - Stores individual content blocks within a newsletter
    - `newsletter_subscribers` - Stores email subscribers
    
  2. Security
    - Enable RLS on all tables
    - Admin-only access for management
    - Public access for subscription
    
  3. Note
    - This is a development-only feature
*/

-- Create newsletter_issues table
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  preview_text text,
  status text NOT NULL DEFAULT 'draft', -- draft, scheduled, sent
  scheduled_for timestamptz,
  sent_at timestamptz,
  html_content text,
  text_content text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create newsletter_content_items table
CREATE TABLE IF NOT EXISTS newsletter_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  type text NOT NULL, -- news, business, ad, referral, header, footer
  position integer NOT NULL DEFAULT 0,
  title text,
  content text,
  image_url text,
  link_url text,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  ad_id uuid REFERENCES ads(id) ON DELETE SET NULL,
  is_ai_generated boolean DEFAULT false,
  ai_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  status text NOT NULL DEFAULT 'active', -- active, unsubscribed, bounced
  source text, -- signup_form, business_registration, etc.
  preferences jsonb DEFAULT '{}'::jsonb,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for newsletter_issues
CREATE POLICY "Admins can manage newsletter issues"
  ON newsletter_issues
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create policies for newsletter_content_items
CREATE POLICY "Admins can manage newsletter content items"
  ON newsletter_content_items
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create policies for newsletter_subscribers
CREATE POLICY "Admins can manage newsletter subscribers"
  ON newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to subscribe to newsletter
CREATE OR REPLACE FUNCTION subscribe_to_newsletter(
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_source text DEFAULT 'api'
)
RETURNS boolean AS $$
DECLARE
  v_success boolean := false;
BEGIN
  -- Validate email format
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Insert or update subscriber
  INSERT INTO newsletter_subscribers (
    email,
    first_name,
    last_name,
    source,
    status,
    updated_at
  )
  VALUES (
    lower(p_email),
    p_first_name,
    p_last_name,
    p_source,
    'active',
    now()
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, newsletter_subscribers.first_name),
    last_name = COALESCE(EXCLUDED.last_name, newsletter_subscribers.last_name),
    status = 'active',
    updated_at = now()
  RETURNING true INTO v_success;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION subscribe_to_newsletter(text, text, text, text) TO public;

-- Create function to unsubscribe from newsletter
CREATE OR REPLACE FUNCTION unsubscribe_from_newsletter(
  p_email text
)
RETURNS boolean AS $$
DECLARE
  v_success boolean := false;
BEGIN
  -- Update subscriber status
  UPDATE newsletter_subscribers
  SET 
    status = 'unsubscribed',
    updated_at = now()
  WHERE email = lower(p_email)
  RETURNING true INTO v_success;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION unsubscribe_from_newsletter(text) TO public;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS newsletter_issues_status_idx ON newsletter_issues(status);
CREATE INDEX IF NOT EXISTS newsletter_issues_scheduled_for_idx ON newsletter_issues(scheduled_for);
CREATE INDEX IF NOT EXISTS newsletter_content_items_newsletter_id_idx ON newsletter_content_items(newsletter_id);
CREATE INDEX IF NOT EXISTS newsletter_content_items_position_idx ON newsletter_content_items(position);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers(status);