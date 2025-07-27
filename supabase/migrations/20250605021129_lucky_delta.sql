/*
  # Create user settings table

  1. New Tables
    - `user_settings`
      - `user_id` (uuid, primary key, references auth.users)
      - `settings` (jsonb, stores user preferences)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `user_settings` table
    - Add policies for users to:
      - View their own settings
      - Update their own settings
      - Insert their own settings
*/

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comment to the table
COMMENT ON TABLE public.user_settings IS 'Stores user preferences and settings';