/*
  # User Role Management

  1. New Functions
    - `get_all_users_with_roles`: Retrieves all users with their assigned roles
    - `remove_user_role`: Removes a specific role from a user
  
  2. Security
    - Both functions are security definer functions
    - Permissions are granted to authenticated users
    - Functions check for admin privileges before execution
*/

-- Function to get all users with their roles
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS SETOF json AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT is_admin() INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only administrators can view all users and roles';
  END IF;

  RETURN QUERY
  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'created_at', u.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'roles', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description
          )
        )
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = u.id
      ),
      '[]'::json
    )
  )
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;

-- Function to remove a role from a user
CREATE OR REPLACE FUNCTION remove_user_role(
  p_user_id uuid,
  p_role_name text
)
RETURNS boolean AS $$
DECLARE
  v_role_id uuid;
  v_deleted boolean := FALSE;
  is_admin_user boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT is_admin() INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only administrators can remove user roles';
  END IF;

  -- Get the role_id from the roles table based on the role_name
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = p_role_name;

  -- If the role exists, delete the assignment
  IF v_role_id IS NOT NULL THEN
    DELETE FROM public.user_roles
    WHERE user_id = p_user_id AND role_id = v_role_id
    RETURNING TRUE INTO v_deleted;
  END IF;

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_user_role(uuid, text) TO authenticated;

-- Create function to check if a user has a specific role
CREATE OR REPLACE FUNCTION has_role(
  p_user_id uuid,
  p_role_name text
)
RETURNS boolean AS $$
DECLARE
  v_has_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND r.name = p_role_name
  ) INTO v_has_role;
  
  RETURN v_has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_role(uuid, text) TO public;