import React, { useState, useEffect } from "react";
import { X, Lock, Check, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useFeatureFlag from "../../hooks/useFeatureFlag";
import SecuritySeal from "../common/SecuritySeal";
import DiscountCodeInput, { DiscountInfo } from "./DiscountCodeInput";
import PaymentFormFields from "./PaymentFormFields";
import { usePaymentProcessing } from "../../hooks/usePaymentProcessing";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  amount: number | undefined | null;
  description: string;
  planName?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  description,
  planName = "Business Listing",
}: PaymentModalProps) => {
  console.log("PaymentModal initialized with:", {
    amount,
    description,
    planName,
  });

  // Use feature flag to control visibility of test card logos
  const showTestCardLogos = useFeatureFlag("show_test_card_logos", false);

  // Get the authenticated user
  const navigate = useNavigate();

  // Ensure amount is always a number, defaulting to 0 if undefined or null
  const safeAmount = amount !== undefined && amount !== null ? amount : 0;

  const [formData, setFormData] = useState<{
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
    billingZip: string;
  }>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    billingZip: "",
  });

  // Add state for discount code functionality
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number>(safeAmount);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Use the payment processing hook
  const { loading, error, step, handleSubmit } = usePaymentProcessing({
    amount: safeAmount,
    discountedAmount,
    description,
    planName,
    discountInfo,
    onSuccess,
  });

  // Update discounted amount when base amount changes
  useEffect(() => {
    if (!discountInfo?.valid) {
      setDiscountedAmount(safeAmount);
    } else {
      // Recalculate with the discount
      applyDiscount(discountInfo);
    }
  }, [safeAmount]);

  // Skip payment collection if amount is zero
  useEffect(() => {
    if (isOpen && safeAmount === 0) {
      console.log("Amount is zero, skipping payment collection");
      setStep("success");

      // Create a simulated payment result for $0 transactions
      const freePaymentData = {
        success: true,
        transaction_id: `free_${Date.now()}`,
        amount: 0,
        currency: "USD",
        description: description,
        payment_date: new Date().toISOString(),
        status: "approved",
        payment_method_details: {
          type: "free",
          card: null,
        },
        simulated: true,
        isFreeTransaction: true,
      };

      // Short delay to allow modal to render before calling success
      setTimeout(() => {
        onSuccess(freePaymentData);
      }, 500);
    }
  }, [isOpen, safeAmount, description, onSuccess]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
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

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData((prev: typeof formData) => ({
      ...prev,
      cardNumber: formatted,
    }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setFormData((prev: typeof formData) => ({
      ...prev,
      expiryDate: formatted,
    }));
  };

  // Handle applying discount
  const handleApplyDiscount = (info: DiscountInfo) => {
    setDiscountInfo(info);
    applyDiscount(info);
  };

  // Apply discount calculation
  const applyDiscount = (info: DiscountInfo) => {
    if (info.valid && info.discountType && info.discountValue) {
      let newAmount = safeAmount;

      if (info.discountType === "percentage") {
        // Apply percentage discount
        const discountAmount = (safeAmount * info.discountValue) / 100;
        newAmount = safeAmount - discountAmount;
      } else if (info.discountType === "fixed") {
        // Apply fixed discount
        newAmount = safeAmount - info.discountValue;
      }

      // Ensure amount doesn't go below zero
      const finalAmount = Math.max(0, newAmount);

      // Round to 2 decimal places to avoid floating point precision issues
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

  // Handle removing discount
  const handleRemoveDiscount = () => {
    setDiscountInfo(null);
    setDiscountedAmount(safeAmount);
    console.log("handleRemoveDiscount - reset to planPrice:", safeAmount);
  };

  const renderPaymentForm = () => {
    // If amount is zero, don't render the payment form
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
              <span className="text-gray-400">Total</span>
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

            {/* Show discount information if a discount is applied */}
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
                  <span className="text-gray-400">Total after discount</span>
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

        {/* Payment Information */}
        <PaymentFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          handleCardNumberChange={handleCardNumberChange}
          handleExpiryChange={handleExpiryChange}
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
        {safeAmount === 0 ? "Order Confirmed!" : "Payment Successful!"}
      </h3>
      <p className="text-gray-400 mb-4">
        {safeAmount === 0
          ? "Your order has been processed successfully. No payment was required."
          : "Your payment has been processed successfully."}
      </p>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">
          <strong>Order Summary:</strong>
        </p>
        <div className="flex justify-between mt-2">
          <span className="text-gray-400">Total:</span>
          <span className="text-white font-medium">
            ${discountedAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-400">Status:</span>
          <span className="text-green-400">Confirmed</span>
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
            <h2 className="text-2xl font-bold text-white">
              {safeAmount === 0 ? "Confirm Order" : "Complete Payment"}
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
          {step === "payment" && renderPaymentForm()}
          {step === "processing" && renderProcessing()}
          {step === "success" && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
