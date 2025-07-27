import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
}

const ProfileForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_profile', {
        user_uuid: user.id
      });

      if (error) throw error;

      if (data && typeof data === 'object') {
        // Safe type casting with proper validation
        const profileData = data as unknown;
        if (isValidProfile(profileData)) {
          setFormData({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || user.email || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Type guard function
  const isValidProfile = (data: unknown): data is Profile => {
    return typeof data === 'object' && 
           data !== null && 
           'id' in data && 
           'email' in data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
      
      {error && (
        <div className="bg-red-500/10 text-red-500 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 text-green-500 rounded-lg p-3 mb-4">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="Enter your first name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
            placeholder="Your email address"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email cannot be changed from this form
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
