import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PaymentService, PaymentOptions } from "../services/paymentService";
import { useNavigate } from "react-router-dom";

export interface UseUnifiedPaymentOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export const useUnifiedPayment = (options: UseUnifiedPaymentOptions = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (paymentOptions: PaymentOptions) => {
    if (!user) {
      // Store payment options in session storage for after login
      sessionStorage.setItem("pendingPayment", JSON.stringify(paymentOptions));
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Always use Stripe checkout for consistency
      const result = await PaymentService.createCheckoutSession(paymentOptions);

      if (!result.success) {
        throw new Error(result.error || "Payment failed");
      }

      if (result.free_transaction) {
        // Handle $0 transactions
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        if (options.redirectTo) {
          navigate(options.redirectTo, {
            state: {
              planName: paymentOptions.planName,
              planPrice: paymentOptions.planPrice,
              paymentCompleted: true,
            },
          });
        }
        return;
      }

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      if (options.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionalPayment = async (
    paymentOptions: PaymentOptions & { promotionId: string }
  ) => {
    if (!user) {
      sessionStorage.setItem(
        "pendingPromotionalPayment",
        JSON.stringify(paymentOptions)
      );
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await PaymentService.createPromotionalCheckout(
        paymentOptions
      );

      if (!result.success) {
        throw new Error(result.error || "Promotional payment failed");
      }

      if (result.free_transaction) {
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        if (options.redirectTo) {
          navigate(options.redirectTo, {
            state: {
              planName: paymentOptions.planName,
              planPrice: paymentOptions.planPrice,
              paymentCompleted: true,
              promotionId: paymentOptions.promotionId,
            },
          });
        }
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Promotional payment failed";
      setError(errorMessage);
      if (options.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    handlePayment,
    handlePromotionalPayment,
    loading,
    error,
    clearError: () => setError(null),
  };
};
