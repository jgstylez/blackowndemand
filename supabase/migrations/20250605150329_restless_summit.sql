/*
  # Add member status to existing businesses
  
  1. Changes
    - Adds member status for all existing businesses
    - Sets default member benefits
    - Maintains data integrity with transaction
*/

DO $$
BEGIN
  -- Add member status for all existing businesses that don't have it yet
  INSERT INTO vip_member (business_id, benefits)
  SELECT 
    id,
    '{
      "lifetime_status": true,
      "priority_support": true,
      "private_network": true,
      "exclusive_access": true
    }'::jsonb
  FROM businesses b
  WHERE NOT EXISTS (
    SELECT 1 
    FROM vip_member fs 
    WHERE fs.business_id = b.id
  );
END $$;