/*
  # Add User Bookmarks System
  
  1. New Tables
    - `user_bookmarks` - Stores user bookmarks for businesses
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `business_id` (uuid, references businesses)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on user_bookmarks table
    - Users can only view, add, and remove their own bookmarks
    
  3. Functions
    - `add_bookmark` - Adds a bookmark for the current user
    - `remove_bookmark` - Removes a bookmark for the current user
    - `get_user_bookmarks` - Gets all bookmarks for a user
    - `is_bookmarked` - Checks if a business is bookmarked by the current user
*/

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Enable RLS
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bookmarks"
  ON user_bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own bookmarks"
  ON user_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own bookmarks"
  ON user_bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_bookmarks_user_id_idx ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_business_id_idx ON user_bookmarks(business_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_created_at_idx ON user_bookmarks(created_at);

-- Create function to add a bookmark
CREATE OR REPLACE FUNCTION add_bookmark(p_business_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_success boolean := false;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Insert bookmark if it doesn't exist
  INSERT INTO user_bookmarks (user_id, business_id)
  VALUES (v_user_id, p_business_id)
  ON CONFLICT (user_id, business_id) DO NOTHING
  RETURNING true INTO v_success;
  
  RETURN COALESCE(v_success, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove a bookmark
CREATE OR REPLACE FUNCTION remove_bookmark(p_business_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_success boolean := false;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Delete bookmark
  DELETE FROM user_bookmarks
  WHERE user_id = v_user_id AND business_id = p_business_id
  RETURNING true INTO v_success;
  
  RETURN COALESCE(v_success, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user bookmarks
CREATE OR REPLACE FUNCTION get_user_bookmarks(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(business_id uuid, created_at timestamptz) AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is requesting their own bookmarks
  IF auth.uid() != p_user_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'Users can only view their own bookmarks';
  END IF;
  
  -- Return bookmarks
  RETURN QUERY
  SELECT ub.business_id, ub.created_at
  FROM user_bookmarks ub
  WHERE ub.user_id = p_user_id
  ORDER BY ub.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a business is bookmarked by the current user
CREATE OR REPLACE FUNCTION is_bookmarked(p_business_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_is_bookmarked boolean;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- If not authenticated, return false
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if business is bookmarked
  SELECT EXISTS(
    SELECT 1 
    FROM user_bookmarks 
    WHERE user_id = v_user_id AND business_id = p_business_id
  ) INTO v_is_bookmarked;
  
  RETURN v_is_bookmarked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_bookmark(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_bookmark(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_bookmarks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_bookmarked(uuid) TO public;

-- Update delete_user_account function to ensure bookmarks are deleted
-- This is handled automatically by the ON DELETE CASCADE constraint
-- but we're documenting it here for clarity
COMMENT ON TABLE user_bookmarks IS 'Stores user bookmarks for businesses. Automatically deleted when a user account is removed via ON DELETE CASCADE.';