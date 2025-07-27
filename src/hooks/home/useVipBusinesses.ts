import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { logError } from "../../lib/errorLogger";

export const useVipBusinesses = (limit: number = 50) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simple direct query to businesses table
      const { data, error: fetchError } = await supabase
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
          featured_position,
          subscription_status
        `
        )
        .eq("is_active", true)
        .eq("subscription_status", "VIP Plan")
        .order("featured_position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      setBusinesses(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error);
      logError("Error fetching VIP businesses", {
        context: "useVipBusinesses",
        metadata: { error: err },
      });
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  return {
    businesses,
    loading,
    error,
    refetch: fetchBusinesses,
  };
};

export default useVipBusinesses;
