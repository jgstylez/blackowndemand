import React, { useState, useEffect } from "react";
import {
  Flag,
  Check,
  RefreshCw,
  AlertTriangle,
  Info,
  Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import useErrorHandler from "../../hooks/useErrorHandler";

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface FeatureFlagManagementProps {
  onUpdate?: () => void;
}

const FeatureFlagManagement: React.FC<FeatureFlagManagementProps> = ({
  onUpdate,
}) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { error, handleError, clearError } = useErrorHandler({
    context: "FeatureFlagManagement",
    defaultMessage: "Failed to manage feature flags",
  });

  useEffect(() => {
    fetchFeatureFlags();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc("is_admin");

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data === true);
    } catch (err) {
      console.error("Failed to check admin status:", err);
      setIsAdmin(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      clearError();

      const { data, error: fetchError } = await supabase
        .from("feature_flags")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;

      setFeatureFlags(data || []);
    } catch (err) {
      handleError(err, { defaultMessage: "Failed to load feature flags" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagName: string, currentStatus: boolean) => {
    try {
      setToggleLoading(flagName);
      clearError();
      setSuccess(null);

      // Check if user is admin
      if (!isAdmin) {
        throw new Error("Only administrators can toggle feature flags");
      }

      const { data, error: toggleError } = await supabase.rpc(
        "toggle_feature_flag",
        {
          flag_name: flagName,
          new_status: !currentStatus,
        }
      );

      if (toggleError) throw toggleError;

      if (data) {
        // Update local state
        setFeatureFlags((prev) =>
          prev.map((flag) =>
            flag.name === flagName
              ? {
                  ...flag,
                  is_enabled: !currentStatus,
                  updated_at: new Date().toISOString(),
                }
              : flag
          )
        );

        setSuccess(
          `Feature flag "${flagName}" ${
            !currentStatus ? "enabled" : "disabled"
          } successfully`
        );

        // Call onUpdate callback if provided
        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(`Failed to toggle feature flag "${flagName}"`);
      }
    } catch (err) {
      handleError(err, {
        defaultMessage: `Failed to toggle feature flag "${flagName}"`,
      });
    } finally {
      setToggleLoading(null);

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };

  const getFeatureFlagDescription = (name: string): string => {
    switch (name) {
      case "enable_newsletter_management":
        return "Shows the Newsletter Management tab in the admin dashboard";
      case "enable_announcement_bar":
        return "Shows the Announcement Bar at the top of the site";
      case "show_test_card_logos":
        return "Shows test credit card logos in the payment modal";
      case "show_test_card_buttons":
        return "Shows test card buttons in the payment modal";
      case "enable_tip_feature":
        return 'Enables the "Tip this Business" button on business detail pages';
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Feature Flags</h2>
          <p className="text-gray-400">
            Control which features are enabled in production
          </p>
        </div>

        <button
          onClick={fetchFeatureFlags}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Admin Status Warning */}
      {!isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400 flex items-start gap-3">
          <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Editor Access Mode</p>
            <p className="text-sm">
              You have view-only access to feature flags. Only administrators
              can toggle feature flags.
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-400 flex items-start gap-3">
        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm">
            Feature flags allow you to control which features are enabled in
            production without deploying new code. Toggle features on or off to
            control their visibility across the platform.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error.message}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-500 flex items-start gap-3">
          <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Feature Flags List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-800 rounded w-48" />
                    <div className="h-4 bg-gray-800 rounded w-96" />
                  </div>
                  <div className="w-12 h-6 bg-gray-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : featureFlags.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No feature flags found</p>
            <p className="text-gray-500 text-sm mt-2">
              Feature flags will appear here once they are created
            </p>
          </div>
        ) : (
          <>
            {featureFlags.map((flag) => (
              <div key={flag.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="h-5 w-5 text-white" />
                      <h3 className="text-lg font-semibold text-white">
                        {flag.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          flag.is_enabled
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {flag.is_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {flag.description || getFeatureFlagDescription(flag.name)}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Last updated:{" "}
                      {flag.updated_at
                        ? new Date(flag.updated_at).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() =>
                        handleToggleFlag(flag.name, flag.is_enabled)
                      }
                      disabled={toggleLoading === flag.name || !isAdmin}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        flag.is_enabled ? "bg-green-500" : "bg-gray-700"
                      } ${
                        toggleLoading === flag.name || !isAdmin
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      aria-label={
                        flag.is_enabled ? "Disable feature" : "Enable feature"
                      }
                      title={
                        !isAdmin
                          ? "Only administrators can toggle feature flags"
                          : undefined
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.is_enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                      {toggleLoading === flag.name && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="animate-ping absolute h-3 w-3 rounded-full bg-white opacity-75"></span>
                        </span>
                      )}
                      {!isAdmin && (
                        <span className="absolute -right-6 text-gray-400">
                          <Lock className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default FeatureFlagManagement;
