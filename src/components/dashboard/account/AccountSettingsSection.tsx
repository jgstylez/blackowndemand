import React from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { AccountData } from '../../../hooks/dashboard/useAccountManagement';

interface AccountSettingsSectionProps {
  accountData: AccountData;
  userEmail: string | undefined;
  loading: boolean;
  success: string | null;
  error: { hasError: boolean; message: string | null };
  onAccountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateEmail: (e: React.FormEvent) => Promise<void>;
  onUpdatePassword: (e: React.FormEvent) => Promise<void>;
  onPrepareDeletion: () => Promise<void>;
}

const AccountSettingsSection: React.FC<AccountSettingsSectionProps> = ({
  accountData,
  userEmail,
  loading,
  success,
  error,
  onAccountChange,
  onUpdateEmail,
  onUpdatePassword,
  onPrepareDeletion
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Email Address</p>
            <p className="text-white font-medium">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <Mail className="h-6 w-6 text-white mr-3" />
          <h2 className="text-xl font-semibold text-white">Email Settings</h2>
        </div>

        {error.hasError && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={onUpdateEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={accountData.email}
              onChange={onAccountChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Password Settings */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <Lock className="h-6 w-6 text-white mr-3" />
          <h2 className="text-xl font-semibold text-white">Password Settings</h2>
        </div>

        <form onSubmit={onUpdatePassword} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={accountData.newPassword}
              onChange={onAccountChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={accountData.confirmPassword}
              onChange={onAccountChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
          <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
        </div>

        <p className="text-gray-400 mb-6">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <button
          onClick={onPrepareDeletion}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Preparing...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
};

export default AccountSettingsSection;