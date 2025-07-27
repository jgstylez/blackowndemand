import React from "react";
import { Eye, EyeOff, CreditCard } from "lucide-react";
import CardIcon from "./CardIcon";

interface PaymentFormFieldsProps {
  formData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
    billingZip: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExpiryMonthChange: (value: string) => void;
  handleExpiryYearChange: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showTestCardLogos: boolean;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  formData,
  handleInputChange,
  handleCardNumberChange,
  handleExpiryMonthChange,
  handleExpiryYearChange,
  showPassword,
  setShowPassword,
  showTestCardLogos,
}) => {
  const getCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "visa";
    if (number.startsWith("5") || number.startsWith("2")) return "mastercard";
    if (number.startsWith("3")) return "amex";
    if (number.startsWith("6")) return "discover";
    return "unknown";
  };

  const cardType = getCardType(formData.cardNumber);

  return (
    <div className="space-y-4">
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

      {/* Test Card Info */}
      {showTestCardLogos && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-medium mb-2">
            Test Mode - Use these cards:
          </p>
          <div className="space-y-1 text-xs text-blue-300">
            <p>• Visa: 4242 4242 4242 4242</p>
            <p>• Mastercard: 5555 5555 5555 4444</p>
            <p>• Use any future expiry date and any CVV</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFormFields;
