/*
  # Add promo_video_url column to businesses table
  
  1. Changes
    - Add `promo_video_url` column to `businesses` table
    - This column will store links to promotional videos for businesses
    - Column is nullable since not all businesses will have promo videos
    
  2. Purpose
    - Support premium plan features for Enhanced and VIP plans
    - Allow businesses to showcase video content
*/

-- Add promo_video_url column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS promo_video_url text;

-- Verify the column was added
DO $$
BEGIN
  RAISE NOTICE 'Added promo_video_url column to businesses table';
  
  -- Check if column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'businesses' 
    AND column_name = 'promo_video_url'
  ) THEN
    RAISE NOTICE 'Column successfully added';
  ELSE
    RAISE WARNING 'Column was not added properly';
  END IF;
END $$;