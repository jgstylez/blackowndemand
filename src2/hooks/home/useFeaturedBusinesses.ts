import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';

export const useFeaturedBusinesses = (limit: number = 20) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch featured businesses using the RPC function
      const { data, error: fetchError } = await supabase
        .rpc('get_businesses_with_plan_details_v2', {
          p_is_featured: true,
          p_is_active: true,
          p_limit: limit
        });

      if (fetchError) {
        throw fetchError;
      }
      
      setBusinesses(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error);
      logError('Error fetching featured businesses', {
        context: 'useFeaturedBusinesses',
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
    refetch: fetchBusinesses
  };
};

export default useFeaturedBusinesses;