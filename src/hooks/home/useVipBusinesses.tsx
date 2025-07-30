import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { logError } from "../../lib/errorLogger";
import { isVipMember } from "../../utils/businessFeatureUtils";

export const useVipBusinesses = (limit: number = 50) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all businesses and filter for actual VIP members
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
          subscription_status,
          plan_name,
          migration_source,
          claimed_at
        `
        )
        .eq("is_active", true)
        .eq("subscription_status", "active")
        .order("featured_position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit * 2); // Fetch more to account for filtering

      if (fetchError) {
        throw fetchError;
      }

      // Filter for actual VIP members (not unclaimed migrated businesses)
      const vipBusinesses = (data || []).filter((business) =>
        isVipMember(business)
      );

      setBusinesses(vipBusinesses.slice(0, limit));
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
