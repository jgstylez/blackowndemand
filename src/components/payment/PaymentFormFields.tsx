import React from "react";
import { CreditCard, Lock, Eye, EyeOff } from "lucide-react";
import CardIcon from "./CardIcon";

interface PaymentFormFieldsProps {
  formData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    expiryDate: string;
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
  showTestCardLogos?: boolean;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  formData,
  handleInputChange,
  handleCardNumberChange,
  handleExpiryMonthChange,
  handleExpiryYearChange,
  showPassword,
  setShowPassword,
  showTestCardLogos = false,
}) => {
  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, "0");
    return {
      value: month,
      label: `${month} - ${new Date(2024, i).toLocaleDateString("en-US", {
        month: "long",
      })}`,
    };
  });

  // Generate year options (current year + 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = (currentYear + i).toString().slice(-2);
    return {
      value: year,
      label: `20${year}`,
    };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        Payment Information
      </h3>
      {/* Credit Card Logos - Only show if feature flag is enabled */}
      {showTestCardLogos && (
        <div className="flex flex-wrap gap-3 mb-4">
          <CardIcon type="visa" />
          <CardIcon type="mastercard" />
          <CardIcon type="amex" />
          <CardIcon type="discover" />
          <CardIcon type="dinersclub" />
          <CardIcon type="jcb" />
          <CardIcon type="maestro" />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Number
        </label>
        <input
          type="text"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleCardNumberChange}
          placeholder="Card number"
          maxLength={19}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Month
          </label>
          <select
            value={formData.expiryMonth || ""}
            onChange={(e) => handleExpiryMonthChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10"
            required
          >
            <option value="">Month</option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Year
          </label>
          <select
            value={formData.expiryYear || ""}
            onChange={(e) => handleExpiryYearChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10"
            required
          >
            <option value="">Year</option>
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
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
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide CVV" : "Show CVV"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>
      </div>
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
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Billing Zip Code
        </label>
        <input
          type="text"
          name="billingZip"
          value={formData.billingZip}
          onChange={handleInputChange}
          placeholder="12345"
          maxLength={5}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
    </div>
  );
};

export default PaymentFormFields;
