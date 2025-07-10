/*
  # Fix Member Business Visibility
  
  1. Updates
    - Set migration_source for all businesses without owner_id (imported businesses)
    - Ensure all member businesses are properly flagged
    - Add vip_member entries for all imported businesses
    
  2. Security
    - Maintains existing RLS policies
    - Ensures proper member identification
*/

-- First, let's see what we're working with
DO $$
DECLARE
  total_businesses integer;
  businesses_with_migration integer;
  businesses_with_owner integer;
  businesses_without_owner integer;
BEGIN
  -- Count total businesses
  SELECT COUNT(*) INTO total_businesses FROM businesses;
  RAISE NOTICE 'Total businesses in database: %', total_businesses;
  
  -- Count businesses with migration_source
  SELECT COUNT(*) INTO businesses_with_migration FROM businesses WHERE migration_source IS NOT NULL;
  RAISE NOTICE 'Businesses with migration_source: %', businesses_with_migration;
  
  -- Count businesses with owner_id
  SELECT COUNT(*) INTO businesses_with_owner FROM businesses WHERE owner_id IS NOT NULL;
  RAISE NOTICE 'Businesses with owner_id: %', businesses_with_owner;
  
  -- Count businesses without owner_id (these are imported/member businesses)
  SELECT COUNT(*) INTO businesses_without_owner FROM businesses WHERE owner_id IS NULL;
  RAISE NOTICE 'Businesses without owner_id (imported): %', businesses_without_owner;
END $$;

-- Get or create the migration source for member businesses
INSERT INTO migration_sources (name, description)
VALUES ('member_import_2025', 'Member businesses imported in 2025 launch')
ON CONFLICT (name) DO NOTHING;

-- Update all businesses without owner_id to be member businesses
UPDATE businesses 
SET 
  migration_source = (SELECT name FROM migration_sources WHERE name = 'member_import_2025'),
  is_verified = true,
  updated_at = now()
WHERE owner_id IS NULL 
  AND migration_source IS NULL;

-- Add member status for all businesses that don't have it yet
INSERT INTO vip_member (business_id, benefits, joined_at)
SELECT 
  b.id,
  '{
    "lifetime_status": true,
    "priority_support": true,
    "private_network": true,
    "exclusive_access": true
  }'::jsonb,
  COALESCE(b.created_at, now())
FROM businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM vip_member fs WHERE fs.business_id = b.id
)
AND b.owner_id IS NULL;

-- Verify the changes
DO $$
DECLARE
  accessible_businesses integer;
  member_businesses integer;
BEGIN
  -- Count businesses accessible via RLS policy
  SELECT COUNT(*) INTO accessible_businesses 
  FROM businesses 
  WHERE is_verified = true OR migration_source IS NOT NULL;
  
  RAISE NOTICE 'Businesses now accessible via RLS: %', accessible_businesses;
  
  -- Count member businesses
  SELECT COUNT(*) INTO member_businesses 
  FROM businesses b
  JOIN vip_member fs ON fs.business_id = b.id;
  
  RAISE NOTICE 'Businesses with member status: %', member_businesses;
END $$;