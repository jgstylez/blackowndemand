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
} from "lucide-react";
import {
  getAllPlans,
  getPlanConfigByName,
  PlanConfig,
} from "../../../config/paymentConfig";
import { useUnifiedPayment } from "../../../hooks/useUnifiedPayment";
import PaymentModal from "../../payment/PaymentModal";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  businessId: string;
  businessName: string;
  onSuccess: () => void;
}

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  businessId,
  businessName,
  onSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

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

  const { handlePlanUpgrade, loading, error } = useUnifiedPayment({
    onSuccess: (result) => {
      console.log("Plan change successful:", result);
      setShowPaymentModal(false);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Plan change failed:", error);
      setUpgradeLoading(false);
    },
  });

  const handlePlanSelect = (plan: PlanConfig) => {
    setSelectedPlan(plan);
  };

  const handlePlanChange = async () => {
    if (!selectedPlan) return;

    setUpgradeLoading(true);

    try {
      await handlePlanUpgrade({
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

      setShowPaymentModal(true);
    } catch (err) {
      console.error("Error initiating plan change:", err);
      setUpgradeLoading(false);
    }
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
    if (plan.isRecommended) {
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
                <span>{error.userFriendlyMessage}</span>
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
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlanChange}
                disabled={!selectedPlan || upgradeLoading || loading}
                className={`flex items-center px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isVipPlan
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isVipPlan ? (
                  <ArrowDown className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowUp className="h-4 w-4 mr-2" />
                )}
                {upgradeLoading || loading
                  ? "Processing..."
                  : isVipPlan
                  ? "Downgrade Plan"
                  : "Upgrade Plan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(paymentData) => {
            console.log("Payment successful:", paymentData);
            setShowPaymentModal(false);
            onSuccess();
            onClose();
          }}
          amount={selectedPlan.price}
          description={`${isVipPlan ? "Downgrade" : "Upgrade"} to ${
            selectedPlan.name
          } for ${businessName}`}
          planName={selectedPlan.name}
        />
      )}
    </>
  );
};

export default PlanUpgradeModal;
