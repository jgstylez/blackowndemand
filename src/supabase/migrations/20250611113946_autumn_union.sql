/*
  # Add User Account Deletion Function
  
  1. New Functions
    - delete_user_account: Securely deletes a user account and all associated data
    
  2. Security
    - Function runs with elevated privileges to access auth.users table
    - Only allows users to delete their own accounts
    - Cascading deletes handle related data cleanup
*/

-- Create function to delete user account
CREATE OR REPLACE FUNCTION delete_user_account(user_uuid uuid DEFAULT auth.uid())
RETURNS void AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Security check: users can only delete their own account
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  IF current_user_id != user_uuid THEN
    RAISE EXCEPTION 'Users can only delete their own account';
  END IF;
  
  -- Log the deletion attempt
  RAISE NOTICE 'Deleting user account: %', user_uuid;
  
  -- Delete user from auth.users table
  -- This will cascade delete related data due to foreign key constraints
  DELETE FROM auth.users WHERE id = user_uuid;
  
  -- Verify deletion
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found or could not be deleted';
  END IF;
  
  RAISE NOTICE 'User account successfully deleted: %', user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;

-- Create function to prepare account for deletion (optional cleanup)
CREATE OR REPLACE FUNCTION prepare_account_deletion(user_uuid uuid DEFAULT auth.uid())
RETURNS jsonb AS $$
DECLARE
  current_user_id uuid;
  business_count integer;
  subscription_count integer;
  deletion_summary jsonb;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Security check
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  IF current_user_id != user_uuid THEN
    RAISE EXCEPTION 'Users can only check their own account';
  END IF;
  
  -- Count user's businesses
  SELECT COUNT(*) INTO business_count
  FROM businesses
  WHERE owner_id = user_uuid;
  
  -- Count user's subscriptions
  SELECT COUNT(*) INTO subscription_count
  FROM subscriptions s
  JOIN businesses b ON b.subscription_id = s.id
  WHERE b.owner_id = user_uuid;
  
  -- Create summary
  deletion_summary := jsonb_build_object(
    'user_id', user_uuid,
    'businesses_to_delete', business_count,
    'subscriptions_to_cancel', subscription_count,
    'can_delete', true,
    'warnings', CASE 
      WHEN business_count > 0 THEN 
        jsonb_build_array('You have ' || business_count || ' business listing(s) that will be permanently deleted')
      ELSE 
        jsonb_build_array()
    END
  );
  
  RETURN deletion_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION prepare_account_deletion(uuid) TO authenticated;