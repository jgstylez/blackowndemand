import React, { useState } from "react";
import { useAccountManagement } from "../../../hooks/dashboard/useAccountManagement";
import useUserProfile from "../../../hooks/dashboard/useUserProfile";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import AccountDeletionModal from "./AccountDeletionModal";

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
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>

      <div className="space-y-8">
        {/* Email Change Section */}
        <div className="border-b border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-white mb-4">Change Email</h3>
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
              <div className="text-red-400 text-sm">{emailError}</div>
            )}
            {emailSuccess && (
              <div className="text-green-400 text-sm">{emailSuccess}</div>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {emailLoading ? "Updating..." : "Update Email"}
            </button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="border-b border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Change Password
          </h3>
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
              <div className="text-red-400 text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-green-400 text-sm">{passwordSuccess}</div>
            )}
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Account Deletion Section */}
        <div>
          <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
          <p className="text-gray-400 text-sm mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button
            onClick={prepareAccountDeletion}
            disabled={deletionLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {deletionLoading ? "Loading..." : "Delete Account"}
          </button>
          {deletionError && (
            <p className="text-red-400 text-sm mt-2">{deletionError}</p>
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
