/*
  # Bootstrap First Admin User
  
  1. Direct Database Operations
    - Insert admin role assignment directly into user_roles table
    - Bypass the assign_user_role function security check
    - Set up the first admin user for the platform
    
  2. Verification
    - Verify the admin assignment worked
    - Test the is_admin function
*/

-- First, let's see if the user exists
DO $$
DECLARE
  user_exists boolean;
  admin_role_id uuid;
  user_id_to_assign uuid := '7e9c8d81-1b0c-4db4-8a11-e4500cf677c8';
BEGIN
  -- Check if user exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_id_to_assign
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE 'User with ID % does not exist', user_id_to_assign;
    RETURN;
  END IF;
  
  -- Get the admin role ID
  SELECT id INTO admin_role_id 
  FROM roles 
  WHERE name = 'admin';
  
  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'Admin role does not exist, creating it...';
    
    -- Create admin role if it doesn't exist
    INSERT INTO roles (name, description, permissions)
    VALUES (
      'admin',
      'Full administrative access to the platform',
      '["manage_users", "manage_businesses", "manage_announcements", "view_analytics"]'::jsonb
    )
    RETURNING id INTO admin_role_id;
    
    RAISE NOTICE 'Created admin role with ID: %', admin_role_id;
  END IF;
  
  -- Check if user already has admin role
  IF EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id_to_assign AND role_id = admin_role_id
  ) THEN
    RAISE NOTICE 'User already has admin role assigned';
    RETURN;
  END IF;
  
  -- Directly insert into user_roles table (bypassing the function)
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
  VALUES (
    user_id_to_assign,
    admin_role_id,
    user_id_to_assign, -- Self-assigned for bootstrap
    now()
  );
  
  RAISE NOTICE 'Successfully assigned admin role to user %', user_id_to_assign;
  
END $$;

-- Verify the admin assignment worked
DO $$
DECLARE
  user_email text;
  role_name text;
  assigned_at timestamptz;
  is_admin_result boolean;
BEGIN
  -- Get user details and role assignment
  SELECT 
    u.email,
    r.name,
    ur.assigned_at
  INTO user_email, role_name, assigned_at
  FROM auth.users u
  JOIN user_roles ur ON ur.user_id = u.id
  JOIN roles r ON r.id = ur.role_id
  WHERE u.id = '7e9c8d81-1b0c-4db4-8a11-e4500cf677c8';
  
  IF user_email IS NOT NULL THEN
    RAISE NOTICE 'User: %, Role: %, Assigned: %', user_email, role_name, assigned_at;
  ELSE
    RAISE NOTICE 'No role assignment found for user';
  END IF;
  
  -- Test the is_admin function
  SELECT is_admin('7e9c8d81-1b0c-4db4-8a11-e4500cf677c8') INTO is_admin_result;
  RAISE NOTICE 'is_admin() function result: %', is_admin_result;
  
END $$;