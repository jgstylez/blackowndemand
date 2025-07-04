/*
  # Create announcement bar system
  
  1. New Tables
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text)
      - `message` (text)
      - `link_url` (text, optional)
      - `link_text` (text, optional)
      - `is_active` (boolean)
      - `background_color` (text, default)
      - `text_color` (text, default)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      
  2. Security
    - Enable RLS on announcements table
    - Public can view active announcements
    - Only authenticated users can manage announcements
*/

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  message text NOT NULL,
  link_url text,
  link_text text,
  is_active boolean DEFAULT false,
  background_color text DEFAULT '#1f2937', -- gray-800
  text_color text DEFAULT '#ffffff',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active announcements"
  ON announcements
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS announcements_active_idx ON announcements(is_active);
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements(created_at DESC);

-- Function to get the current active announcement
CREATE OR REPLACE FUNCTION get_active_announcement()
RETURNS TABLE(
  id uuid,
  title text,
  message text,
  link_url text,
  link_text text,
  background_color text,
  text_color text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.message,
    a.link_url,
    a.link_text,
    a.background_color,
    a.text_color
  FROM announcements a
  WHERE a.is_active = true
  ORDER BY a.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_announcement() TO public;
GRANT EXECUTE ON FUNCTION get_active_announcement() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_announcement() TO anon;

-- Insert a sample announcement
INSERT INTO announcements (
  title,
  message,
  link_url,
  link_text,
  is_active,
  background_color,
  text_color
) VALUES (
  'Welcome to BlackOWNDemand!',
  'Discover and support Black-owned businesses worldwide. Join our growing community today!',
  '/signup',
  'Get Started',
  true,
  '#1f2937',
  '#ffffff'
);