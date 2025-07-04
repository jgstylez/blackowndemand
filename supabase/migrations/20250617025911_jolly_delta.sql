/*
  # Clear VIP Member Data
  
  1. Changes
    - Removes all current entries from the vip_member table
    - Ensures only businesses that explicitly pay for the VIP plan will have this status going forward
    
  2. Security
    - Maintains existing RLS policies
    - No changes to table structure or permissions
*/

-- Delete all records from the vip_member table
DELETE FROM vip_member;

-- Verify the deletion
DO $$
DECLARE
  remaining_count integer;
BEGIN
  -- Count remaining records
  SELECT COUNT(*) INTO remaining_count FROM vip_member;
  
  -- Log the result
  RAISE NOTICE 'VIP member table cleared. Remaining records: %', remaining_count;
END $$;