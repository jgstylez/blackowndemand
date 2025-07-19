import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook to check if a feature flag is enabled
 * 
 * @param flagName - The name of the feature flag to check
 * @param defaultValue - The default value to return if the flag doesn't exist
 * @returns A boolean indicating whether the feature flag is enabled
 */
export const useFeatureFlag = (flagName: string, defaultValue: boolean = false): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        setLoading(true);
        
        // Call the RPC function to get the feature flag status
        const { data, error } = await supabase.rpc('get_feature_flag_status', {
          flag_name: flagName
        });

        if (error) {
          console.error(`Error checking feature flag ${flagName}:`, error);
          return;
        }

        // Update state with the flag status
        setIsEnabled(data || defaultValue);
      } catch (err) {
        console.error(`Failed to check feature flag ${flagName}:`, err);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureFlag();
  }, [flagName, defaultValue]);

  return isEnabled;
};

export default useFeatureFlag;