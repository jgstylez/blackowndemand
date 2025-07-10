import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, Building2, Bookmark } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Business } from '../types';
import BusinessForm from '../components/dashboard/BusinessForm';
import ErrorFallback from '../components/common/ErrorFallback';
import useErrorHandler from '../hooks/useErrorHandler';

// Import custom hooks
import useUserBusinesses from '../hooks/dashboard/useUserBusinesses';
import useUserBookmarks from '../hooks/dashboard/useUserBookmarks';
import useUserProfile from '../hooks/dashboard/useUserProfile';
import useUserSettings from '../hooks/dashboard/useUserSettings';
import useAccountManagement from '../hooks/dashboard/useAccountManagement';

// Import components
import MyBusinessesSection from '../components/dashboard/businesses/MyBusinessesSection';
import MyBookmarksSection from '../components/dashboard/bookmarks/MyBookmarksSection';
import AccountSettingsSection from '../components/dashboard/account/AccountSettingsSection';
import UserPreferencesSection from '../components/dashboard/settings/UserPreferencesSection';
import AccountDeletionModal from '../components/dashboard/account/AccountDeletionModal';

type Tab = 'businesses' | 'bookmarks' | 'account' | 'settings';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('businesses');
  const [success, setSuccess] = useState<string | null>(null);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const { error, clearError } = useErrorHandler({
    context: 'DashboardPage',
    defaultMessage: 'An error occurred'
  });

  // Initialize hooks
  const {
    businesses,
    incompleteBusinesses,
    loading: businessesLoading,
    hasBusinesses,
    fetchUserBusinesses,
    handleDeleteBusiness
  } = useUserBusinesses();

  const {
    bookmarkedBusinesses,
    loading: bookmarksLoading,
    fetchUserBookmarks,
    handleRemoveBookmark
  } = useUserBookmarks();

  const {
    userProfile,
    loading: profileLoading,
    fetchUserProfile
  } = useUserProfile();

  const {
    userSettings,
    loading: settingsLoading,
    success: settingsSuccess,
    updateSetting,
    saveSettings,
    fetchUserSettings
  } = useUserSettings();

  const {
    accountData,
    loading: accountLoading,
    success: accountSuccess,
    error: accountError,
    deletionLoading,
    deletionSummary,
    showDeletionConfirm,
    setShowDeletionConfirm,
    handleAccountChange,
    initializeAccountData,
    handleUpdateEmail,
    handleUpdatePassword,
    prepareDeletion,
    handleDeleteAccount
  } = useAccountManagement();

  useEffect(() => {
    if (user) {
      fetchUserBusinesses();
      fetchUserProfile();
      fetchUserSettings();
      initializeAccountData();
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

  useEffect(() => {
    // If the active tab is bookmarks, fetch bookmarks
    if (activeTab === 'bookmarks') {
      fetchUserBookmarks();
    }
  }, [activeTab, fetchUserBookmarks]);

  // Set success message from various sources
  useEffect(() => {
    if (accountSuccess) {
      setSuccess(accountSuccess);
    } else if (settingsSuccess) {
      setSuccess(settingsSuccess);
    }
  }, [accountSuccess, settingsSuccess]);

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setShowBusinessForm(true);
  };

  const handleBusinessFormSubmit = async (businessData: Partial<Business>) => {
    try {
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
      // Error handling is done in the hook
    } finally {
      setShowBusinessForm(false);
      setEditingBusiness(null);
    }
  };

  const handleProfileUpdate = () => {
    fetchUserProfile();
    setSuccess('Profile updated successfully');
  };

  const handleContinueBusinessListing = (business: Business) => {
    // Navigate to the business listing page with the business ID to update
    navigate('/business/new', {
      state: {
        paymentCompleted: true,
        businessIdToUpdate: business.id,
        planName: business.subscription_plan_name,
        planPrice: 0 // Price is already paid
      }
    });
  };

  if (error.hasError && !businessesLoading && !bookmarksLoading && !profileLoading && !settingsLoading && !accountLoading) {
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
          {(hasBusinesses || incompleteBusinesses.length > 0) && (
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

        {/* Render the active tab content */}
        {activeTab === 'businesses' && (
          <MyBusinessesSection
            businesses={businesses}
            incompleteBusinesses={incompleteBusinesses}
            loading={businessesLoading}
            hasBusinesses={hasBusinesses}
            onDeleteBusiness={handleDeleteBusiness}
            onEditBusiness={handleEditBusiness}
            onContinueListing={handleContinueBusinessListing}
          />
        )}

        {activeTab === 'bookmarks' && (
          <MyBookmarksSection
            bookmarkedBusinesses={bookmarkedBusinesses}
            loading={bookmarksLoading}
            onRemoveBookmark={handleRemoveBookmark}
          />
        )}

        {activeTab === 'account' && (
          <AccountSettingsSection
            accountData={accountData}
            userEmail={user?.email}
            loading={accountLoading}
            success={accountSuccess}
            error={accountError}
            onAccountChange={handleAccountChange}
            onUpdateEmail={handleUpdateEmail}
            onUpdatePassword={handleUpdatePassword}
            onPrepareDeletion={prepareDeletion}
          />
        )}

        {activeTab === 'settings' && (
          <UserPreferencesSection
            userSettings={userSettings}
            loading={settingsLoading}
            onSettingChange={(setting) => {
              updateSetting(setting, !userSettings[setting]);
            }}
            onSaveSettings={saveSettings}
            success={settingsSuccess}
          />
        )}

        {/* Business Form Modal */}
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

        {/* Account Deletion Confirmation Modal */}
        <AccountDeletionModal
          isOpen={showDeletionConfirm}
          onClose={() => setShowDeletionConfirm(false)}
          deletionSummary={deletionSummary}
          onDeleteAccount={handleDeleteAccount}
          deletionLoading={deletionLoading}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;