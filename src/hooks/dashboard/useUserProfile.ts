import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../useErrorHandler';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  full_name: string | null;
}

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'useUserProfile',
    defaultMessage: 'Failed to fetch your profile'
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      
      const { data, error: profileError } = await supabase.rpc('get_user_profile');
      
      if (profileError) {
        throw profileError;
      }
      
      setUserProfile(data);
    } catch (err) {
      handleError(err, 'Failed to fetch your profile');
      logError('Error fetching user profile', {
        context: 'useUserProfile',
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  return {
    userProfile,
    loading,
    error,
    fetchUserProfile
  };
};

export default useUserProfile;