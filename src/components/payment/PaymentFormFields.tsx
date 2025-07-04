import React from 'react';
import { CreditCard, Lock, Eye, EyeOff } from 'lucide-react';
import CardIcon from './CardIcon';

interface PaymentFormFieldsProps {
  formData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
    billingZip: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExpiryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showTestCardLogos?: boolean;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  formData,
  handleInputChange,
  handleCardNumberChange,
  handleExpiryChange,
  showPassword,
  setShowPassword,
  showTestCardLogos = false
}) => {
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
            Expiry Date
          </label>
          <input
            type="text"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
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