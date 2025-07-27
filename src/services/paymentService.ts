import { supabase } from "../lib/supabase";
import { PAYMENT_CONFIG, getPlanConfigByName } from "../config/paymentConfig";
import { callEdgeFunction } from "../lib/edgeFunctions";

export interface PaymentOptions {
  planName: string;
  planPrice: number;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  discountCode?: string;
  discountedAmount?: number;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  url?: string;
  error?: string;
  messageId?: string;
  free_transaction?: boolean;
}

export class PaymentService {
  /**
   * Create a Stripe checkout session for plan subscription
   */
  static async createCheckoutSession(
    options: PaymentOptions
  ): Promise<PaymentResult> {
    try {
      const planConfig = getPlanConfigByName(options.planName);
      if (!planConfig) {
        throw new Error(`Plan "${options.planName}" not found`);
      }

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            planPrice: options.planPrice,
            planName: options.planName,
            successUrl:
              options.successUrl ||
              `${PAYMENT_CONFIG.stripeConfig.successUrl}${encodeURIComponent(
                options.planName
              )}`,
            cancelUrl:
              options.cancelUrl || PAYMENT_CONFIG.stripeConfig.cancelUrl,
            discountCode: options.discountCode,
            discountedAmount: options.discountedAmount,
            metadata: options.metadata,
          },
        }
      );

      if (error) throw error;

      return {
        success: true,
        url: data?.url,
        free_transaction: data?.free_transaction,
        messageId: data?.messageId,
      };
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      };
    }
  }

  /**
   * Process payment using the legacy payment modal (for backward compatibility)
   */
  static async processPayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      const result = await callEdgeFunction<any>({
        functionName: "stripe-payment",
        payload: {
          amount: options.planPrice * 100,
          final_amount: (options.discountedAmount || options.planPrice) * 100,
          currency: PAYMENT_CONFIG.defaultCurrency,
          description: `${options.planName} - Annual Subscription`,
          customer_email: options.customerEmail,
          plan_name: options.planName,
          discount_code: options.discountCode,
          metadata: options.metadata,
        },
      });

      return {
        success: true,
        messageId: result?.messageId,
      };
    } catch (error) {
      console.error("Error processing payment:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process payment",
      };
    }
  }

  /**
   * Create a promotional offer checkout session
   */
  static async createPromotionalCheckout(
    options: PaymentOptions & { promotionId: string }
  ): Promise<PaymentResult> {
    try {
      const planConfig = getPlanConfigByName(options.planName);
      if (!planConfig) {
        throw new Error(`Plan "${options.planName}" not found`);
      }

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            planPrice: options.planPrice,
            planName: options.planName,
            successUrl:
              options.successUrl ||
              `${PAYMENT_CONFIG.stripeConfig.successUrl}${encodeURIComponent(
                options.planName
              )}`,
            cancelUrl:
              options.cancelUrl || PAYMENT_CONFIG.stripeConfig.cancelUrl,
            promotionId: options.promotionId,
            metadata: {
              ...options.metadata,
              promotion_id: options.promotionId,
              original_price: planConfig.price,
              promotional_price: options.planPrice,
            },
          },
        }
      );

      if (error) throw error;

      return {
        success: true,
        url: data?.url,
        free_transaction: data?.free_transaction,
        messageId: data?.messageId,
      };
    } catch (error) {
      console.error("Error creating promotional checkout session:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create promotional checkout session",
      };
    }
  }
}
