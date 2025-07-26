-- Add featured_position column to businesses table for ordering featured businesses
ALTER TABLE public.businesses 
ADD COLUMN featured_position integer;

-- Create index for better performance when ordering featured businesses
CREATE INDEX idx_businesses_featured_position ON public.businesses(featured_position) WHERE is_featured = true;