import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../useErrorHandler';

export interface UserSettings {
  marketingEmails: boolean;
  productUpdates: boolean;
  communityNews: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

export const useUserSettings = () => {
  const [userSettings, setUserSettings] = useState<UserSettings>({
    marketingEmails: true,
    productUpdates: true,
    communityNews: true,
    darkMode: false,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'useUserSettings',
    defaultMessage: 'Failed to fetch your settings'
  });

  const fetchUserSettings = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        setUserSettings(data[0].settings);
      }
    } catch (err) {
      handleError(err, 'Failed to fetch your settings');
      logError('Error fetching user settings', {
        context: 'useUserSettings',
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const updateSetting = useCallback((setting: keyof UserSettings, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
    setSuccess(null);
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      setSuccess(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error: saveError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: userSettings,
          updated_at: new Date().toISOString(),
        });

      if (saveError) {
        throw saveError;
      }
      
      setSuccess('Settings saved successfully');
    } catch (err) {
      handleError(err, 'Failed to save settings');
      logError('Error saving user settings', {
        context: 'useUserSettings',
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  }, [userSettings, handleError, clearError]);

  return {
    userSettings,
    loading,
    error,
    success,
    fetchUserSettings,
    updateSetting,
    saveSettings,
    setSuccess
  };
};

export default useUserSettings;