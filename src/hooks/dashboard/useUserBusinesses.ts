import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../useErrorHandler';
import { Business } from '../../types';

export const useUserBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [incompleteBusinesses, setIncompleteBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasBusinesses, setHasBusinesses] = useState(false);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'useUserBusinesses',
    defaultMessage: 'Failed to fetch your businesses'
  });

  const fetchUserBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      
      // Get current user ID first
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      // Use the RPC function to get businesses with plan details
      const { data, error: fetchError } = await supabase.rpc('get_businesses_with_plan_details', {
        p_is_active: true
      });

      if (fetchError) {
        throw fetchError;
      }
      
      // Filter to only show businesses owned by the current user
      const userBusinesses = data?.filter(b => b.owner_id === currentUserId) || [];
      setBusinesses(userBusinesses);
      setHasBusinesses(userBusinesses.length > 0);

      // Fetch incomplete businesses (is_active = false)
      const { data: incompleteData, error: incompleteError } = await supabase
        .from('businesses')
        .select(`
          *,
          subscriptions!businesses_subscription_id_fkey (
            id,
            plan_id,
            subscription_plans (
              name
            )
          )
        `)
        .eq('owner_id', currentUserId)
        .eq('is_active', false);

      if (incompleteError) {
        throw incompleteError;
      }

      // Transform the data to match the expected Business type
      const transformedIncomplete = incompleteData.map((business: any) => ({
        ...business,
        subscription_plan_name: business.subscriptions?.subscription_plans?.name || null
      }));

      setIncompleteBusinesses(transformedIncomplete);
    } catch (err) {
      handleError(err, 'Failed to fetch your businesses');
      logError('Error fetching businesses', {
        context: 'useUserBusinesses',
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const handleDeleteBusiness = async (businessId: string) => {
    if (!window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (deleteError) {
        throw deleteError;
      }
      
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      setIncompleteBusinesses(prev => prev.filter(b => b.id !== businessId));
      setHasBusinesses(businesses.length > 1);
      return true;
    } catch (err) {
      handleError(err, 'Failed to delete business');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    businesses,
    incompleteBusinesses,
    loading,
    hasBusinesses,
    error,
    fetchUserBusinesses,
    handleDeleteBusiness
  };
};

export default useUserBusinesses;