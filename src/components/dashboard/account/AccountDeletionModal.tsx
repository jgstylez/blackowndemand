import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { DeletionSummary } from '../../../hooks/dashboard/useAccountManagement';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletionSummary: DeletionSummary | null;
  onDeleteAccount: () => Promise<void>;
  deletionLoading: boolean;
}

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  deletionSummary,
  onDeleteAccount,
  deletionLoading
}) => {
  if (!isOpen || !deletionSummary) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center mb-6">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
          <h2 className="text-xl font-bold text-white">Confirm Account Deletion</h2>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            You are about to permanently delete your account. This action cannot be undone.
          </p>

          {deletionSummary.businesses_to_delete > 0 && (
            <div className="bg-red-500/10 p-4 rounded-lg">
              <p className="text-red-400 font-medium">
                ⚠️ {deletionSummary.businesses_to_delete} business listing(s) will be permanently deleted
              </p>
            </div>
          )}

          {deletionSummary.subscriptions_to_cancel > 0 && (
            <div className="bg-yellow-500/10 p-4 rounded-lg">
              <p className="text-yellow-400 font-medium">
                📋 {deletionSummary.subscriptions_to_cancel} subscription(s) will be cancelled
              </p>
            </div>
          )}

          {deletionSummary.warnings.map((warning, index) => (
            <div key={index} className="bg-orange-500/10 p-4 rounded-lg">
              <p className="text-orange-400">{warning}</p>
            </div>
          ))}

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-300 text-sm">
              <strong>What will be deleted:</strong>
            </p>
            <ul className="text-gray-400 text-sm mt-2 space-y-1">
              <li>• Your user account and profile</li>
              <li>• All business listings you own</li>
              <li>• Your subscription and payment history</li>
              <li>• All personal settings and preferences</li>
              <li>• Any uploaded images and content</li>
              <li>• All your saved bookmarks</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDeleteAccount}
            disabled={deletionLoading}
            className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {deletionLoading ? 'Deleting...' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletionModal;