import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../useErrorHandler';
import { sendAccountDeletionEmail } from '../../lib/emailService';
import { useNavigate } from 'react-router-dom';

export interface AccountData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeletionSummary {
  user_id: string;
  businesses_to_delete: number;
  subscriptions_to_cancel: number;
  can_delete: boolean;
  warnings: string[];
}

export const useAccountManagement = () => {
  const navigate = useNavigate();
  const [accountData, setAccountData] = useState<AccountData>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionSummary, setDeletionSummary] = useState<DeletionSummary | null>(null);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'useAccountManagement',
    defaultMessage: 'Failed to update account'
  });

  const handleAccountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({ ...prev, [name]: value }));
    clearError();
    setSuccess(null);
  }, [clearError]);

  const initializeAccountData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAccountData(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, []);

  const handleUpdateEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: accountData.email,
      });

      if (updateError) {
        throw updateError;
      }
      
      setSuccess('Email updated successfully. Please check your inbox for verification.');
    } catch (err) {
      handleError(err, 'Failed to update email');
    } finally {
      setLoading(false);
    }
  }, [accountData.email, handleError, clearError]);

  const handleUpdatePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountData.newPassword !== accountData.confirmPassword) {
      handleError(new Error('Passwords do not match'), 'New passwords do not match');
      return;
    }

    setLoading(true);
    clearError();
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: accountData.newPassword,
      });

      if (updateError) {
        throw updateError;
      }
      
      setSuccess('Password updated successfully');
      setAccountData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      handleError(err, 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }, [accountData, handleError, clearError]);

  const prepareDeletion = useCallback(async () => {
    try {
      setDeletionLoading(true);
      clearError();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: prepareError } = await supabase.rpc('prepare_account_deletion', {
        user_uuid: user.id
      });

      if (prepareError) {
        throw prepareError;
      }

      setDeletionSummary(data);
      setShowDeletionConfirm(true);
    } catch (err) {
      handleError(err, 'Failed to prepare account deletion');
    } finally {
      setDeletionLoading(false);
    }
  }, [handleError, clearError]);

  const handleDeleteAccount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalConfirm = window.confirm(
      'This action cannot be undone. Are you absolutely sure you want to permanently delete your account and all associated data?'
    );

    if (!finalConfirm) return;

    try {
      setDeletionLoading(true);
      clearError();

      // Send account deletion confirmation email before deleting the account
      try {
        await sendAccountDeletionEmail(
          user.email || '',
          user.user_metadata?.first_name || undefined,
          user.user_metadata?.last_name || undefined
        );
        console.log('Account deletion email sent successfully');
      } catch (emailError) {
        console.error('Failed to send account deletion email:', emailError);
        // Continue with account deletion even if email fails
      }

      const { error: deleteError } = await supabase.rpc('delete_user_account', {
        user_uuid: user.id
      });

      if (deleteError) {
        throw deleteError;
      }

      await supabase.auth.signOut();

      navigate('/', { 
        state: { 
          message: 'Your account has been successfully deleted. Thank you for being part of our community.' 
        }
      });

    } catch (err) {
      handleError(err, 'Failed to delete account');
      setDeletionLoading(false);
    }
  }, [handleError, clearError, navigate]);

  return {
    accountData,
    loading,
    success,
    error,
    deletionLoading,
    deletionSummary,
    showDeletionConfirm,
    setShowDeletionConfirm,
    handleAccountChange,
    initializeAccountData,
    handleUpdateEmail,
    handleUpdatePassword,
    prepareDeletion,
    handleDeleteAccount,
    setSuccess
  };
};

export default useAccountManagement;