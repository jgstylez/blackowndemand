import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { logError } from "../../lib/errorLogger";

export const useLegacyBusinesses = (limit: number = 50) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the existing function that BrowsePage uses
      const { data, error: fetchError } = await supabase.rpc(
        "get_businesses_with_plan_details",
        {
          p_is_active: true,
          p_search_term: null,
          p_category: null,
          p_location: null,
          p_limit: limit,
          p_offset: 0,
        }
      );

      if (fetchError) {
        throw fetchError;
      }

      // Filter for legacy/migrated businesses
      const legacyBusinesses =
        data?.filter(
          (business: any) =>
            business.migration_source ||
            business.subscription_plan_name === "Migrated"
        ) || [];

      setBusinesses(legacyBusinesses);
      setTotalCount(legacyBusinesses.length);
    } catch (err) {
      const error = err as Error;
      setError(error);
      logError("Error fetching legacy businesses", {
        context: "useLegacyBusinesses",
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
    totalCount,
    refetch: fetchBusinesses,
  };
};

export default useLegacyBusinesses;
