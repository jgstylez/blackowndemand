import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeactivateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  businessName: string;
  loading?: boolean;
}

const DeactivateBusinessModal: React.FC<DeactivateBusinessModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  businessName,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Deactivate Business
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
          <p className="text-gray-300 mb-4">
            Are you sure you want to deactivate{" "}
            <span className="font-semibold text-white">"{businessName}"</span>?
          </p>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-400 mb-2">
              What happens when you deactivate:
            </h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Business will be hidden from the public directory</li>
              <li>• Your subscription will remain active</li>
              <li>• You can reactivate it anytime from your dashboard</li>
              <li>• All business data will be preserved</li>
            </ul>
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
            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deactivating...
              </div>
            ) : (
              "Deactivate Business"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateBusinessModal;
