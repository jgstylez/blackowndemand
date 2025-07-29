import React, { useState } from "react";
import {
  X,
  Lock,
  Check,
  AlertCircle,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";
import { callEdgeFunction } from "../../../lib/edgeFunctions";
import CardIcon from "../../payment/CardIcon";
import SecuritySeal from "../../common/SecuritySeal";

interface PaymentMethodUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  onSuccess: () => void;
  currentPaymentMethod?: {
    id: string;
    last4: string;
    exp_month: string;
    exp_year: string;
  };
}

interface PaymentFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingZip: string;
}

const PaymentMethodUpdateModal: React.FC<PaymentMethodUpdateModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
  onSuccess,
  currentPaymentMethod,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
    billingZip: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    setFormData((prev) => ({ ...prev, expiryMonth: value }));
  };

  const handleExpiryYearChange = (value: string) => {
    setFormData((prev) => ({ ...prev, expiryYear: value }));
  };

  const getCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "visa";
    if (number.startsWith("5") || number.startsWith("2")) return "mastercard";
    if (number.startsWith("3")) return "amex";
    if (number.startsWith("6")) return "discover";
    return "unknown";
  };

  const validateForm = () => {
    if (!formData.cardNumber.replace(/\s/g, "")) {
      throw new Error("Card number is required");
    }
    if (!formData.expiryMonth || !formData.expiryYear) {
      throw new Error("Expiry date is required");
    }
    if (!formData.cvv) {
      throw new Error("CVV is required");
    }
    if (!formData.cardholderName.trim()) {
      throw new Error("Cardholder name is required");
    }
    if (!formData.billingZip.trim()) {
      throw new Error("Billing ZIP code is required");
    }

    // Validate card number length
    const cardNumber = formData.cardNumber.replace(/\s/g, "");
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      throw new Error("Invalid card number");
    }

    // Validate CVV length
    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      throw new Error("Invalid CVV");
    }

    // Validate ZIP code
    if (formData.billingZip.length < 5) {
      throw new Error("Invalid ZIP code");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      validateForm();

      // Format expiry date as MM/YY
      const expiryDate = `${formData.expiryMonth}/${formData.expiryYear.slice(
        -2
      )}`;

      const result = await callEdgeFunction<{
        success: boolean;
        message: string;
        last4: string;
      }>({
        functionName: "update-payment-method",
        payload: {
          business_id: businessId,
          payment_method: {
            card_number: formData.cardNumber.replace(/\s/g, ""),
            expiry_date: expiryDate,
            cvv: formData.cvv,
            cardholder_name: formData.cardholderName,
            billing_zip: formData.billingZip,
          },
        },
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to update payment method");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error updating payment method:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update payment method"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
          <div className="text-center">
            <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Payment Method Updated!
            </h3>
            <p className="text-gray-400">
              Your payment method has been successfully updated for{" "}
              {businessName}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cardType = getCardType(formData.cardNumber);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Current Payment Method Display */}
        {currentPaymentMethod && (
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-3">
              Current Payment Method
            </h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-6 w-6 text-blue-400" />
                <div>
                  <p className="text-white font-medium">
                    •••• •••• •••• {currentPaymentMethod.last4}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Expires {currentPaymentMethod.exp_month}/
                    {currentPaymentMethod.exp_year}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Update Payment Method
            </h2>
            <p className="text-gray-400 mt-1">
              Required for {businessName} plan changes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {cardType !== "unknown" ? (
                  <CardIcon type={cardType} className="h-6 w-6" />
                ) : (
                  <CreditCard className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expiry Month
              </label>
              <select
                value={formData.expiryMonth}
                onChange={(e) => handleExpiryMonthChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = String(i + 1).padStart(2, "0");
                  const monthName = new Date(0, i).toLocaleString("en-US", {
                    month: "long",
                  });
                  return (
                    <option key={monthNum} value={monthNum}>
                      {monthNum} - {monthName}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expiry Year
              </label>
              <select
                value={formData.expiryYear}
                onChange={(e) => handleExpiryYearChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="">Year</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={String(year).slice(-2)}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* CVV & Billing ZIP side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CVV
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {/* Billing ZIP */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Billing ZIP Code
              </label>
              <input
                type="text"
                name="billingZip"
                value={formData.billingZip}
                onChange={(e) => {
                  // Only allow numeric and max 5 digits
                  const numeric = e.target.value.replace(/\D/g, "").slice(0, 5);
                  handleInputChange({
                    ...e,
                    target: {
                      ...e.target,
                      value: numeric,
                      name: "billingZip",
                    },
                  });
                }}
                placeholder="12345"
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              name="cardholderName"
              value={formData.cardholderName}
              onChange={handleInputChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          {/* Security Seal */}
          <div className="pt-4">
            <SecuritySeal />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Update Payment Method
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentMethodUpdateModal;
