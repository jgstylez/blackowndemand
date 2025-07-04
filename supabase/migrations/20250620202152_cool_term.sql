-- Check if editor role exists, if not create it
DO $$
DECLARE
  editor_role_exists boolean;
BEGIN
  -- Check if editor role exists
  SELECT EXISTS(
    SELECT 1 FROM roles WHERE name = 'editor'
  ) INTO editor_role_exists;
  
  -- If editor role doesn't exist, create it
  IF NOT editor_role_exists THEN
    INSERT INTO roles (name, description, permissions)
    VALUES (
      'editor',
      'Content editor with access to most admin features except sensitive settings',
      '["manage_businesses", "manage_announcements", "manage_ads", "view_analytics", "manage_newsletter", "manage_discount_codes", "manage_promotions"]'::jsonb
    );
    
    RAISE NOTICE 'Editor role created successfully';
  ELSE
    -- Update existing editor role permissions without updated_at column
    UPDATE roles
    SET 
      description = 'Content editor with access to most admin features except sensitive settings',
      permissions = '["manage_businesses", "manage_announcements", "manage_ads", "view_analytics", "manage_newsletter", "manage_discount_codes", "manage_promotions"]'::jsonb
    WHERE name = 'editor';
    
    RAISE NOTICE 'Editor role updated successfully';
  END IF;
END $$;

-- Create function to check if a user has editor role
CREATE OR REPLACE FUNCTION is_editor(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  editor_role_exists boolean;
BEGIN
  -- Check if the user has the editor role
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND r.name = 'editor'
  ) INTO editor_role_exists;
  
  RETURN editor_role_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION is_editor(uuid) TO public;