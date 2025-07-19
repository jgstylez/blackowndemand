import React, { useState, useEffect } from 'react';
import { X, Crown, CreditCard, Lock, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DiscountCodeInput, { DiscountInfo } from '../payment/DiscountCodeInput';
import { supabase } from '../../lib/supabase';
import PaymentModal from '../payment/PaymentModal';

interface VIPPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  amount: number;
}

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  email: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  original_plan_id: string;
  original_plan_name: string;
  original_price: number;
  promotional_price: number;
  start_date: string;
  end_date: string | null;
  savings_amount: number;
  savings_percentage: number;
}

const VIPPaymentModal: React.FC<VIPPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [regularPrice, setRegularPrice] = useState<number>(120); // Default to $120
  
  const [formData, setFormData] = useState<PaymentForm>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: user?.email || '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });

  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number>(amount);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch promotion and regular price when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchVIPPlanDetails();
    }
  }, [isOpen]);

  const fetchVIPPlanDetails = async () => {
    try {
      // Get the regular price from subscription_plans
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('price')
        .eq('name', 'VIP Plan')
        .single();
      
      if (planError) throw planError;
      
      if (planData) {
        setRegularPrice(planData.price);
      }
      
      // Get active promotion
      const { data: promoData, error: promoError } = await supabase.rpc('get_active_promotion_for_plan', {
        plan_name: 'VIP Plan'
      });
      
      if (promoError) throw promoError;
      
      if (promoData && promoData.length > 0) {
        setPromotion(promoData[0]);
        // Update the discounted amount to the promotional price
        setDiscountedAmount(promoData[0].promotional_price);
      } else {
        // If no promotion, use the regular price
        setDiscountedAmount(planData.price);
      }
    } catch (err) {
      console.error('Error fetching VIP plan details:', err);
    }
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError(null);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setFormData(prev => ({ ...prev, expiryDate: formatted }));
  };

  const validateForm = () => {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid card number');
      return false;
    }
    
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      setError('Please enter a valid expiry date');
      return false;
    }
    
    // Check if expiry date is in the future
    const [month, year] = formData.expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      setError('Card has expired');
      return false;
    }
    
    if (!formData.cvv || formData.cvv.length !== 3) {
      setError('Please enter a valid 3-digit CVV');
      return false;
    }
    
    if (!formData.cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }

    return true;
  };

  const handleApplyDiscount = (info: DiscountInfo) => {
    setDiscountInfo(info);
    
    // Calculate discounted amount
    if (info.valid && info.discountType && info.discountValue) {
      let newAmount = promotion?.promotional_price || regularPrice;
      
      if (info.discountType === 'percentage') {
        // Apply percentage discount
        const discountAmount = (newAmount * info.discountValue) / 100;
        newAmount = newAmount - discountAmount;
      } else if (info.discountType === 'fixed') {
        // Apply fixed discount
        newAmount = newAmount - info.discountValue;
      }
      
      // Ensure amount doesn't go below zero
      setDiscountedAmount(Math.max(0, newAmount));
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountInfo(null);
    setDiscountedAmount(promotion?.promotional_price || regularPrice);
  };

  const handlePaymentClick = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentModalSuccess = (paymentData: any) => {
    setShowPaymentModal(false);
    setStep('success');
    
    // Wait a moment to show success, then call onSuccess
    setTimeout(() => {
      onSuccess(paymentData);
    }, 500);
  };

  const renderPaymentForm = () => (
    <form className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-400" />
          VIP Member Benefits
        </h3>
        <div className="space-y-3 text-sm text-gray-300 mb-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span>Exclusive VIP member status</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span>Priority customer support</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span>Exclusive access to new features</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span>Private VIP member network</span>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Original Price</span>
            <span className={`text-xl ${promotion || discountInfo?.valid ? 'line-through text-gray-500' : 'text-white font-bold'}`}>
              ${regularPrice.toFixed(2)}
            </span>
          </div>
          
          {promotion && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-yellow-400">
                Limited Time Offer
              </span>
              <span className="text-yellow-400">
                ${promotion.promotional_price.toFixed(2)}
              </span>
            </div>
          )}
          
          {discountInfo?.valid && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-green-400">
                {discountInfo.discountType === 'percentage' 
                  ? `Discount (${discountInfo.discountValue}%)` 
                  : 'Discount'}
              </span>
              <span className="text-green-400">
                -${((promotion?.promotional_price || regularPrice) - discountedAmount).toFixed(2)}
              </span>
            </div>
          )}
          
          {(promotion || discountInfo?.valid) && (
            <div className="flex justify-between items-center mt-2 border-t border-gray-700 pt-2">
              <span className="text-gray-400">Total (Annual payment)</span>
              <span className="text-2xl font-bold text-white">${discountedAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Discount Code */}
      <DiscountCodeInput 
        onApply={handleApplyDiscount}
        onRemove={handleRemoveDiscount}
        planName="VIP Plan"
        disabled={loading}
      />

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
          type="button"
          onClick={handlePaymentClick}
          disabled={loading}
          className="flex-1 py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Processing...' : `Pay $${discountedAmount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Welcome, VIP Member!</h3>
      <p className="text-gray-400 mb-4">
        Your payment has been processed successfully. You now have exclusive VIP member benefits.
      </p>
      {promotion && (
        <div className="bg-yellow-500/10 text-yellow-400 p-4 rounded-lg mb-4">
          Limited time offer applied: ${promotion.savings_amount.toFixed(2)} savings ({promotion.savings_percentage}% off)
        </div>
      )}
      {discountInfo?.valid && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-lg mb-4">
          {discountInfo.discountType === 'percentage' 
            ? `${discountInfo.discountValue}% discount applied` 
            : `$${discountInfo.discountValue} discount applied`}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 text-yellow-400 mb-6">
        <Crown className="h-5 w-5" />
        <span className="font-semibold">VIP Member Status Activated</span>
      </div>
      
      <button
        onClick={() => navigate('/dashboard')}
        className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
      >
        Go to Dashboard
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              Become a VIP Member
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
          {step === 'payment' && renderPaymentForm()}
          {step === 'success' && renderSuccess()}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentModalSuccess}
        amount={discountedAmount}
        description={`Annual VIP Membership - ${promotion ? 'Promotional Rate' : 'Standard Rate'}${discountInfo?.valid ? ' with Additional Discount' : ''}`}
        planName="VIP Membership"
      />
    </div>
  );
};

export default VIPPaymentModal;