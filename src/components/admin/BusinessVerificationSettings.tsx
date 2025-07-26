import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Shield, 
  Check, 
  X, 
  AlertTriangle, 
  Save, 
  RefreshCw,
  Settings
} from 'lucide-react';

interface VerificationSettings {
  blackBusinessOnly: boolean;
  autoVerify: boolean;
  requireManualReview: boolean;
  notificationEmails: string[];
}

const BusinessVerificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<VerificationSettings>({
    blackBusinessOnly: true,
    autoVerify: false,
    requireManualReview: true,
    notificationEmails: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingBusinesses, setPendingBusinesses] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadPendingBusinesses();
  }, []);

  const loadSettings = async () => {
    try {
      // Check feature flag for black business only requirement
      const { data: flagData, error: flagError } = await supabase.rpc('get_feature_flag_status', {
        flag_name: 'black_business_verification_only'
      });
      
      if (!flagError && flagData !== null) {
        setSettings(prev => ({ ...prev, blackBusinessOnly: flagData }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadPendingBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          email,
          description,
          category,
          city,
          state,
          created_at,
          is_verified,
          is_active
        `)
        .eq('is_verified', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPendingBusinesses(data || []);
    } catch (err) {
      console.error('Error loading pending businesses:', err);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update feature flag for black business verification
      const { error: flagError } = await supabase.rpc('toggle_feature_flag', {
        flag_name: 'black_business_verification_only',
        new_status: settings.blackBusinessOnly
      });

      if (flagError) throw flagError;

      setSuccess('Verification settings updated successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBusiness = async (businessId: string, approved: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          is_verified: approved,
          is_active: approved 
        })
        .eq('id', businessId);

      if (error) throw error;

      setSuccess(`Business ${approved ? 'approved' : 'rejected'} successfully`);
      loadPendingBusinesses();
    } catch (err) {
      console.error('Error updating business:', err);
      setError('Failed to update business verification status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Business Verification Settings</h2>
        <p className="text-gray-400">Configure verification rules and review processes</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Verification Settings */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Verification Rules</h3>
        </div>

        <div className="space-y-6">
          {/* Black Business Only Setting */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium mb-2">Black Business Only Verification</h4>
                <p className="text-gray-400 text-sm">
                  When enabled, only businesses that identify as Black-owned will be allowed to register and be verified.
                  This helps maintain the platform's focus on supporting Black businesses.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.blackBusinessOnly}
                  onChange={(e) => setSettings(prev => ({ ...prev, blackBusinessOnly: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Manual Review Setting */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium mb-2">Require Manual Review</h4>
                <p className="text-gray-400 text-sm">
                  All business registrations will require manual admin approval before being listed.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireManualReview}
                  onChange={(e) => setSettings(prev => ({ ...prev, requireManualReview: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Pending Verifications</h3>
          </div>
          <button
            onClick={loadPendingBusinesses}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {pendingBusinesses.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No businesses pending verification</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBusinesses.map((business) => (
              <div key={business.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{business.name}</h4>
                    <p className="text-gray-400 text-sm mb-2">{business.email}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Category: {business.category}</span>
                      <span>Location: {business.city}, {business.state}</span>
                      <span>Submitted: {new Date(business.created_at).toLocaleDateString()}</span>
                    </div>
                    {business.description && (
                      <p className="text-gray-300 text-sm mt-2 line-clamp-2">{business.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyBusiness(business.id, true)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerifyBusiness(business.id, false)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessVerificationSettings;