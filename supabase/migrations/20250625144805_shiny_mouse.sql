/*
  # Fix Profile Creation to Save First and Last Names
  
  1. Changes
    - Update the `create_profile_for_user` trigger function to extract first_name and last_name from raw_user_meta_data
    - Ensure these values are properly inserted into the profiles table
    - Add a migration to update existing profiles with missing names
    
  2. Security
    - Maintains existing RLS policies
    - No changes to access control
*/

-- Update the create_profile_for_user function to include first_name and last_name
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val text;
  last_name_val text;
BEGIN
  -- Extract first_name and last_name from raw_user_meta_data if available
  first_name_val := (NEW.raw_user_meta_data->>'first_name');
  last_name_val := (NEW.raw_user_meta_data->>'last_name');
  
  -- Insert into profiles with first_name and last_name
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    first_name_val,
    last_name_val,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    first_name = COALESCE(first_name_val, profiles.first_name),
    last_name = COALESCE(last_name_val, profiles.last_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS create_profile_after_user_created ON auth.users;

CREATE TRIGGER create_profile_after_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

-- Update existing profiles with missing names from auth.users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT 
      u.id, 
      u.raw_user_meta_data->>'first_name' as first_name,
      u.raw_user_meta_data->>'last_name' as last_name
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE 
      (p.first_name IS NULL OR p.last_name IS NULL) AND
      (u.raw_user_meta_data->>'first_name' IS NOT NULL OR u.raw_user_meta_data->>'last_name' IS NOT NULL)
  LOOP
    UPDATE profiles
    SET 
      first_name = COALESCE(user_record.first_name, first_name),
      last_name = COALESCE(user_record.last_name, last_name),
      updated_at = now()
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Updated profile for user %: first_name=%, last_name=%', 
      user_record.id, user_record.first_name, user_record.last_name;
  END LOOP;
END $$;

-- Create a function to manually update a user's profile from their auth metadata
CREATE OR REPLACE FUNCTION sync_user_profile_from_metadata(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  first_name_val text;
  last_name_val text;
  success boolean := false;
BEGIN
  -- Get first_name and last_name from auth.users
  SELECT 
    raw_user_meta_data->>'first_name',
    raw_user_meta_data->>'last_name'
  INTO 
    first_name_val,
    last_name_val
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Update the profile
  UPDATE profiles
  SET 
    first_name = COALESCE(first_name_val, first_name),
    last_name = COALESCE(last_name_val, last_name),
    updated_at = now()
  WHERE id = user_uuid
  RETURNING true INTO success;
  
  RETURN COALESCE(success, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sync_user_profile_from_metadata(uuid) TO authenticated;