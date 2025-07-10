/*
  # Assign Migrated Plan to Existing Businesses
  
  1. Changes
    - Assign the "Migrated" plan to all businesses without an owner_id
    - Create subscriptions for these businesses
    - Update the subscription_id field for these businesses
    
  2. Process
    - Find the "Migrated" plan ID
    - Identify businesses without owner_id
    - Create subscriptions with the Migrated plan
    - Update businesses with their new subscription_id
    
  3. Verification
    - Count businesses before and after the update
    - Verify subscription creation
    - Log results for confirmation
*/

-- Start a transaction to ensure all operations succeed or fail together
BEGIN;

-- Create a function to assign the Migrated plan to businesses
DO $$
DECLARE
  migrated_plan_id uuid;
  business_record record;
  new_subscription_id uuid;
  businesses_updated integer := 0;
  businesses_skipped integer := 0;
BEGIN
  -- Get the Migrated plan ID
  SELECT id INTO migrated_plan_id
  FROM subscription_plans
  WHERE name = 'Migrated';
  
  IF migrated_plan_id IS NULL THEN
    RAISE EXCEPTION 'Migrated plan not found';
  END IF;
  
  RAISE NOTICE 'Found Migrated plan with ID: %', migrated_plan_id;
  
  -- Process each business without an owner_id and without a subscription_id
  FOR business_record IN 
    SELECT id, name 
    FROM businesses 
    WHERE owner_id IS NULL 
      AND subscription_id IS NULL
  LOOP
    -- Create a new subscription for this business
    INSERT INTO subscriptions (
      business_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      payment_status
    ) VALUES (
      business_record.id,
      migrated_plan_id,
      'active',
      now(),
      now() + interval '1 year',
      'paid'
    ) RETURNING id INTO new_subscription_id;
    
    -- Update the business with the new subscription_id
    UPDATE businesses
    SET 
      subscription_id = new_subscription_id,
      updated_at = now()
    WHERE id = business_record.id;
    
    businesses_updated := businesses_updated + 1;
    
    -- Log progress every 100 businesses
    IF businesses_updated % 100 = 0 THEN
      RAISE NOTICE 'Processed % businesses', businesses_updated;
    END IF;
  END LOOP;
  
  -- Count businesses that already had subscriptions
  SELECT COUNT(*) INTO businesses_skipped
  FROM businesses
  WHERE owner_id IS NULL AND subscription_id IS NOT NULL;
  
  RAISE NOTICE 'Migration complete: % businesses updated, % businesses already had subscriptions', 
    businesses_updated, businesses_skipped;
END $$;

-- Verify the results
DO $$
DECLARE
  total_businesses integer;
  businesses_with_subscription integer;
  businesses_without_subscription integer;
  migrated_plan_subscriptions integer;
BEGIN
  -- Count total businesses
  SELECT COUNT(*) INTO total_businesses FROM businesses;
  
  -- Count businesses with subscriptions
  SELECT COUNT(*) INTO businesses_with_subscription 
  FROM businesses 
  WHERE subscription_id IS NOT NULL;
  
  -- Count businesses without subscriptions
  SELECT COUNT(*) INTO businesses_without_subscription 
  FROM businesses 
  WHERE subscription_id IS NULL;
  
  -- Count subscriptions using the Migrated plan
  SELECT COUNT(*) INTO migrated_plan_subscriptions
  FROM subscriptions s
  JOIN subscription_plans p ON s.plan_id = p.id
  WHERE p.name = 'Migrated';
  
  RAISE NOTICE 'Verification results:';
  RAISE NOTICE '- Total businesses: %', total_businesses;
  RAISE NOTICE '- Businesses with subscription: %', businesses_with_subscription;
  RAISE NOTICE '- Businesses without subscription: %', businesses_without_subscription;
  RAISE NOTICE '- Subscriptions using Migrated plan: %', migrated_plan_subscriptions;
END $$;

COMMIT;