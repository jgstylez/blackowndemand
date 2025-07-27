
import useUserSettings from '../../../hooks/dashboard/useUserSettings';

const UserPreferencesSection = () => {
  const {
    settings,
    loading,
    error,
    updateSettings
  } = useUserSettings();

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({
      [key]: value
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Email Notifications</h3>
            <p className="text-gray-400 text-sm">Receive updates about your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Marketing Communications</h3>
            <p className="text-gray-400 text-sm">Receive promotional emails and updates</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.marketingEmails}
              onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesSection;
