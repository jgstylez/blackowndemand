// DEPRECATED: Use useUnifiedPayment from './useUnifiedPayment' instead
import {
  useUnifiedPayment,
  UseUnifiedPaymentOptions,
} from "./useUnifiedPayment";

export const usePaymentProcessing = (options: any) => {
  console.warn(
    "usePaymentProcessing is deprecated. Use useUnifiedPayment instead."
  );

  // Convert legacy options to new format
  const unifiedOptions: UseUnifiedPaymentOptions = {
    onSuccess: options.onSuccess,
    onError: (error) => options.onError?.(error.message),
    sendConfirmationEmail: true,
  };

  return useUnifiedPayment(unifiedOptions);
};

export default usePaymentProcessing;
