import React, { useState } from "react";
import {
  CreditCard,
  Settings,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { usePaymentProvider } from "../../hooks/usePaymentProvider";

interface PaymentProviderManagementProps {
  onUpdate?: () => void;
}

export const PaymentProviderManagement: React.FC<
  PaymentProviderManagementProps
> = ({ onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSwitchProviders = useFeatureFlag(
    "payment_provider_switching",
    false
  );
  const { provider, switchProvider, isEcomPayments, isStripe } =
    usePaymentProvider();

  const handleProviderSwitch = (newProvider: "ecomPayments" | "stripe") => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      switchProvider(newProvider);
      setSuccess(`Successfully switched to ${newProvider.toUpperCase()}`);
      onUpdate?.();
    } catch (err) {
      setError("Failed to switch payment provider");
    } finally {
      setIsLoading(false);
    }

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  if (!canSwitchProviders) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <h2 className="text-2xl font-bold text-white">
            Payment Provider Management
          </h2>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-400 font-medium mb-1">
                Feature Disabled
              </h3>
              <p className="text-yellow-300/80">
                Payment provider switching is currently disabled. Enable the
                feature flag to manage payment providers.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <CreditCard className="h-5 w-5 text-gray-400" />
        <h2 className="text-2xl font-bold text-white">
          Payment Provider Management
        </h2>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Current Provider Status */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="text-lg font-medium text-white">
                Current Payment Provider
              </h3>
              <p className="text-gray-400 text-sm">
                Active payment processing system
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-400">
              {provider === "ecomPayments"
                ? "Ecom Payments"
                : provider.toUpperCase()}
            </span>
            <p className="text-gray-500 text-sm">Active</p>
          </div>
        </div>
      </div>

      {/* Payment Provider Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ecom Payments Option */}
        <div
          className={`bg-gray-900 border rounded-xl p-6 transition-all duration-200 ${
            isEcomPayments
              ? "border-blue-500 bg-blue-900/10"
              : "border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  isEcomPayments ? "bg-blue-500/20" : "bg-gray-800"
                }`}
              >
                <CreditCard
                  className={`h-6 w-6 ${
                    isEcomPayments ? "text-blue-400" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  Ecom Payments Gateway
                </h3>
                <p className="text-gray-400 text-sm">
                  Direct payment processing
                </p>
              </div>
            </div>
            {isEcomPayments ? (
              <ToggleRight className="h-8 w-8 text-blue-400" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-500" />
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <span className="text-sm">Direct payment processing</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <span className="text-sm">Vault customer management</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <span className="text-sm">Subscription handling</span>
            </div>
          </div>

          {!isEcomPayments && (
            <button
              onClick={() => handleProviderSwitch("ecomPayments")}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Switching...</span>
                </>
              ) : (
                <span>Switch to Ecom Payments</span>
              )}
            </button>
          )}

          {isEcomPayments && (
            <div className="flex items-center justify-center space-x-2 text-blue-400 py-3">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Currently Active</span>
            </div>
          )}
        </div>

        {/* Stripe Option */}
        <div
          className={`bg-gray-900 border rounded-xl p-6 transition-all duration-200 ${
            isStripe
              ? "border-purple-500 bg-purple-900/10"
              : "border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  isStripe ? "bg-purple-500/20" : "bg-gray-800"
                }`}
              >
                <CreditCard
                  className={`h-6 w-6 ${
                    isStripe ? "text-purple-400" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Stripe</h3>
                <p className="text-gray-400 text-sm">Modern payment platform</p>
              </div>
            </div>
            {isStripe ? (
              <ToggleRight className="h-8 w-8 text-purple-400" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-500" />
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <span className="text-sm">Checkout sessions</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <span className="text-sm">Customer portal</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
              <span className="text-sm">Subscription management</span>
            </div>
          </div>

          {!isStripe && (
            <button
              onClick={() => handleProviderSwitch("stripe")}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Switching...</span>
                </>
              ) : (
                <span>Switch to Stripe</span>
              )}
            </button>
          )}

          {isStripe && (
            <div className="flex items-center justify-center space-x-2 text-purple-400 py-3">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Currently Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Test Cards Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">Test Cards</h3>
        <p className="text-gray-400 text-sm mb-4">
          Use these test cards for development and testing with both providers
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-medium">Success Card</span>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-white font-mono text-sm mt-1">
              4111111111111111
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-medium">Decline Card</span>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-white font-mono text-sm mt-1">
              4000000000000002
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
