import React from "react";
import {
  AlertTriangle,
  X,
  CheckCircle,
  XCircle,
  Star,
  Shield,
  Trash2,
} from "lucide-react";

interface AdminActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  businessName: string;
  businessCount?: number;
  loading?: boolean;
}

const AdminActionConfirmationModal: React.FC<
  AdminActionConfirmationModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  businessName,
  businessCount = 1,
  loading = false,
}) => {
  if (!isOpen) return null;

  const getActionDetails = () => {
    switch (action) {
      case "verify":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          title: "Verify Business",
          message: `Are you sure you want to verify "${businessName}"?`,
          description:
            "This will mark the business as verified and increase its visibility in search results.",
          confirmText: "Verify Business",
          confirmColor: "bg-green-600 hover:bg-green-700",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/20",
        };
      case "unverify":
        return {
          icon: <XCircle className="h-5 w-5 text-yellow-400" />,
          title: "Remove Verification",
          message: `Are you sure you want to remove verification from "${businessName}"?`,
          description:
            "This will remove the verified status and may affect the business's visibility.",
          confirmText: "Remove Verification",
          confirmColor: "bg-yellow-600 hover:bg-yellow-700",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/20",
        };
      case "feature":
        return {
          icon: <Star className="h-5 w-5 text-purple-400" />,
          title: "Feature Business",
          message: `Are you sure you want to feature "${businessName}"?`,
          description:
            "This will promote the business in featured sections and increase its visibility.",
          confirmText: "Feature Business",
          confirmColor: "bg-purple-600 hover:bg-purple-700",
          bgColor: "bg-purple-500/20",
          borderColor: "border-purple-500/20",
        };
      case "unfeature":
        return {
          icon: <Star className="h-5 w-5 text-gray-400" />,
          title: "Remove Featured Status",
          message: `Are you sure you want to remove featured status from "${businessName}"?`,
          description: "This will remove the business from featured sections.",
          confirmText: "Remove Featured",
          confirmColor: "bg-gray-600 hover:bg-gray-700",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-500/20",
        };
      case "activate":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          title: "Activate Business",
          message: `Are you sure you want to activate "${businessName}"?`,
          description:
            "This will make the business visible in the directory again.",
          confirmText: "Activate Business",
          confirmColor: "bg-green-600 hover:bg-green-700",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/20",
        };
      case "deactivate":
        return {
          icon: <XCircle className="h-5 w-5 text-orange-400" />,
          title: "Deactivate Business",
          message: `Are you sure you want to deactivate "${businessName}"?`,
          description:
            "This will hide the business from the directory but preserve all data.",
          confirmText: "Deactivate Business",
          confirmColor: "bg-orange-600 hover:bg-orange-700",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/20",
        };
      case "delete":
        return {
          icon: <Trash2 className="h-5 w-5 text-red-400" />,
          title: "Delete Business",
          message:
            businessCount > 1
              ? `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${businessCount} businesses?`
              : `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE "${businessName}"?`,
          description:
            "This action cannot be undone and will remove all business data, including subscriptions and analytics.",
          confirmText: "Delete Business",
          confirmColor: "bg-red-600 hover:bg-red-700",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/20",
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
          title: "Confirm Action",
          message: `Are you sure you want to ${action} "${businessName}"?`,
          description: "Please confirm this action.",
          confirmText: "Confirm",
          confirmColor: "bg-blue-600 hover:bg-blue-700",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-500/20",
        };
    }
  };

  const details = getActionDetails();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${details.bgColor}`}>
              {details.icon}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {details.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-300 mb-4">{details.message}</p>

          <div
            className={`${details.bgColor} border ${details.borderColor} rounded-lg p-4`}
          >
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              What happens:
            </h4>
            <p className="text-sm text-gray-400">{details.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 ${details.confirmColor} text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              details.confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionConfirmationModal;
