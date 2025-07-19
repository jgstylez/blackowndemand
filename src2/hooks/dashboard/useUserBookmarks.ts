import { useState, useCallback } from 'react';
import { supabase, getBusinessImageUrl } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../useErrorHandler';
import { Business } from '../../types';

export const useUserBookmarks = () => {
  const [bookmarkedBusinesses, setBookmarkedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'useUserBookmarks',
    defaultMessage: 'Failed to fetch your bookmarked businesses'
  });

  const fetchUserBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      
      // Get bookmarked business IDs
      const { data: bookmarkData, error: bookmarkError } = await supabase.rpc('get_user_bookmarks');
      
      if (bookmarkError) {
        throw bookmarkError;
      }
      
      if (!bookmarkData || bookmarkData.length === 0) {
        setBookmarkedBusinesses([]);
        return;
      }
      
      // Extract business IDs
      const businessIds = bookmarkData.map((item: any) => item.business_id);
      
      // Fetch full business details for bookmarked businesses
      const { data: businessesData, error: businessesError } = await supabase
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
        .in('id', businessIds)
        .eq('is_active', true)
        .or('is_verified.eq.true,migration_source.not.is.null');
      
      if (businessesError) {
        throw businessesError;
      }
      
      // Transform the data to match the expected Business type
      const transformedBusinesses = businessesData.map((business: any) => ({
        ...business,
        subscription_plan_name: business.subscriptions?.subscription_plans?.name || null
      }));
      
      setBookmarkedBusinesses(transformedBusinesses);
    } catch (err) {
      handleError(err, 'Failed to fetch your bookmarked businesses');
      logError('Error fetching bookmarked businesses', {
        context: 'useUserBookmarks',
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const handleRemoveBookmark = async (businessId: string) => {
    if (!window.confirm('Are you sure you want to remove this bookmark?')) {
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      const { error: removeError } = await supabase.rpc('remove_bookmark', {
        p_business_id: businessId
      });

      if (removeError) {
        throw removeError;
      }
      
      setBookmarkedBusinesses(prev => prev.filter(b => b.id !== businessId));
      return true;
    } catch (err) {
      handleError(err, 'Failed to remove bookmark');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    bookmarkedBusinesses,
    loading,
    error,
    fetchUserBookmarks,
    handleRemoveBookmark
  };
};

export default useUserBookmarks;