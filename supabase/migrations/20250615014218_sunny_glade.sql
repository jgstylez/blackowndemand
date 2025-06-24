/*
  # Add position column to ads table

  1. Changes
    - Add `position` column to `ads` table with default value of 0
    - Add index on position column for better query performance
    - Update existing ads to have sequential position values

  2. Notes
    - This fixes the "column ads.position does not exist" error
    - Existing ads will be assigned position values based on their creation order
*/

-- Add the position column to the ads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ads' AND column_name = 'position'
  ) THEN
    ALTER TABLE ads ADD COLUMN position integer DEFAULT 0;
  END IF;
END $$;

-- Update existing ads to have sequential position values based on creation order
UPDATE ads 
SET position = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM ads
) AS subquery
WHERE ads.id = subquery.id;

-- Create index on position column for better performance
CREATE INDEX IF NOT EXISTS ads_position_idx ON ads (position);