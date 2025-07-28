/*
  # Add missing analytics RPC functions
  
  1. New Functions
    - increment_business_views - Increments view count and updates last_viewed_at
    - increment_business_actions - Increments total_actions count
*/

-- Function to increment business views
CREATE OR REPLACE FUNCTION public.increment_business_views(business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE businesses 
  SET views_count = COALESCE(views_count, 0) + 1,
      last_viewed_at = now()
  WHERE id = business_id;
END;
$$;

-- Function to increment business actions
CREATE OR REPLACE FUNCTION public.increment_business_actions(business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE businesses 
  SET total_actions = COALESCE(total_actions, 0) + 1
  WHERE id = business_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_business_views TO anon;
GRANT EXECUTE ON FUNCTION public.increment_business_views TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_business_actions TO anon;
GRANT EXECUTE ON FUNCTION public.increment_business_actions TO authenticated; 