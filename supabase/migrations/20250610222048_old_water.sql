/*
  # Admin System Setup
  
  1. New Tables
    - `user_roles` - Stores user role assignments
    - `roles` - Defines available roles and permissions
    
  2. Functions
    - `is_admin` - Check if a user has admin privileges
    - `assign_user_role` - Assign roles to users
    
  3. Security
    - RLS policies for role management
    - Admin-only access to role assignment
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system administrator', '["manage_businesses", "manage_users", "manage_announcements", "view_analytics", "manage_roles"]'::jsonb),
  ('moderator', 'Content moderator', '["manage_businesses", "manage_announcements"]'::jsonb),
  ('user', 'Regular user', '["manage_own_business"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Function to check if a user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid 
    AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id uuid,
  role_name text,
  assigned_by_user_id uuid DEFAULT auth.uid()
)
RETURNS void AS $$
DECLARE
  target_role_id uuid;
BEGIN
  -- Check if the assigner is admin
  IF NOT is_admin(assigned_by_user_id) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;
  
  -- Get role ID
  SELECT id INTO target_role_id FROM roles WHERE name = role_name;
  
  IF target_role_id IS NULL THEN
    RAISE EXCEPTION 'Role % does not exist', role_name;
  END IF;
  
  -- Insert or update role assignment
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (target_user_id, target_role_id, assigned_by_user_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove role from user
CREATE OR REPLACE FUNCTION remove_user_role(
  target_user_id uuid,
  role_name text,
  removed_by_user_id uuid DEFAULT auth.uid()
)
RETURNS void AS $$
DECLARE
  target_role_id uuid;
BEGIN
  -- Check if the remover is admin
  IF NOT is_admin(removed_by_user_id) THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  -- Get role ID
  SELECT id INTO target_role_id FROM roles WHERE name = role_name;
  
  IF target_role_id IS NULL THEN
    RAISE EXCEPTION 'Role % does not exist', role_name;
  END IF;
  
  -- Remove role assignment
  DELETE FROM user_roles 
  WHERE user_id = target_user_id AND role_id = target_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Anyone can view roles"
  ON roles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_role(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_role(uuid, text, uuid) TO authenticated;

-- Make you an admin (replace with your actual user ID when you know it)
-- This will be done after you create your account