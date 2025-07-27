
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserSettings {
  emailNotifications: boolean;
  marketingEmails: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  marketingEmails: false,
  theme: 'system',
  language: 'en'
};

const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.settings) {
        setSettings({ ...defaultSettings, ...(data.settings as Partial<UserSettings>) });
      }
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
      setError(error.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error: any) {
      console.error('Error updating user settings:', error);
      setError(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    updateSettings,
    loading,
    error,
    refetch: fetchSettings
  };
};

export default useUserSettings;
