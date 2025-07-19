import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, X, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callEdgeFunction } from '../../lib/edgeFunctions';

interface SubscriptionManagerProps {
  businessId: string;
  onUpdate?: () => void;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  next_billing_date: string;
  last_payment_date: string;
  payment_method_last_four: string;
}

interface PaymentMethod {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingZip: string;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ businessId, onUpdate }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingZip: ''
  });

  useEffect(() => {
    fetchSubscription();
  }, [businessId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          subscription_status,
          next_billing_date,
          last_payment_date,
          payment_method_last_four,
          subscriptions (
            id,
            plan_id,
            subscription_plans (
              name
            )
          )
        `)
        .eq('id', businessId)
        .single();

      if (error) throw error;

      if (data) {
        setSubscription({
          id: data.subscriptions?.id || '',
          plan_name: data.subscriptions?.subscription_plans?.name || 'Unknown Plan',
          status: data.subscription_status || 'inactive',
          next_billing_date: data.next_billing_date || '',
          last_payment_date: data.last_payment_date || '',
          payment_method_last_four: data.payment_method_last_four || ''
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with spaces
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentMethod(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'expiryDate') {
      // Format expiry date as MM/YY
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      }
      setPaymentMethod(prev => ({ ...prev, [name]: formatted }));
    } else {
      setPaymentMethod(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!paymentMethod.cardNumber || !paymentMethod.expiryDate || !paymentMethod.cvv) {
        throw new Error('Please fill out all required fields');
      }

      // Call the update-payment-method Edge Function
      const result = await callEdgeFunction<{ success: boolean, message: string, last4: string }>({
        functionName: 'update-payment-method',
        payload: {
          business_id: businessId,
          payment_method: {
            card_number: paymentMethod.cardNumber,
            expiry_date: paymentMethod.expiryDate,
            cvv: paymentMethod.cvv,
            billing_zip: paymentMethod.billingZip
          }
        }
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to update payment method');
      }

      setSuccess('Payment method updated successfully');
      setShowUpdateForm(false);
      
      // Clear form
      setPaymentMethod({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        billingZip: ''
      });
      
      // Refresh subscription data
      fetchSubscription();
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the cancel-subscription Edge Function
      const result = await callEdgeFunction<{ success: boolean, message: string }>({
        functionName: 'cancel-subscription',
        payload: {
          business_id: businessId
        }
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to cancel subscription');
      }

      setSuccess('Subscription cancelled successfully');
      setShowCancelConfirm(false);
      
      // Refresh subscription data
      fetchSubscription();
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Subscription</h3>
        <p className="text-gray-400">No active subscription found for this business.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Subscription Management</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-gray-800 rounded-full">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Plan</p>
              <p className="text-white font-medium">{subscription.plan_name}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            subscription.status === 'active' ? 'bg-green-500/20 text-green-500' :
            subscription.status === 'past_due' ? 'bg-yellow-500/20 text-yellow-500' :
            subscription.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
            'bg-gray-500/20 text-gray-500'
          }`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </div>
        </div>
        
        {subscription.payment_method_last_four && (
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-gray-800 rounded-full">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Payment Method</p>
              <p className="text-white font-medium">•••• •••• •••• {subscription.payment_method_last_four}</p>
            </div>
          </div>
        )}
        
        {subscription.next_billing_date && (
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-gray-800 rounded-full">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Next Billing Date</p>
              <p className="text-white font-medium">
                {new Date(subscription.next_billing_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
        
        {subscription.last_payment_date && (
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-gray-800 rounded-full">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Last Payment Date</p>
              <p className="text-white font-medium">
                {new Date(subscription.last_payment_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {subscription.status !== 'cancelled' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowUpdateForm(true)}
            className="flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Update Payment Method
          </button>
          
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center justify-center px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel Subscription
          </button>
        </div>
      )}
      
      {/* Update Payment Method Form */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Update Payment Method</h3>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePaymentMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentMethod.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
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
                    value={paymentMethod.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={paymentMethod.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Billing ZIP Code
                </label>
                <input
                  type="text"
                  name="billingZip"
                  value={paymentMethod.billingZip}
                  onChange={handleInputChange}
                  placeholder="12345"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUpdateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Cancel Subscription Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to cancel your subscription? Your business listing will remain active until the end of your current billing period.
              </p>
              <p className="text-gray-400 text-sm">
                After cancellation, your business will no longer appear in the directory.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Keep Subscription
              </button>
              
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;