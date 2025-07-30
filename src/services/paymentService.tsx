import {
  PAYMENT_CONFIG,
  getPlanConfigByName,
  getPlanConfigByProvider,
} from "../config/paymentConfig";
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
  provider?: "stripe" | "ecomPayments";
  showPaymentModal?: boolean;
}

export interface PaymentResult {
  success: boolean;
  url?: string;
  error?: string;
  messageId?: string;
  free_transaction?: boolean;
  provider?: string;
  transactionId?: string;
  is_downgrade?: boolean;
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

export class PaymentService {
  static async createPaymentSession(
    options: PaymentOptions
  ): Promise<PaymentResult> {
    try {
      const provider = options.provider || this.getCurrentProvider();
      const planConfig = getPlanConfigByProvider(options.planName, provider);

      if (!planConfig) {
        throw new Error(
          `Plan "${options.planName}" is not configured for ${provider}`
        );
      }

      if (provider === "ecomPayments") {
        return this.createEcomPaymentsSession(options);
      } else {
        return this.createStripeCheckoutSession(options);
      }
    } catch (error) {
      console.error("Error creating payment session:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment session",
        provider: options.provider || this.getCurrentProvider(),
      };
    }
  }

  static async createStripeCheckoutSession(
    options: PaymentOptions
  ): Promise<PaymentResult> {
    try {
      const planConfig = getPlanConfigByName(options.planName);
      if (!planConfig) {
        throw new Error(`Plan "${options.planName}" not found`);
      }

      const result = await callEdgeFunction<any>({
        functionName: "create-checkout-session",
        payload: {
          planPrice: options.planPrice,
          planName: options.planName,
          successUrl:
            options.successUrl ||
            `${PAYMENT_CONFIG.stripeConfig.successUrl}${encodeURIComponent(
              options.planName
            )}`,
          cancelUrl: options.cancelUrl || PAYMENT_CONFIG.stripeConfig.cancelUrl,
          discountCode: options.discountCode,
          discountedAmount: options.discountedAmount,
          metadata: options.metadata,
        },
      });

      return {
        success: true,
        url: result?.url,
        free_transaction: result?.free_transaction,
        messageId: result?.messageId,
        provider: "stripe",
      };
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Stripe checkout session",
        provider: "stripe",
      };
    }
  }

  static async createEcomPaymentsSession(
    options: PaymentOptions
  ): Promise<PaymentResult> {
    try {
      const planConfig = getPlanConfigByName(options.planName);
      if (!planConfig) {
        throw new Error(`Plan "${options.planName}" not found`);
      }

      return {
        success: true,
        provider: "ecomPayments",
        messageId: `ecom_${Date.now()}`,
      };
    } catch (error) {
      console.error("Error creating Ecom Payments session:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Ecom Payments session",
        provider: "ecomPayments",
      };
    }
  }

  static async processEcomPaymentsPayment(
    options: PaymentOptions & { paymentMethod: any; discountInfo?: any }
  ): Promise<PaymentResult> {
    try {
      const result = await callEdgeFunction<any>({
        functionName: "process-payment",
        payload: {
          amount: options.planPrice * 100,
          final_amount: (options.discountedAmount || options.planPrice) * 100,
          currency: PAYMENT_CONFIG.defaultCurrency,
          description: `${options.planName} - Annual Subscription`,
          customer_email: options.customerEmail,
          plan_name: options.planName,
          discount_code_id: options.discountInfo?.discount_id,
          payment_method: options.paymentMethod,
          is_recurring: true,
        },
      });

      return {
        success: true,
        transactionId: result?.transaction_id,
        messageId: result?.messageId,
        provider: "ecomPayments",
      };
    } catch (error) {
      console.error("Error processing Ecom Payments payment:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Ecom Payments payment",
        provider: "ecomPayments",
      };
    }
  }

  private static getCurrentProvider(): "stripe" | "ecomPayments" {
    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem("payment_provider") as
        | "stripe"
        | "ecomPayments";
      if (
        savedProvider &&
        (savedProvider === "stripe" || savedProvider === "ecomPayments")
      ) {
        return savedProvider;
      }
    }
    return "ecomPayments";
  }

  static validateProviderConfiguration(
    provider: "stripe" | "ecomPayments"
  ): boolean {
    if (provider === "stripe") {
      return !!PAYMENT_CONFIG.stripeConfig.publishableKey;
    } else if (provider === "ecomPayments") {
      return !!PAYMENT_CONFIG.ecomPaymentsConfig.securityKey;
    }
    return false;
  }

  static async upgradePlan(options: UpgradeOptions): Promise<PaymentResult> {
    try {
      const provider = options.provider || this.getCurrentProvider();
      const planConfig = getPlanConfigByProvider(options.newPlan, provider);

      if (!planConfig) {
        throw new Error(
          `Plan "${options.newPlan}" is not configured for ${provider}`
        );
      }

      if (provider === "ecomPayments") {
        return this.upgradePlanEcomPayments(options);
      } else {
        return this.upgradePlanStripe(options);
      }
    } catch (error) {
      console.error("Error upgrading plan:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upgrade plan",
        provider: options.provider || this.getCurrentProvider(),
      };
    }
  }

  static async upgradePlanEcomPayments(
    options: UpgradeOptions
  ): Promise<PaymentResult> {
    try {
      const result = await callEdgeFunction<any>({
        functionName: "upgrade-plan",
        payload: {
          businessId: options.businessId,
          currentPlan: options.currentPlan,
          newPlan: options.newPlan,
          planPrice: options.planPrice,
          customerEmail: options.customerEmail,
          discountCode: options.discountCode,
          discountedAmount: options.discountedAmount,
          metadata: options.metadata,
        },
      });

      // Check if it's a downgrade
      if (result?.is_downgrade) {
        return {
          success: true,
          provider: "ecomPayments",
          is_downgrade: true,
        };
      }

      return {
        success: true,
        transactionId: result?.transaction_id,
        messageId: result?.messageId,
        provider: "ecomPayments",
      };
    } catch (error) {
      console.error("Error upgrading plan with EcomPayments:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upgrade plan with EcomPayments",
        provider: "ecomPayments",
      };
    }
  }

  static async upgradePlanStripe(
    options: UpgradeOptions
  ): Promise<PaymentResult> {
    try {
      const result = await callEdgeFunction<any>({
        functionName: "create-checkout-session",
        payload: {
          planPrice: options.planPrice,
          planName: options.newPlan,
          successUrl: `${
            PAYMENT_CONFIG.stripeConfig.successUrl
          }${encodeURIComponent(options.newPlan)}`,
          cancelUrl: PAYMENT_CONFIG.stripeConfig.cancelUrl,
          discountCode: options.discountCode,
          discountedAmount: options.discountedAmount,
          metadata: {
            ...options.metadata,
            upgrade_from: options.currentPlan,
            upgrade_to: options.newPlan,
            business_id: options.businessId,
          },
        },
      });

      return {
        success: true,
        url: result?.url,
        provider: "stripe",
      };
    } catch (error) {
      console.error("Error upgrading plan with Stripe:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upgrade plan with Stripe",
        provider: "stripe",
      };
    }
  }
}
