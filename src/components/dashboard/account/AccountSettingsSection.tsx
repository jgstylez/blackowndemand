
import { useAccountManagement } from '../../../hooks/dashboard/useAccountManagement';
import AccountDeletionModal from './AccountDeletionModal';

const AccountSettingsSection = () => {
  const {
    deletionSummary,
    deletionLoading,
    deletionError,
    prepareAccountDeletion,
    deleteUserAccount,
  } = useAccountManagement();

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>
      
      <div className="space-y-4">
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
          <p className="text-gray-400 text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={prepareAccountDeletion}
            disabled={deletionLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {deletionLoading ? 'Loading...' : 'Delete Account'}
          </button>
          {deletionError && (
            <p className="text-red-400 text-sm mt-2">{deletionError}</p>
          )}
        </div>
      </div>

      <AccountDeletionModal
        isOpen={!!deletionSummary}
        onClose={() => window.location.reload()}
        onConfirm={deleteUserAccount}
        loading={deletionLoading}
      />
    </div>
  );
};

export default AccountSettingsSection;
