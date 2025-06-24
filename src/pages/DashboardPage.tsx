import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, Building2, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Clock, Mail, Lock, Crown, Bookmark } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Business, BusinessCategory, BusinessCategoryLabels } from '../types';
import BusinessForm from '../components/dashboard/BusinessForm';
import { logError } from '../lib/errorLogger';
import useErrorHandler from '../hooks/useErrorHandler';
import ErrorFallback from '../components/common/ErrorFallback';
import ProfileForm from '../components/dashboard/ProfileForm';
import { getBusinessImageUrl } from '../lib/supabase';

type Tab = 'businesses' | 'bookmarks' | 'account' | 'settings';

interface UserSettings {
  marketingEmails: boolean;
  productUpdates: boolean;
  communityNews: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

interface DeletionSummary {
  user_id: string;
  businesses_to_delete: number;
  subscriptions_to_cancel: number;
  can_delete: boolean;
  warnings: string[];
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  full_name: string | null;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('businesses');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bookmarkedBusinesses, setBookmarkedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionSummary, setDeletionSummary] = useState<DeletionSummary | null>(null);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [hasBusinesses, setHasBusinesses] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [userSettings, setUserSettings] = useState<UserSettings>({
    marketingEmails: true,
    productUpdates: true,
    communityNews: true,
    darkMode: false,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const { error, handleError, clearError } = useErrorHandler({
    context: 'DashboardPage',
    defaultMessage: 'An error occurred'
  });

  useEffect(() => {
    if (user) {
      fetchUserBusinesses();
      fetchUserBookmarks();
      fetchUserSettings();
      fetchUserProfile();
    }

    // Check if user just claimed a business
    if (searchParams.get('claimed') === 'true') {
      setSuccess('Business successfully claimed! Welcome to your dashboard.');
      setActiveTab('businesses');
    }

    // Check if user just created a new business (from location state)
    if (location.state?.newBusiness) {
      setSuccess(`Your business "${location.state.businessName}" has been created successfully!`);
      setActiveTab('businesses');
    }
  }, [user, searchParams, location.state]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      clearError();
      
      const { data, error: profileError } = await supabase.rpc('get_user_profile');
      
      if (profileError) {
        throw profileError;
      }
      
      setUserProfile(data);
    } catch (err) {
      handleError(err, 'Failed to fetch your profile');
      logError('Error fetching user profile', {
        context: 'DashboardPage',
        user: user?.id,
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBusinesses = async () => {
    try {
      setLoading(true);
      clearError();
      
      // Use the RPC function to get businesses with plan details
      const { data, error: fetchError } = await supabase.rpc('get_businesses_with_plan_details', {
        p_is_active: true
      });

      if (fetchError) {
        throw fetchError;
      }
      
      // Filter to only show businesses owned by the current user
      const userBusinesses = data?.filter(b => b.owner_id === user?.id) || [];
      setBusinesses(userBusinesses);
      setHasBusinesses(userBusinesses.length > 0);
    } catch (err) {
      handleError(err, 'Failed to fetch your businesses');
      logError('Error fetching businesses', {
        context: 'DashboardPage',
        user: user?.id,
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookmarks = async () => {
    if (!user) return;
    
    try {
      setBookmarksLoading(true);
      clearError();
      
      // Get bookmarked business IDs
      const { data: bookmarkData, error: bookmarkError } = await supabase.rpc('get_user_bookmarks');
      
      if (bookmarkError) {
        throw bookmarkError;
      }
      
      if (!bookmarkData || bookmarkData.length === 0) {
        setBookmarkedBusinesses([]);
        return;
      }
      
      // Extract business IDs
      const businessIds = bookmarkData.map((item: any) => item.business_id);
      
      // Fetch full business details for bookmarked businesses
      // Fix: Explicitly specify the foreign key relationship to resolve ambiguity
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          *,
          subscriptions!businesses_subscription_id_fkey (
            id,
            plan_id,
            subscription_plans (
              name
            )
          )
        `)
        .in('id', businessIds)
        .eq('is_active', true)
        .or('is_verified.eq.true,migration_source.not.is.null');
      
      if (businessesError) {
        throw businessesError;
      }
      
      // Transform the data to match the expected Business type
      const transformedBusinesses = businessesData.map((business: any) => ({
        ...business,
        subscription_plan_name: business.subscriptions?.subscription_plans?.name || null
      }));
      
      setBookmarkedBusinesses(transformedBusinesses);
    } catch (err) {
      handleError(err, 'Failed to fetch your bookmarked businesses');
      logError('Error fetching bookmarked businesses', {
        context: 'DashboardPage',
        user: user?.id,
        metadata: { error: err }
      });
    } finally {
      setBookmarksLoading(false);
    }
  };

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      clearError();
      
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id);

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        setUserSettings(data[0].settings);
      }
    } catch (err) {
      handleError(err, 'Failed to fetch your settings');
      logError('Error fetching user settings', {
        context: 'DashboardPage',
        user: user?.id,
        metadata: { error: err }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({ ...prev, [name]: value }));
    clearError();
    setSuccess(null);
  };

  const handleSettingChange = (setting: keyof UserSettings) => {
    setUserSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
    saveUserSettings({
      ...userSettings,
      [setting]: !userSettings[setting],
    });
  };

  const saveUserSettings = async (settings: UserSettings) => {
    try {
      setLoading(true);
      clearError();
      
      const { error: saveError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          settings,
          updated_at: new Date().toISOString(),
        });

      if (saveError) {
        throw saveError;
      }
      
      setSuccess('Settings saved successfully');
    } catch (err) {
      handleError(err, 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
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
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (deleteError) {
        throw deleteError;
      }
      
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      setHasBusinesses(businesses.length > 1);
      setSuccess('Business deleted successfully');
    } catch (err) {
      handleError(err, 'Failed to delete business');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (businessId: string) => {
    if (!window.confirm('Are you sure you want to remove this bookmark?')) {
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      const { error: removeError } = await supabase.rpc('remove_bookmark', {
        p_business_id: businessId
      });

      if (removeError) {
        throw removeError;
      }
      
      setBookmarkedBusinesses(prev => prev.filter(b => b.id !== businessId));
      setSuccess('Bookmark removed successfully');
    } catch (err) {
      handleError(err, 'Failed to remove bookmark');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setShowBusinessForm(true);
  };

  const handleBusinessFormSubmit = async (businessData: Partial<Business>) => {
    try {
      setLoading(true);
      clearError();
      
      if (editingBusiness) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update(businessData)
          .eq('id', editingBusiness.id);

        if (updateError) {
          throw updateError;
        }
        
        setSuccess('Business updated successfully');
        fetchUserBusinesses();
      }
    } catch (err) {
      handleError(err, 'Failed to update business');
    } finally {
      setShowBusinessForm(false);
      setEditingBusiness(null);
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    fetchUserProfile();
    setSuccess('Profile updated successfully');
  };

  const prepareDeletion = async () => {
    if (!user) return;

    try {
      setDeletionLoading(true);
      clearError();

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
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const finalConfirm = window.confirm(
      'This action cannot be undone. Are you absolutely sure you want to permanently delete your account and all associated data?'
    );

    if (!finalConfirm) return;

    try {
      setDeletionLoading(true);
      clearError();

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
  };

  if (error.hasError && !loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorFallback
            error={error.details}
            message={error.message || "An error occurred"}
            resetErrorBoundary={() => {
              clearError();
              window.location.reload();
            }}
          />
        </div>
      </Layout>
    );
  }

  // Get greeting based on time of day and user's name if available
  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Welcome";
    
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    else greeting = "Good evening";
    
    if (userProfile?.first_name) {
      return `${greeting}, ${userProfile.first_name}`;
    }
    
    return greeting;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{getGreeting()}</h1>
            <p className="text-gray-400 mt-1">Manage your account</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </button>
        </div>

        <div className="flex space-x-4 mb-8">
          {hasBusinesses && (
            <button
              onClick={() => setActiveTab('businesses')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'businesses'
                  ? 'bg-white text-black'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <Building2 className="h-5 w-5 inline-block mr-2" />
              My Businesses
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('bookmarks');
              fetchUserBookmarks();
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'bookmarks'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <Bookmark className="h-5 w-5 inline-block mr-2" />
            My Bookmarks
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'account'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <User className="h-5 w-5 inline-block mr-2" />
            Account
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <Settings className="h-5 w-5 inline-block mr-2" />
            Settings
          </button>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {activeTab === 'businesses' && hasBusinesses && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">My Businesses</h2>
              <button
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Business
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {businesses.map(business => (
                <div key={business.id} className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-white">{business.name}</h3>
                        {business.is_verified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                        {business.subscription_plan_name === 'VIP Plan' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-400/20 text-yellow-400">
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-4">{business.tagline}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {business.city && business.state && (
                          <span>{business.city}, {business.state}</span>
                        )}
                        {business.category && (
                          <>
                            <span>•</span>
                            <span>{business.category}</span>
                          </>
                        )}
                        {business.subscription_plan_name && (
                          <>
                            <span>•</span>
                            <span>Plan: {business.subscription_plan_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditBusiness(business)}
                        className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBusiness(business.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">My Bookmarks</h2>
            </div>

            {bookmarksLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-800 rounded-lg" />
                      <div className="flex-grow space-y-3">
                        <div className="h-5 bg-gray-800 rounded w-1/3" />
                        <div className="h-4 bg-gray-800 rounded w-2/3" />
                        <div className="h-4 bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : bookmarkedBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {bookmarkedBusinesses.map(business => (
                  <div key={business.id} className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={getBusinessImageUrl(business.image_url)} 
                          alt={business.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold text-white">{business.name}</h3>
                              {business.is_verified && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </span>
                              )}
                              {business.subscription_plan_name === 'VIP Plan' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-400/20 text-yellow-400">
                                  <Crown className="h-3 w-3 mr-1" />
                                  VIP
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{business.tagline}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {business.city && business.state && (
                                <span>{business.city}, {business.state}</span>
                              )}
                              {business.category && (
                                <>
                                  <span>•</span>
                                  <span>{business.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/business/${business.id}`)}
                              className="px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleRemoveBookmark(business.id)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No bookmarks yet</h3>
                <p className="text-gray-400 mb-6">
                  You haven't bookmarked any businesses yet. Browse the directory and save businesses you're interested in.
                </p>
                <button
                  onClick={() => navigate('/browse')}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Browse Businesses
                </button>
              </div>
            )}
          </div>
        )}

        {!hasBusinesses && activeTab === 'businesses' && (
          <div className="mb-8">
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <Building2 className="h-12 w-12 text-gray-600" />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-white mb-2">List Your Business</h3>
                  <p className="text-gray-400 mb-4">
                    Join hundreds of Black-owned businesses on our platform. Get discovered by customers looking for your services.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/pricing')}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      List Your Business
                    </button>
                    <button
                      onClick={() => navigate('/claim-business')}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Claim Existing Business
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email Address</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Account Created</p>
                  <p className="text-white font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Last Sign In</p>
                  <p className="text-white font-medium">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <ProfileForm onProfileUpdate={handleProfileUpdate} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Email Settings */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <Mail className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Email Settings</h2>
              </div>

              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={accountData.email}
                    onChange={handleAccountChange}
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

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={accountData.newPassword}
                    onChange={handleAccountChange}
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
                    onChange={handleAccountChange}
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

            {/* Email Preferences */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Email Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Marketing Emails</h3>
                    <p className="text-gray-400 text-sm">Receive updates about promotions and special offers</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('marketingEmails')}
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
                    onClick={() => handleSettingChange('productUpdates')}
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
                    onClick={() => handleSettingChange('communityNews')}
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
                    onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value }))}
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
                    onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
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
                onClick={prepareDeletion}
                disabled={deletionLoading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletionLoading ? 'Preparing...' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}

        {/* Account Deletion Confirmation Modal */}
        {showDeletionConfirm && deletionSummary && (
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
                  onClick={() => {
                    setShowDeletionConfirm(false);
                    setDeletionSummary(null);
                  }}
                  className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletionLoading}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {deletionLoading ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBusinessForm && editingBusiness && (
          <BusinessForm
            business={editingBusiness}
            onSubmit={handleBusinessFormSubmit}
            onCancel={() => {
              setShowBusinessForm(false);
              setEditingBusiness(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;