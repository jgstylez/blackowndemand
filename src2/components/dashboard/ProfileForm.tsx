import React, { useState, useEffect } from 'react';
import { User, Mail, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../../hooks/useErrorHandler';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
}

interface ProfileFormProps {
  onProfileUpdate?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  onProfileUpdate, 
  onClose,
  isModal = false
}) => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { error, handleError, clearError } = useErrorHandler({
    context: 'ProfileForm',
    defaultMessage: 'Failed to update profile'
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      clearError();
      
      const { data, error: fetchError } = await supabase.rpc('get_user_profile');
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        setProfile(data as Profile);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        });
      }
    } catch (err) {
      handleError(err, 'Failed to load profile');
      logError('Failed to fetch user profile', {
        context: 'ProfileForm',
        user: user?.id,
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (success) setSuccess(false);
    if (error.hasError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      clearError();
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        throw updateError;
      }
      
      // Refresh user data
      await refreshUser();
      
      // Fetch updated profile
      await fetchUserProfile();
      
      setSuccess(true);
      
      // Call onProfileUpdate callback if provided
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      // Auto-close modal after successful update if in modal mode
      if (isModal && onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      handleError(err, 'Failed to update profile');
      logError('Failed to update profile', {
        context: 'ProfileForm',
        user: user.id,
        metadata: { formData, error: err }
      });
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-2">
          First Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            placeholder="Your first name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-gray-300 mb-2">
          Last Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            placeholder="Your last name"
          />
        </div>
      </div>

      {user && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-700 rounded-lg text-gray-300 focus:outline-none cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            To change your email, go to Account Settings
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Edit Profile</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {error.hasError && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
            {error.message}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg">
            Profile updated successfully
          </div>
        )}

        {renderForm()}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Profile Information</h3>

      {error.hasError && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error.message}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg">
          Profile updated successfully
        </div>
      )}

      {renderForm()}
    </div>
  );
};

export default ProfileForm;