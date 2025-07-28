import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  User,
  Settings,
  LogOut,
  Building2,
  Bookmark,
  CheckCircle,
  BarChart3,
  CreditCard,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Business } from "../types";
import ErrorFallback from "../components/common/ErrorFallback";
import useErrorHandler from "../hooks/useErrorHandler";

// Import custom hooks
import useUserBusinesses from "../hooks/dashboard/useUserBusinesses";
import useUserBookmarks from "../hooks/dashboard/useUserBookmarks";
import useUserProfile from "../hooks/dashboard/useUserProfile";
import useUserSettings from "../hooks/dashboard/useUserSettings";
import useAccountManagement from "../hooks/dashboard/useAccountManagement";
import { useBusinessAnalytics } from "../hooks/dashboard/useBusinessAnalytics";

// Import components
import MyBusinessesSection from "../components/dashboard/businesses/MyBusinessesSection";
import MyBookmarksSection from "../components/dashboard/bookmarks/MyBookmarksSection";
import AccountSettingsSection from "../components/dashboard/account/AccountSettingsSection";
import UserPreferencesSection from "../components/dashboard/settings/UserPreferencesSection";
import AccountDeletionModal from "../components/dashboard/account/AccountDeletionModal";
import BusinessAnalyticsSection from "../components/dashboard/analytics/BusinessAnalyticsSection";
import SubscriptionManagementSection from "../components/dashboard/subscriptions/SubscriptionManagementSection";

