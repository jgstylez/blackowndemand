import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useUnifiedErrorHandler } from "../../utils/unifiedErrorHandler";

interface Business {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string;
  is_verified: boolean;
  is_featured: boolean;
  city: string;
  state: string;
  image_url: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  featured_position: number | null;
}

export const useFeaturedBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const { error, handleError, clearError } = useUnifiedErrorHandler({
    context: "FeaturedBusinesses",
    defaultMessage: "Failed to load featured businesses",
  });

  const fetchFeaturedBusinesses = async () => {
    try {
      setLoading(true);
      clearError();

      const { data, error: supabaseError } = await supabase
        .from("businesses")
        .select(
          `
          id,
          name,
          tagline,
          description,
          category,
          is_verified,
          is_featured,
          city,
          state,
          image_url,
          website_url,
          phone,
          email,
          featured_position
        `
        )
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("featured_position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (supabaseError) throw supabaseError;

      setBusinesses(data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedBusinesses();
  }, []);

  return {
    businesses,
    loading,
    error,
    refetch: fetchFeaturedBusinesses,
  };
};

export default useFeaturedBusinesses;
