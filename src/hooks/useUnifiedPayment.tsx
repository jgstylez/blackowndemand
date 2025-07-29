import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PaymentService, PaymentOptions } from "../services/paymentService";
import { usePaymentProvider } from "./usePaymentProvider";
import {
  UnifiedErrorHandler,
  UnifiedError,
} from "../utils/unifiedErrorHandler";
import { useNavigate } from "react-router-dom";
import { sendPaymentConfirmationEmail } from "../lib/emailService";

export interface UseUnifiedPaymentOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: UnifiedError) => void;
  redirectTo?: string;
  showPaymentModal?: boolean;
  sendConfirmationEmail?: boolean;
}

export interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingZip: string;
}

export interface UpgradeOptions {
  businessId: string;
  currentPlan: string;
  newPlan: string;
  planPrice: number;
  customerEmail?: string;
  discountCode?: string;
  discountedAmount?: number;
  metadata?: Record<string, any>;
  provider?: "stripe" | "ecomPayments";
}

export const useUnifiedPayment = (options: UseUnifiedPaymentOptions = {}) => {
  const { user } = useAuth();
  const { provider } = usePaymentProvider();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UnifiedError | null>(null);
  const [step, setStep] = useState<"payment" | "processing" | "success">(
    "payment"
  );

  const handlePayment = useCallback(
    async (paymentOptions: PaymentOptions) => {
      if (!user) {
        sessionStorage.setItem(
          "pendingPayment",
          JSON.stringify(paymentOptions)
        );
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null);
      setStep("processing");

      try {
        const result = await PaymentService.createPaymentSession({
          ...paymentOptions,
          provider: paymentOptions.provider || provider,
        });

        if (!result.success) {
          throw new Error(result.error || "Payment failed");
        }

        if (result.provider === "ecomPayments") {
          if (paymentOptions.showPaymentModal) {
            return result;
          } else {
            throw new Error("Ecom Payments requires PaymentModal flow");
          }
        } else {
          if (result.free_transaction) {
            await handlePaymentSuccess(result, paymentOptions);
            return result;
          }

          if (result.url) {
            window.location.href = result.url;
          } else {
            throw new Error("No checkout URL received");
          }
        }
      } catch (err) {
        const paymentError = UnifiedErrorHandler.normalizeError(err, {
          context: "PaymentProcessing",
          provider: provider,
        });
        setError(paymentError);
        setStep("payment");

        if (options.onError) {
          options.onError(paymentError);
        }

        UnifiedErrorHandler.logError(paymentError, {
          paymentOptions,
          provider,
          userId: user?.id,
        });
      } finally {
        setLoading(false);
      }
    },
    [user, provider, navigate, options]
  );

  const handleEcomPaymentsPayment = useCallback(
    async (
      paymentOptions: PaymentOptions & {
        paymentMethod: PaymentFormData;
        discountInfo?: any;
      }
    ) => {
      setLoading(true);
      setError(null);
      setStep("processing");

      try {
        const result = await PaymentService.processEcomPaymentsPayment(
          paymentOptions
        );

        if (!result.success) {
          throw new Error(result.error || "Ecom Payments processing failed");
        }

        await handlePaymentSuccess(result, paymentOptions);
        return result;
      } catch (err) {
        const paymentError = UnifiedErrorHandler.normalizeError(err, {
          context: "EcomPaymentsProcessing",
          provider: "ecomPayments",
        });
        setError(paymentError);
        setStep("payment");

        if (options.onError) {
          options.onError(paymentError);
        }

        UnifiedErrorHandler.logError(paymentError, {
          paymentOptions,
          provider: "ecomPayments",
          userId: user?.id,
        });
      } finally {
        setLoading(false);
      }
    },
    [user, options]
  );

  const handlePlanUpgrade = useCallback(
    async (upgradeOptions: UpgradeOptions) => {
      if (!user) {
        sessionStorage.setItem(
          "pendingUpgrade",
          JSON.stringify(upgradeOptions)
        );
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null);
      setStep("processing");

      try {
        const result = await PaymentService.upgradePlan({
          ...upgradeOptions,
          provider: upgradeOptions.provider || provider,
        });

        if (!result.success) {
          throw new Error(result.error || "Plan upgrade failed");
        }

        if (result.provider === "ecomPayments") {
          if (options.showPaymentModal) {
            return result;
          } else {
            throw new Error("Ecom Payments requires PaymentModal flow");
          }
        } else {
          if (result.url) {
            window.location.href = result.url;
          } else {
            throw new Error("No checkout URL received");
          }
        }
      } catch (err) {
        const paymentError = UnifiedErrorHandler.normalizeError(err, {
          context: "PlanUpgrade",
          provider: provider,
        });
        setError(paymentError);
        setStep("payment");

        if (options.onError) {
          options.onError(paymentError);
        }

        UnifiedErrorHandler.logError(paymentError, {
          upgradeOptions,
          provider,
          userId: user?.id,
        });
      } finally {
        setLoading(false);
      }
    },
    [user, provider, navigate, options]
  );

  const handlePaymentSuccess = useCallback(
    async (result: any, paymentOptions: PaymentOptions) => {
      setStep("success");

      // Send confirmation email if enabled
      if (options.sendConfirmationEmail && paymentOptions.customerEmail) {
        try {
          await sendPaymentConfirmationEmail(
            paymentOptions.customerEmail,
            paymentOptions.planPrice,
            paymentOptions.planName,
            paymentOptions.planName,
            result.transactionId || result.transaction_id,
            result.payment_method_details?.card?.last4,
            result.next_billing_date
          );
          console.log("Payment confirmation email sent successfully");
        } catch (emailError) {
          console.error(
            "Failed to send payment confirmation email:",
            emailError
          );
        }
      }

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      if (options.redirectTo) {
        navigate(options.redirectTo, {
          state: {
            planName: paymentOptions.planName,
            planPrice: paymentOptions.planPrice,
            paymentCompleted: true,
            transactionId: result.transactionId || result.transaction_id,
          },
        });
      }
    },
    [options, navigate]
  );

  const retryPayment = useCallback(
    async (paymentOptions: PaymentOptions, attempt: number = 1) => {
      if (!error || !error.retryable) {
        return;
      }

      const delay = UnifiedErrorHandler.getRetryDelay(error, attempt);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      await handlePayment(paymentOptions);
    },
    [error, handlePayment]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handlePayment,
    handleEcomPaymentsPayment,
    handlePlanUpgrade, // Add this to the return object
    retryPayment,
    loading,
    error,
    step,
    clearError,
    provider,
    isRetryable: error?.retryable || false,
  };
};
