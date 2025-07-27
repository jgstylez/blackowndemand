
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface DeletionSummary {
  user_id: string;
  businesses_to_delete: number;
  subscriptions_to_cancel: number;
  can_delete: boolean;
  warnings: string[];
}

export interface AccountData {
  deletionSummary: DeletionSummary | null;
  deletionLoading: boolean;
  deletionError: string | null;
}

export const useAccountManagement = () => {
  const { user } = useAuth();
  const [deletionSummary, setDeletionSummary] = useState<DeletionSummary | null>(null);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);

  const prepareAccountDeletion = async () => {
    if (!user) return;

    setDeletionLoading(true);
    setDeletionError(null);

    try {
      const { data, error } = await supabase.rpc('prepare_account_deletion', {
        user_uuid: user.id
      });

      if (error) throw error;

      if (data && typeof data === 'object') {
        const summaryData = data as unknown;
        if (isValidDeletionSummary(summaryData)) {
          setDeletionSummary(summaryData);
        }
      }
    } catch (error: any) {
      console.error('Error preparing account deletion:', error);
      setDeletionError(error.message || 'Failed to prepare account deletion');
    } finally {
      setDeletionLoading(false);
    }
  };

  const isValidDeletionSummary = (data: unknown): data is DeletionSummary => {
    return typeof data === 'object' && 
           data !== null && 
           'user_id' in data && 
           'businesses_to_delete' in data &&
           'subscriptions_to_cancel' in data &&
           'can_delete' in data &&
           'warnings' in data;
  };

  const deleteUserAccount = async () => {
    if (!user) return;

    setDeletionLoading(true);
    setDeletionError(null);

    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_uuid: user.id
      });

      if (error) throw error;

      console.log('Account deleted successfully');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setDeletionError(error.message || 'Failed to delete account');
    } finally {
      setDeletionLoading(false);
    }
  };

  return {
    deletionSummary,
    deletionLoading,
    deletionError,
    prepareAccountDeletion,
    deleteUserAccount,
  };
};

export default useAccountManagement;
