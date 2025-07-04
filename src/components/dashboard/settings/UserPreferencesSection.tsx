import React from 'react';
import { UserSettings } from '../../../hooks/dashboard/useUserSettings';

interface UserPreferencesSectionProps {
  userSettings: UserSettings;
  loading: boolean;
  onSettingChange: (setting: keyof UserSettings) => void;
  onSaveSettings: () => Promise<void>;
  success: string | null;
}

const UserPreferencesSection: React.FC<UserPreferencesSectionProps> = ({
  userSettings,
  loading,
  onSettingChange,
  onSaveSettings,
  success
}) => {
  return (
    <div className="space-y-6">
      {/* Email Preferences */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Email Preferences</h2>
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg">
            {success}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Marketing Emails</h3>
              <p className="text-gray-400 text-sm">Receive updates about promotions and special offers</p>
            </div>
            <button
              onClick={() => onSettingChange('marketingEmails')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userSettings.marketingEmails ? 'bg-white' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  userSettings.marketingEmails ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Product Updates</h3>
              <p className="text-gray-400 text-sm">Stay informed about new features and improvements</p>
            </div>
            <button
              onClick={() => onSettingChange('productUpdates')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userSettings.productUpdates ? 'bg-white' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  userSettings.productUpdates ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Community News</h3>
              <p className="text-gray-400 text-sm">Get updates about the Black business community</p>
            </div>
            <button
              onClick={() => onSettingChange('communityNews')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userSettings.communityNews ? 'bg-white' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  userSettings.communityNews ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
                }`}
              />
            </button>
          </div>
        </div>
        
        <button
          onClick={onSaveSettings}
          disabled={loading}
          className="w-full mt-6 bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Personalization */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Personalization</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Language
            </label>
            <select
              id="language"
              value={userSettings.language}
              onChange={(e) => {
                const newSettings = { ...userSettings, language: e.target.value };
                // This is a bit of a workaround since we don't have direct setter access
                onSettingChange('language');
              }}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Zone
            </label>
            <select
              id="timezone"
              value={userSettings.timezone}
              onChange={(e) => {
                const newSettings = { ...userSettings, timezone: e.target.value };
                // This is a bit of a workaround since we don't have direct setter access
                onSettingChange('timezone');
              }}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesSection;