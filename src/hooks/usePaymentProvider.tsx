import { useState, useEffect } from "react";

export type PaymentProvider = "ecomPayments" | "stripe";

export const usePaymentProvider = () => {
  // Set 'ecomPayments' as default
  const [provider, setProvider] = useState<PaymentProvider>("ecomPayments");

  useEffect(() => {
    // Check if user has set a preference
    const savedProvider = localStorage.getItem(
      "payment_provider"
    ) as PaymentProvider;
    if (
      savedProvider &&
      (savedProvider === "ecomPayments" || savedProvider === "stripe")
    ) {
      setProvider(savedProvider);
    }
  }, []);

  const switchProvider = (newProvider: PaymentProvider) => {
    setProvider(newProvider);
    localStorage.setItem("payment_provider", newProvider);
  };

  // Map 'ecomPayments' to 'Ecom Payments' for UI
  const providerLabel =
    provider === "ecomPayments" ? "Ecom Payments" : "Stripe";

  return {
    provider,
    providerLabel,
    switchProvider,
    isEcomPayments: provider === "ecomPayments",
    isStripe: provider === "stripe",
  };
};
