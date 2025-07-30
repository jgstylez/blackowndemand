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
  Menu,
  X,
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
  const { user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("businesses");
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    // Business has a subscription ID and status is pending
    const hasSubscription =
      b.subscription_id && b.subscription_status === "pending";

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
  }, [activeTab]);

  // Set success message from various sources
  useEffect(() => {
    if (settingsSuccess) {
      setSuccess(settingsSuccess);
    }
  }, [settingsSuccess]);

  // Add admin status check
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("is_admin", {
        user_uuid: user.id,
      });

      if (!error && data === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Failed to check admin status:", err);
      setIsAdmin(false);
    }
  };

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

  // Add signout handler
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is clicked

    // Fetch data for specific tabs
    if (tab === "bookmarks") {
      fetchUserBookmarks();
    } else if (tab === "analytics") {
      fetchAnalytics();
    }
  };

  if (
    error &&
    !businessesLoading &&
    !bookmarksLoading &&
    !profileLoading &&
    !settingsLoading
  ) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorFallback
            error={error}
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

  const tabConfig = [
    {
      id: "businesses" as Tab,
      label: "My Businesses",
      icon: Building2,
    },
    {
      id: "subscriptions" as Tab,
      label: "Subscriptions & Billing",
      icon: CreditCard,
    },
    {
      id: "analytics" as Tab,
      label: "Analytics",
      icon: BarChart3,
      show: hasBusinesses,
    },
    {
      id: "bookmarks" as Tab,
      label: "My Bookmarks",
      icon: Bookmark,
    },
    {
      id: "account" as Tab,
      label: "Account",
      icon: User,
    },
    {
      id: "settings" as Tab,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <Layout
      title="Dashboard | BlackOWNDemand"
      description="Manage your businesses, bookmarks, and account settings"
    >
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {getGreeting()}
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Manage your businesses, subscriptions, and account settings.
              </p>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center justify-between sm:hidden w-full">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-700 hover:border-gray-600"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
              {!isAdmin && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-700 hover:border-gray-600 text-sm"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              )}
            </div>

            {/* Desktop Sign Out Button */}
            {!isAdmin && (
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-700 hover:border-gray-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            )}
          </div>

          {/* Mobile Tab Navigation */}
          {isMobileMenuOpen && (
            <div className="sm:hidden mb-6 bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                {tabConfig.map((tab) => {
                  if (tab.show === false) return null;
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex flex-col items-center p-3 rounded-lg transition-colors text-sm ${
                        activeTab === tab.id
                          ? "bg-white text-black"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      <IconComponent className="h-5 w-5 mb-1" />
                      <span className="text-xs">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop Tab Navigation */}
          <div className="hidden sm:flex flex-wrap gap-2 mb-8">
            {tabConfig.map((tab) => {
              if (tab.show === false) return null;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-black"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                  }`}
                >
                  <IconComponent className="h-5 w-5 inline-block mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Active Tab Indicator */}
          <div className="sm:hidden mb-6">
            <div className="hidden sm:flex items-center justify-center p-3 bg-gray-900 rounded-lg border border-gray-700">
              {tabConfig.map((tab) => {
                if (tab.show === false) return null;
                if (activeTab === tab.id) {
                  const IconComponent = tab.icon;
                  return (
                    <div key={tab.id} className="flex items-center">
                      <IconComponent className="h-5 w-5 mr-2" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">{success}</span>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="ml-4 p-1 text-green-500 hover:text-green-400 hover:bg-green-500/20 rounded transition-colors"
                aria-label="Dismiss success message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Render the active tab content */}
          <div className="space-y-6">
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
          </div>

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