type Tab =
  | "businesses"
  | "bookmarks"
  | "analytics"
  | "subscriptions"
  | "account"
  | "settings";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("businesses");
  const [success, setSuccess] = useState<string | null>(null);

  const { error, clearError } = useErrorHandler({
    context: "DashboardPage",
    defaultMessage: "An error occurred",
  });

  // Initialize hooks
  const {
    businesses,
    loading: businessesLoading,
    error: businessesError,
    refetch: fetchUserBusinesses,
    deleteBusiness: handleDeleteBusiness,
  } = useUserBusinesses();

  const hasBusinesses = businesses.length > 0;

  // Fix: Incomplete businesses should be those with subscription but missing essential details
  const incompleteBusinesses = businesses.filter((b) => {
    // Business has a subscription (payment completed)
    const hasSubscription = b.subscription_id || b.subscription_plans;

    // Business is missing essential details
    const missingEssentialDetails =
      !b.name ||
      b.name === "Pending Business Listing" ||
      !b.description ||
      !b.category ||
      !b.email ||
      !b.city ||
      !b.state;

    return hasSubscription && missingEssentialDetails;
  });

  const {
    bookmarks: bookmarkedBusinesses,
    loading: bookmarksLoading,
    refetch: fetchUserBookmarks,
    removeBookmark: handleRemoveBookmark,
  } = useUserBookmarks();

  const {
    profile,
    loading: profileLoading,
    refetch: fetchUserProfile,
  } = useUserProfile();

  const {
    settings: userSettings,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
    refetch: fetchUserSettings,
  } = useUserSettings();

  const settingsSuccess = null; // Hook doesn't provide success state

  const {
    deletionSummary,
    deletionLoading,
    deletionError,
    prepareAccountDeletion,
    deleteUserAccount,
  } = useAccountManagement();

  const showDeletionConfirm = !!deletionSummary;

  // Get business IDs for analytics
  const businessIds = businesses.map((b) => b.id);

  // Initialize analytics hook
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: fetchAnalytics,
  } = useBusinessAnalytics(businessIds);

  useEffect(() => {
    if (user) {
      fetchUserBusinesses();
      fetchUserProfile();
      fetchUserSettings();
    }

    // Check if user just claimed a business
    if (searchParams.get("claimed") === "true") {
      setSuccess("Business successfully claimed! Welcome to your dashboard.");
      setActiveTab("businesses");
    }

    // Check if user just created a new business (from location state)
    if (location.state?.newBusiness) {
      setSuccess(
        `Your business "${location.state.businessName}" has been created successfully!`
      );
      setActiveTab("businesses");
    }
  }, [user, searchParams, location.state]);

  useEffect(() => {
    // If the active tab is bookmarks, fetch bookmarks
    if (activeTab === "bookmarks") {
      fetchUserBookmarks();
    }
  }, [activeTab]); // Remove fetchUserBookmarks from dependencies

  // Set success message from various sources
  useEffect(() => {
    if (settingsSuccess) {
      setSuccess(settingsSuccess);
    }
  }, [settingsSuccess]);

  const handleContinueBusinessListing = (business: Business) => {
    // Navigate to the business listing page with the business ID to update
    navigate("/business/new", {
      state: {
        paymentCompleted: true,
        businessIdToUpdate: business.id,
        planName: business.subscription_plans,
        planPrice: 0, // Price is already paid
      },
    });
  };

  if (
    error && // Remove error.hasError check since error object itself indicates an error
    !businessesLoading &&
    !bookmarksLoading &&
    !profileLoading &&
    !settingsLoading
  ) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorFallback
            error={error} // Pass the error object directly
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

    if (profile?.first_name) {
      return `${greeting}, ${profile.first_name}`;
    }

    return greeting;
  };

  return (
    <Layout
      title="Dashboard | BlackOWNDemand"
      description="Manage your businesses, bookmarks, and account settings"
    >
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {getGreeting()}
            </h1>
            <p className="text-gray-400">
              Manage your businesses, subscriptions, and account settings.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveTab("businesses")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "businesses"
                  ? "bg-white text-black"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <Building2 className="h-5 w-5 inline-block mr-2" />
              My Businesses
            </button>

            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "subscriptions"
                  ? "bg-white text-black"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <CreditCard className="h-5 w-5 inline-block mr-2" />
              Subscriptions & Billing
            </button>

            {hasBusinesses && (
              <button
                onClick={() => {
                  setActiveTab("analytics");
                  fetchAnalytics();
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "analytics"
                    ? "bg-white text-black"
                    : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                }`}
              >
                <BarChart3 className="h-5 w-5 inline-block mr-2" />
                Analytics
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab("bookmarks");
                fetchUserBookmarks();
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "bookmarks"
                  ? "bg-white text-black"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <Bookmark className="h-5 w-5 inline-block mr-2" />
              My Bookmarks
            </button>

            <button
              onClick={() => setActiveTab("account")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "account"
                  ? "bg-white text-black"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <User className="h-5 w-5 inline-block mr-2" />
              Account
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "settings"
                  ? "bg-white text-black"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800"
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
          {activeTab === "businesses" && (
            <MyBusinessesSection
              businesses={businesses as any}
              incompleteBusinesses={incompleteBusinesses as any}
              loading={businessesLoading}
              hasBusinesses={hasBusinesses}
              onDeleteBusiness={handleDeleteBusiness as any}
              onContinueListing={handleContinueBusinessListing}
              onBusinessUpdated={fetchUserBusinesses}
            />
          )}

          {activeTab === "subscriptions" && (
            <SubscriptionManagementSection
              businesses={businesses}
              loading={businessesLoading}
              onUpdate={fetchUserBusinesses}
            />
          )}

          {activeTab === "analytics" && (
            <BusinessAnalyticsSection
              analytics={analytics}
              loading={analyticsLoading}
              hasBusinesses={hasBusinesses}
            />
          )}

          {activeTab === "bookmarks" && (
            <MyBookmarksSection
              bookmarkedBusinesses={bookmarkedBusinesses as any}
              loading={bookmarksLoading}
              onRemoveBookmark={handleRemoveBookmark as any}
            />
          )}

          {activeTab === "account" && <AccountSettingsSection />}

          {activeTab === "settings" && <UserPreferencesSection />}

          {/* Account Deletion Confirmation Modal */}
          <AccountDeletionModal
            isOpen={showDeletionConfirm}
            onClose={() => window.location.reload()}
            onConfirm={deleteUserAccount}
            loading={deletionLoading}
          />
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
