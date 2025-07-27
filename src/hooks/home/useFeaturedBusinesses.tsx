import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
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

      if (error) throw error;

      setBusinesses((data as any) || []);
    } catch (err: any) {
      console.error("Error fetching featured businesses:", err);
      setError(err.message);
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
