import React, { useState } from "react";
import { useAccountManagement } from "../../../hooks/dashboard/useAccountManagement";
import useUserProfile from "../../../hooks/dashboard/useUserProfile";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import AccountDeletionModal from "./AccountDeletionModal";
import { Mail, Lock, Trash2, AlertTriangle } from "lucide-react";

const AccountSettingsSection = () => {
  const { user } = useAuth();
  const {
    deletionSummary,
    deletionLoading,
    deletionError,
    prepareAccountDeletion,
    deleteUserAccount,
  } = useAccountManagement();

  // Email change state
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: emailForm.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: emailForm.newEmail,
      });

      if (updateError) {
        throw updateError;
      }

      setEmailSuccess(
        "Email update initiated. Please check your new email for confirmation."
      );
      setEmailForm({ newEmail: "", currentPassword: "" });
    } catch (error: any) {
      setEmailError(error.message || "Failed to update email");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordLoading(false);
      return;
    }

    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setPasswordSuccess("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setPasswordError(error.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Account Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Email Change Section */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Change Email</h3>
          </div>

          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Email
              </label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, newEmail: e.target.value })
                }
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={emailForm.currentPassword}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    currentPassword: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {emailError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm">
                {emailSuccess}
              </div>
            )}

            <div className="pt-4 border-t border-gray-800">
              <button
                type="submit"
                disabled={emailLoading}
                className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="h-4 w-4 mr-2" />
                {emailLoading ? "Updating..." : "Update Email"}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Change Password
            </h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                required
                minLength={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
                minLength={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="pt-4 border-t border-gray-800">
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="h-4 w-4 mr-2" />
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Account Deletion Section */}
        <div className="bg-gray-900 rounded-xl p-6 border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
          </div>

          <p className="text-gray-400 text-sm mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>

          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={prepareAccountDeletion}
              disabled={deletionLoading}
              className="flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deletionLoading ? "Loading..." : "Delete Account"}
            </button>
          </div>

          {deletionError && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {deletionError}
            </div>
          )}
        </div>
      </div>

      <AccountDeletionModal
        isOpen={!!deletionSummary}
        onClose={() => window.location.reload()}
        onConfirm={deleteUserAccount}
        loading={deletionLoading}
      />
    </div>
  );
};

export default AccountSettingsSection;
