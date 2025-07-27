import { X, Crown, Star, Check, ArrowRight } from "lucide-react";
import { useUnifiedPayment } from "../../hooks/useUnifiedPayment";

interface Promotion {
  id: string;
  name: string;
  description: string;
  originalPlanId: string;
  originalPlanName: string;
  originalPrice: number;
  promotionalPrice: number;
  startDate: string;
  endDate: string | null;
}

interface PromotionOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: Promotion;
  onAccept: (promotionId: string) => void;
  onDecline: () => void;
}

const PromotionOfferModal: React.FC<PromotionOfferModalProps> = ({
  isOpen,
  onClose,
  promotion,
  onAccept,
  onDecline,
}) => {
  const { handlePromotionalPayment, loading, error } = useUnifiedPayment({
    onSuccess: () => {
      onAccept(promotion.id);
    },
    onError: (errorMessage) => {
      console.error("Payment error:", errorMessage);
    },
  });

  if (!isOpen) return null;

  const handleAccept = async () => {
    await handlePromotionalPayment({
      planName: promotion.originalPlanName,
      planPrice: promotion.promotionalPrice,
      promotionId: promotion.id,
      metadata: {
        original_price: promotion.originalPrice,
        promotional_price: promotion.promotionalPrice,
        promotion_id: promotion.id,
      },
    });
  };

  // Calculate savings
  const savings = promotion.originalPrice - promotion.promotionalPrice;
  const savingsPercentage = Math.round(
    (savings / promotion.originalPrice) * 100
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              Special Offer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 mb-4">
                <Star className="h-4 w-4" />
                Limited Time Offer
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Upgrade to VIP at a Special Price!
              </h3>
              <p className="text-gray-400">
                As a thank you for claiming your business, we're offering you
                our premium VIP plan at a special price.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <h4 className="text-lg font-semibold text-white">VIP Plan</h4>
                </div>
                <div className="text-right">
                  <span className="text-gray-400">
                    ${promotion.originalPrice}
                  </span>
                  <span className="text-2xl font-bold text-white ml-2">
                    ${promotion.promotionalPrice}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium mb-4">
                Save ${savings} ({savingsPercentage}% off)
              </div>

              <div className="space-y-3 text-sm text-gray-300 mb-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>Exclusive VIP member badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>Priority placement in search results</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>Access to exclusive features and tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>Special recognition in the directory</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>All benefits of the Basic and Enhanced plans</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Annual subscription. Offer valid until{" "}
                {promotion.endDate
                  ? new Date(promotion.endDate).toLocaleDateString()
                  : "limited time only"}
                .
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onDecline}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                No Thanks
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg transition-colors font-semibold flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    Get VIP
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionOfferModal;
