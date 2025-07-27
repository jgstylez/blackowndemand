export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  stripePriceId?: string; // Stripe Price ID for the product
  ecomPaymentsPlanId?: string; // Ecom Payments Plan ID
  features: string[];
  description: string;
  isPopular?: boolean;
  isRecommended?: boolean;
}

export interface PaymentConfig {
  plans: Record<string, PlanConfig>;
  defaultCurrency: string;
  billingInterval: "month" | "year";
  stripeConfig: {
    publishableKey: string;
    successUrl: string;
    cancelUrl: string;
  };
  ecomPaymentsConfig: {
    apiUrl: string;
    securityKey: string;
  };
}

export const PAYMENT_CONFIG: PaymentConfig = {
  plans: {
    starter: {
      id: "starter",
      name: "Starter Plan",
      price: 12,
      stripePriceId: "price_starter_plan", // Replace with actual Stripe Price ID
      ecomPaymentsPlanId: "starter_plan_annual", // Ecom Payments plan ID
      features: [
        "Basic business listing",
        "Contact information display",
        "Business hours",
        "Category listing",
      ],
      description: "Perfect for getting started with your visibility",
    },
    enhanced: {
      id: "enhanced",
      name: "Enhanced Plan",
      price: 60,
      stripePriceId: "price_enhanced_plan", // Replace with actual Stripe Price ID
      ecomPaymentsPlanId: "enhanced_plan_annual", // Ecom Payments plan ID
      features: [
        "Everything in Starter Plan",
        "Business verification badge",
        "Priority placement in search",
        "Social media links",
        "Business image gallery",
        "Promo video support",
      ],
      description: "Enhanced visibility and features for growing businesses",
      isRecommended: true,
    },
    vip: {
      id: "vip",
      name: "VIP Plan",
      price: 99,
      stripePriceId: "price_vip_plan", // Replace with actual Stripe Price ID
      ecomPaymentsPlanId: "vip_plan_annual", // Ecom Payments plan ID
      features: [
        "Everything in Enhanced Plan",
        "Exclusive VIP member badge",
        "Priority placement in search results",
        "Access to exclusive features and tools",
        "Special recognition in the directory",
        "Premium customer support",
      ],
      description: "Premium features for established businesses",
      isPopular: true,
    },
  },
  defaultCurrency: "USD",
  billingInterval: "year",
  stripeConfig: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
    successUrl: `${window.location.origin}/pricing?success=true&plan=`,
    cancelUrl: `${window.location.origin}/pricing?canceled=true`,
  },
  ecomPaymentsConfig: {
    apiUrl:
      "https://ecompaymentprocessing.transactiongateway.com/api/transact.php",
    securityKey: import.meta.env.VITE_ECOM_SECURITY_KEY || "",
  },
};

// Helper functions
export const getPlanConfig = (planId: string): PlanConfig | null => {
  return PAYMENT_CONFIG.plans[planId] || null;
};

export const getPlanConfigByName = (planName: string): PlanConfig | null => {
  return (
    Object.values(PAYMENT_CONFIG.plans).find(
      (plan) => plan.name === planName
    ) || null
  );
};

export const getAllPlans = (): PlanConfig[] => {
  return Object.values(PAYMENT_CONFIG.plans);
};

// New helper function to get plan config by provider
export const getPlanConfigByProvider = (
  planName: string,
  provider: "stripe" | "ecomPayments"
): PlanConfig | null => {
  const plan = getPlanConfigByName(planName);
  if (!plan) return null;

  // Validate that the plan has the required provider ID
  if (provider === "stripe" && !plan.stripePriceId) {
    console.warn(
      `Plan "${planName}" does not have a Stripe Price ID configured`
    );
    return null;
  }

  if (provider === "ecomPayments" && !plan.ecomPaymentsPlanId) {
    console.warn(
      `Plan "${planName}" does not have an Ecom Payments Plan ID configured`
    );
    return null;
  }

  return plan;
};
