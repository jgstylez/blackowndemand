import { useState } from "react";
import { validateForm } from "../utils/paymentValidation";
import { callEdgeFunction } from "../lib/edgeFunctions";
import { sendPaymentConfirmationEmail } from "../lib/emailService";
import { DiscountInfo } from "../components/payment/DiscountCodeInput";
import { useAuth } from "../contexts/AuthContext";

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingZip: string;
}

interface UsePaymentProcessingProps {
  amount: number; // original
  discountedAmount: number; // after discount
  description: string;
  planName?: string;
  customerEmail?: string;
  discountInfo?: DiscountInfo | null;
  onSuccess: (paymentData: any) => void;
}

export const usePaymentProcessing = ({
  amount,
  discountedAmount,
  description,
  planName = "",
  customerEmail = "",
  discountInfo,
  onSuccess,
}: UsePaymentProcessingProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"payment" | "processing" | "success">(
    "payment"
  );

  const { user } = useAuth();
  const customerEmail = user?.email || "";

  const handleSubmit = async (
    e: React.FormEvent,
    formData: PaymentFormData
  ) => {
    e.preventDefault();

    // Validate form data
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setError(validation.errorMessage);
      return;
    }

    setLoading(true);
    setStep("processing");
    setError(null);

    try {
      console.log("Starting payment processing for amount:", amount);

      console.log(
        "amount:",
        amount,
        "discountedAmount:",
        discountedAmount,
        "discountInfo:",
        discountInfo,
        "customerEmail:",
        customerEmail
      );

      // Call the process-payment edge function using our utility
      const paymentResult = await callEdgeFunction<any>({
        functionName: "process-payment",
        payload: {
          amount: amount * 100,
          final_amount: discountedAmount * 100,
          currency: "USD",
          description: description,
          customer_email: customerEmail,
          payment_method: {
            card_number: formData.cardNumber.replace(/\s/g, ""),
            expiry_date: formData.expiryDate,
            cvv: formData.cvv,
            cardholder_name: formData.cardholderName,
            billing_zip: formData.billingZip,
          },
          discount_code_id: discountInfo?.discountId, // Pass the discount code ID if one was applied
        },
      });

      console.log("Payment success response:", paymentResult);

      const paymentData = {
        ...paymentResult,
        amount: amount,
        currency: "USD",
        cardLast4: formData.cardNumber.slice(-4),
        timestamp: new Date().toISOString(),
        type: "payment",
        discountApplied: discountInfo?.valid || false,
        discountInfo: discountInfo,
      };

      setStep("success");

      // Send confirmation email if customer email is provided
      if (customerEmail) {
        try {
          await sendPaymentConfirmationEmail(
            customerEmail,
            amount,
            description,
            planName
          );
          console.log("Payment confirmation email sent successfully");
        } catch (emailError) {
          console.error(
            "Failed to send payment confirmation email:",
            emailError
          );
          // Don't block the payment success flow if email fails
        }
      }

      // Wait a moment to show success, then call onSuccess
      setTimeout(() => {
        onSuccess(paymentData);
      }, 500);
    } catch (err) {
      console.error("Payment processing error:", err);

      // Enhanced error handling with more user-friendly messages
      let errorMessage = "Payment failed. Please try again.";

      if (err instanceof Error) {
        // Check for specific NMI error patterns
        if (err.message.includes("response_code")) {
          errorMessage =
            "Payment was declined. Please check your card details and try again.";
        } else if (
          err.message.includes("security_key") ||
          err.message.includes("credentials")
        ) {
          errorMessage =
            "Payment service configuration error. Please contact support.";
        } else if (
          err.message.includes("network") ||
          err.message.includes("Network")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          err.message.includes("Invalid") ||
          err.message.includes("invalid")
        ) {
          errorMessage =
            "Invalid payment information. Please check your card details and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setStep("payment");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    step,
    handleSubmit,
  };
};

export default usePaymentProcessing;
