import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';

export const useVipBusinesses = (limit: number = 50) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch VIP businesses using the RPC function
      const { data, error: fetchError } = await supabase
        .rpc('get_businesses_with_plan_details_v2', {
          p_subscription_plan_name: 'VIP Plan',
          p_is_active: true,
          p_limit: limit
        });

      if (fetchError) {
        throw fetchError;
      }
      
      setBusinesses(data || []);
      setTotalCount(data && data.length > 0 ? data[0].total_count : 0);
    } catch (err) {
      const error = err as Error;
      setError(error);
      logError('Error fetching VIP businesses', {
        context: 'useVipBusinesses',
        metadata: { error: err }
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
    refetch: fetchBusinesses
  };
};

export default useVipBusinesses;