import React, { useState } from "react";
import {
  X,
  Check,
  Crown,
  Shield,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Star,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getAllPlans,
  getPlanConfigByName,
  PlanConfig,
} from "../../../config/paymentConfig";
import { useUnifiedPayment } from "../../../hooks/useUnifiedPayment";
import { callEdgeFunction } from "../../../lib/edgeFunctions";
import PaymentModal from "../../payment/PaymentModal";
import PaymentMethodUpdateModal from "./PaymentMethodUpdateModal";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  businessId: string;
  businessName: string;
  onSuccess: () => void;
  onCancelSuccess: () => void; // Add this new prop
}

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  businessId,
  businessName,
  onSuccess,
  onCancelSuccess, // Add this new prop
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const plans = getAllPlans();
  const currentPlanConfig = getPlanConfigByName(currentPlan);

  // Filter out the current plan and sort by price (ascending)
  const availablePlans = plans
    .filter((plan) => plan.name !== currentPlan)
    .sort((a, b) => a.price - b.price);

  // Determine if this is an upgrade or downgrade scenario
  const isUpgrade = availablePlans.some(
    (plan) => plan.price > (currentPlanConfig?.price || 0)
  );
  const isDowngrade = availablePlans.some(
    (plan) => plan.price < (currentPlanConfig?.price || 0)
  );

  // If VIP plan, it's a downgrade scenario
  const isVipPlan = currentPlan.toLowerCase() === "vip plan";
  const modalTitle = isVipPlan ? "Downgrade Plan" : "Upgrade Plan";
  const modalDescription = isVipPlan
    ? "Choose a plan that better fits your business needs"
    : "Choose a plan that better fits your business needs";

  const {
    handlePlanUpgrade,
    loading,
    error: hookError,
  } = useUnifiedPayment({
    onSuccess: (result) => {
      console.log("Plan change successful:", result);
      setShowPaymentModal(false);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Plan change failed:", error);
      console.log("Error details:", {
        message: error.message,
        userFriendlyMessage: error.userFriendlyMessage,
        details: error.details,
        code: error.code,
      });
      setUpgradeLoading(false);

      // Check if the error is about missing payment method
      const errorMessage = error.userFriendlyMessage || error.message || "";
      const errorDetails = error.details?.error || error.details?.message || "";
      const fullErrorText = `${errorMessage} ${errorDetails}`.toLowerCase();

      console.log("Checking for payment method error in:", fullErrorText);

      if (
        fullErrorText.includes("no payment method on file") ||
        fullErrorText.includes("payment method required") ||
        fullErrorText.includes("payment method required for plan changes") ||
        fullErrorText.includes("please update your payment method") ||
        fullErrorText.includes("requires_payment_method")
      ) {
        console.log("Payment method error detected - showing update modal");
        // Show payment method update modal instead of error
        setShowPaymentMethodModal(true);
      } else {
        console.log("Non-payment method error - showing error message");
        setError(
          error.userFriendlyMessage || error.message || "Failed to change plan"
        );
      }
    },
  });

  const handlePlanSelect = (plan: PlanConfig) => {
    setSelectedPlan(plan);
  };

  const handlePlanChange = async () => {
    if (!selectedPlan) return;

    setUpgradeLoading(true);
    setError(null); // Clear previous errors

    try {
      // Always call the edge function - it handles both upgrades and downgrades
      const result = await handlePlanUpgrade({
        businessId,
        currentPlan,
        newPlan: selectedPlan.name,
        planPrice: selectedPlan.price,
        customerEmail: "", // Will be filled by the hook
        metadata: {
          business_id: businessId,
          upgrade_from: currentPlan,
          upgrade_to: selectedPlan.name,
        },
      });

      // Check if it's a downgrade (no payment needed)
      const isDowngrade = selectedPlan.price < (currentPlanConfig?.price || 0);

      if (isDowngrade || result?.is_downgrade) {
        // Downgrade completed, no payment needed
        onSuccess();
        onClose();
      } else {
        // Upgrade completed with customer vault
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Error initiating plan change:", err);

      // Check if the error is about missing payment method
      if (
        err.message?.includes("No payment method on file") ||
        err.message?.includes("Payment method required") ||
        err.message?.includes("Payment method required for plan changes")
      ) {
        // Show payment method update modal instead of error
        setShowPaymentMethodModal(true);
      } else {
        setError(err.message || "Failed to change plan");
      }

      setUpgradeLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setError(null);

    try {
      console.log("Cancelling subscription for business:", businessId);

      const result = await callEdgeFunction<{
        success: boolean;
        message: string;
        error?: string;
      }>({
        functionName: "cancel-subscription",
        payload: {
          business_id: businessId,
        },
      });

      console.log("Cancel subscription result:", result);

      if (!result.success) {
        throw new Error(
          result.message || result.error || "Failed to cancel subscription"
        );
      }

      // Success - close modal and refresh
      setShowCancelConfirmation(false);
      setCancelLoading(false);

      // Close modal and call the cancellation success callback
      onClose();
      onCancelSuccess();
    } catch (err: any) {
      console.error("Error cancelling subscription:", err);
      setError(
        err.message ||
          "Failed to cancel subscription. Please try again or contact support."
      );
      setCancelLoading(false);
    }
  };

  const handlePaymentMethodSuccess = () => {
    // After payment method is updated, retry the plan change
    setShowPaymentMethodModal(false);
    handlePlanChange();
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "vip plan":
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case "enhanced plan":
        return <Shield className="h-6 w-6 text-blue-400" />;
      default:
        return <CreditCard className="h-6 w-6 text-white" />;
    }
  };

  const getPlanBadge = (plan: PlanConfig) => {
    if (plan.isPopular) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
          <Star className="h-3 w-3 mr-1" />
          Popular
        </span>
      );
    }
    if (plan.isRecommended && !isVipPlan) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
          <Check className="h-3 w-3 mr-1" />
          Recommended
        </span>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {modalTitle} for {businessName}
              </h2>
              <p className="text-gray-400 mt-1">{modalDescription}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Current Plan Display */}
          <div className="p-6 border-b border-gray-800">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getPlanIcon(currentPlan)}
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      Current Plan: {currentPlan}
                    </h3>
                    <p className="text-gray-400">
                      ${currentPlanConfig?.price || 0}/year
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Current</p>
                  <p className="text-white font-medium">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Available Plans */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isVipPlan ? "Available Plans" : "Available Plans"}
            </h3>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unable to change plan</p>
                  <p className="text-sm mt-1">{error}</p>
                  {error.includes("payment") && (
                    <button
                      onClick={() => setShowPaymentMethodModal(true)}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
                    >
                      Update payment method
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {getPlanBadge(plan)}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getPlanIcon(plan.name)}
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold text-white">
                          {plan.name}
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          ${plan.price}
                          <span className="text-sm text-gray-400 font-normal">
                            /year
                          </span>
                        </p>
                      </div>
                    </div>

                    {selectedPlan?.id === plan.id && (
                      <div className="p-2 bg-blue-500 rounded-full">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price difference indicator */}
                  {currentPlanConfig && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">
                          Price difference:
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            plan.price > currentPlanConfig.price
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {plan.price > currentPlanConfig.price ? "+" : ""}$
                          {plan.price - currentPlanConfig.price}/year
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3">
              {/* Left: Cancel Subscription (subtle) */}
              <button
                onClick={() => setShowCancelConfirmation(true)}
                className="px-2 py-1 text-sm text-gray-400 hover:text-red-400 transition-colors self-start"
                style={{ minWidth: 0 }}
              >
                Cancel Subscription
              </button>
              {/* Right: Main Actions */}
              <div className="flex gap-3 md:justify-end w-full md:w-auto">
                <button
                  onClick={handlePlanChange}
                  disabled={!selectedPlan || upgradeLoading || loading}
                  className={`flex items-center px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isVipPlan
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {upgradeLoading ? (
                    <ArrowUp className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4 mr-2" />
                  )}
                  {isVipPlan ? "Downgrade Plan" : "Upgrade Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={onSuccess}
          amount={selectedPlan.price}
          description={`${isVipPlan ? "Downgrade" : "Upgrade"} to ${
            selectedPlan.name
          } for ${businessName}`}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  Cancel Subscription
                </h3>
              </div>

              <p className="text-gray-400 mb-6">
                Are you sure you want to cancel your subscription for{" "}
                <strong className="text-white">{businessName}</strong>? This
                action cannot be undone and your business listing will be
                removed at the end of your current billing period.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirmation(false)}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {cancelLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Update Modal */}
      {showPaymentMethodModal && (
        <PaymentMethodUpdateModal
          isOpen={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          businessId={businessId}
          businessName={businessName}
          onSuccess={handlePaymentMethodSuccess}
        />
      )}
    </>
  );
};

export default PlanUpgradeModal;
