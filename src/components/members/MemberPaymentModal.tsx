import React, { useState } from "react";
import { X, Lock, Check, AlertCircle } from "lucide-react";

import useFeatureFlag from "../../hooks/useFeatureFlag";
import SecuritySeal from "../common/SecuritySeal";
import DiscountCodeInput, { DiscountInfo } from "../payment/DiscountCodeInput";
import PaymentFormFields from "../payment/PaymentFormFields";
import { usePaymentProcessing } from "../../hooks/usePaymentProcessing";
import { useAuth } from "../../contexts/AuthContext";

interface MemberPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  amount: number | undefined | null;
  description: string;
  planName?: string;
  customerEmail?: string;
}

const MemberPaymentModal: React.FC<MemberPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  description,
  planName = "Membership",
  customerEmail = "",
}) => {
  console.log("MemberPaymentModal initialized with:", {
    isOpen,
    amount,
    description,
    planName
  });

  const { } = useAuth();
  const showTestCardLogos = useFeatureFlag("show_test_card_logos", false);
  const safeAmount = amount !== undefined && amount !== null ? amount : 0;

  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    billingZip: "",
  });

  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number>(safeAmount);
  const [showPassword, setShowPassword] = useState(false);

  const { loading, error, step, handleSubmit } = usePaymentProcessing({
    amount: discountedAmount,
    description,
    planName,
    customerEmail,
    discountInfo,
    onSuccess: async (paymentData) => {
      onSuccess(paymentData);
    },
  });

  // Calculate next billing date (365 days from now)
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 365);
  const nextBillingDateString = nextBillingDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryMonthChange = (value: string) => {
    setFormData((prev) => {
      const newExpiryDate =
        value && prev.expiryYear ? `${value}/${prev.expiryYear}` : value;
      return {
        ...prev,
        expiryMonth: value,
        expiryDate: newExpiryDate,
      };
    });
  };

  const handleExpiryYearChange = (value: string) => {
    setFormData((prev) => {
      const newExpiryDate =
        prev.expiryMonth && value ? `${prev.expiryMonth}/${value}` : value;
      return {
        ...prev,
        expiryYear: value,
        expiryDate: newExpiryDate,
      };
    });
  };

  const handleApplyDiscount = (info: DiscountInfo) => {
    setDiscountInfo(info);
    applyDiscount(info);
  };

  const applyDiscount = (info: DiscountInfo) => {
    if (info.valid && info.discountType && info.discountValue) {
      let newAmount = safeAmount;

      if (info.discountType === "percentage") {
        const discountAmount = (safeAmount * info.discountValue) / 100;
        newAmount = safeAmount - discountAmount;
      } else if (info.discountType === "fixed") {
        newAmount = safeAmount - info.discountValue;
      }

      const finalAmount = Math.max(0, newAmount);
      const roundedAmount = parseFloat(finalAmount.toFixed(2));

      console.log(
        "Applied discount - calculated newAmount:",
        newAmount,
        "finalAmount:",
        finalAmount,
        "roundedAmount:",
        roundedAmount
      );
      setDiscountedAmount(roundedAmount);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountInfo(null);
    setDiscountedAmount(safeAmount);
    console.log("handleRemoveDiscount - reset to planPrice:", safeAmount);
  };

  const renderPaymentForm = () => {
    if (safeAmount === 0) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Processing your order...
          </h3>
          <p className="text-gray-400">
            Please wait while we complete your transaction.
          </p>
        </div>
      );
    }

    

    return (
      <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-500/10 text-red-500 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="whitespace-pre-line">{error}</div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">{planName}</h3>
          <p className="text-gray-400 text-sm mb-4">{description}</p>
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Annual Subscription</span>
              <span
                className={`text-2xl font-bold ${
                  discountInfo?.valid
                    ? "line-through text-gray-500"
                    : "text-white"
                }`}
              >
                ${safeAmount.toFixed(2)}
              </span>
            </div>

            {discountInfo?.valid && (
              <>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-green-400">
                    {discountInfo.discountType === "percentage"
                      ? `Discount (${discountInfo.discountValue}%)`
                      : "Discount"}
                  </span>
                  <span className="text-green-400">
                    -${(safeAmount - discountedAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-gray-700 pt-2">
                  <span className="text-gray-400">Total for first year</span>
                  <span className="text-2xl font-bold text-white">
                    ${discountedAmount.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Discount Code Input */}
        <DiscountCodeInput
          onApply={handleApplyDiscount}
          onRemove={handleRemoveDiscount}
          planName={planName}
          disabled={loading}
        />

        {/* Annual Billing Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-400 text-center text-sm">
            📅 Annual subscription - renews automatically on {nextBillingDateString}
          </p>
        </div>

        {/* Payment Information */}
        <PaymentFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          handleCardNumberChange={handleCardNumberChange}
          handleExpiryMonthChange={handleExpiryMonthChange}
          handleExpiryYearChange={handleExpiryYearChange}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showTestCardLogos={showTestCardLogos}
        />

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
          <SecuritySeal className="h-6" />
          <Lock className="h-4 w-4" />
          <span>Your payment information is encrypted and secure</span>
        </div>

        {/* Nonrefundable Notice */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded p-3">
          <p className="font-semibold text-sm">
            ⚠️ All payments are nonrefundable. Subscriptions renew automatically every 365 days.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? "Processing..." : `Pay $${discountedAmount.toFixed(2)}`}
          </button>
        </div>
      </form>
    );
  };

  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Processing Payment
      </h3>
      <p className="text-gray-400">
        Please wait while we process your payment...
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Payment Successful!
      </h3>
      <p className="text-gray-400 mb-4">
        Your annual subscription has been activated successfully.
      </p>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">
          <strong>Subscription Summary:</strong>
        </p>
        <div className="flex justify-between mt-2">
          <span className="text-gray-400">Plan:</span>
          <span className="text-white font-medium">{planName}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-400">Amount Paid:</span>
          <span className="text-green-400">${discountedAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-400">Next Renewal:</span>
          <span className="text-white">{nextBillingDateString}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-400">Status:</span>
          <span className="text-green-400">Active</span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === "payment" && renderPaymentForm()}
          {step === "processing" && renderProcessing()}
          {step === "success" && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default MemberPaymentModal;
