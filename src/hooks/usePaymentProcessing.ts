import { useState } from 'react';
import { validateForm } from '../utils/paymentValidation';
import { callEdgeFunction } from '../lib/edgeFunctions';
import { sendPaymentConfirmationEmail } from '../lib/emailService';
import { DiscountInfo } from '../components/payment/DiscountCodeInput';

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingZip: string;
}

interface UsePaymentProcessingProps {
  amount: number;
  description: string;
  planName?: string;
  customerEmail?: string;
  discountInfo?: DiscountInfo | null;
  onSuccess: (paymentData: any) => void;
}

export const usePaymentProcessing = ({
  amount,
  description,
  planName = '',
  customerEmail = '',
  discountInfo,
  onSuccess
}: UsePaymentProcessingProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');

  const handleSubmit = async (e: React.FormEvent, formData: PaymentFormData) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setError(validation.errorMessage);
      return;
    }
    
    setLoading(true);
    setStep('processing');
    setError(null);

    try {
      console.log('Starting payment processing for amount:', amount);
      
      // Call the process-payment edge function using our utility
      const paymentResult = await callEdgeFunction<any>({
        functionName: 'process-payment',
        payload: {
          amount: amount * 100, // Convert to cents for payment processor
          final_amount: amount * 100, // Send the discounted amount too
          currency: 'USD',
          description: description,
          customer_email: customerEmail,
          payment_method: {
            card_number: formData.cardNumber.replace(/\s/g, ''),
            expiry_date: formData.expiryDate,
            cvv: formData.cvv,
            cardholder_name: formData.cardholderName,
            billing_zip: formData.billingZip
          },
          discount_code_id: discountInfo?.discountId // Pass the discount code ID if one was applied
        }
      });

      console.log('Payment success response:', paymentResult);
      
      const paymentData = {
        ...paymentResult,
        amount: amount,
        currency: 'USD',
        cardLast4: formData.cardNumber.slice(-4),
        timestamp: new Date().toISOString(),
        type: 'payment',
        discountApplied: discountInfo?.valid || false,
        discountInfo: discountInfo
      };
      
      setStep('success');
      
      // Send confirmation email if customer email is provided
      if (customerEmail) {
        try {
          await sendPaymentConfirmationEmail(
            customerEmail,
            amount,
            description,
            planName
          );
          console.log('Payment confirmation email sent successfully');
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
          // Don't block the payment success flow if email fails
        }
      }
      
      // Wait a moment to show success, then call onSuccess
      setTimeout(() => {
        onSuccess(paymentData);
      }, 500);
      
    } catch (err) {
      console.error('Payment processing error:', err);
      
      // Enhanced error handling with more user-friendly messages
      let errorMessage = 'Payment failed. Please try again.';
      
      if (err instanceof Error) {
        // Check for specific error patterns and provide better guidance
        if (err.message.includes('declined') || err.message.includes('Payment declined')) {
          errorMessage = 'Your card was declined. Please try a different card or contact your bank.';
        } else if (err.message.includes('Invalid') || err.message.includes('invalid')) {
          errorMessage = 'Invalid payment information. Please check your card details and try again.';
        } else if (err.message.includes('network') || err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('configuration') || err.message.includes('credentials')) {
          errorMessage = 'Payment service temporarily unavailable. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    step,
    handleSubmit
  };
};

export default usePaymentProcessing;