-- Create functions for ad impression and click tracking
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ads 
  SET impressions_count = COALESCE(impressions_count, 0) + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ads 
  SET clicks_count = COALESCE(clicks_count, 0) + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$$;