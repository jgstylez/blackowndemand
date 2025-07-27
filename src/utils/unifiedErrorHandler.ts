import { logError } from "../lib/errorLogger";
import { useState, useCallback, Component, ReactNode } from "react";
import ErrorFallback from "../components/common/ErrorFallback";

export interface UnifiedError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  context?: string;
  details?: any;
  retryable: boolean;
  provider?: string;
  timestamp: string;
}

export interface ErrorHandlerOptions {
  context?: string;
  defaultMessage?: string;
  provider?: string;
  retryable?: boolean;
}

export class UnifiedErrorHandler {
  /**
   * Normalize any error into a unified format
   */
  static normalizeError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): UnifiedError {
    const timestamp = new Date().toISOString();

    // Handle different error types
    if (error instanceof Error) {
      return this.normalizeStandardError(error, options);
    } else if (typeof error === "string") {
      return this.normalizeStringError(error, options);
    } else if (error && typeof error === "object") {
      return this.normalizeObjectError(error, options);
    } else {
      return this.normalizeUnknownError(error, options);
    }
  }

  /**
   * Normalize standard Error objects
   */
  private static normalizeStandardError(
    error: Error,
    options: ErrorHandlerOptions
  ): UnifiedError {
    const code = this.extractErrorCode(error);
    const retryable = this.isRetryableError(error, options);

    return {
      code,
      message: error.message,
      userFriendlyMessage: this.getUserFriendlyMessage(error, options),
      context: options.context,
      details: error,
      retryable,
      provider: options.provider,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize string errors
   */
  private static normalizeStringError(
    error: string,
    options: ErrorHandlerOptions
  ): UnifiedError {
    return {
      code: "string_error",
      message: error,
      userFriendlyMessage: options.defaultMessage || error,
      context: options.context,
      details: error,
      retryable: false,
      provider: options.provider,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize object errors (like API responses)
   */
  private static normalizeObjectError(
    error: any,
    options: ErrorHandlerOptions
  ): UnifiedError {
    const code = error.code || error.error_code || "object_error";
    const message = error.message || error.error_message || "An error occurred";
    const retryable = this.isRetryableError(error, options);

    return {
      code,
      message,
      userFriendlyMessage: this.getUserFriendlyMessage(error, options),
      context: options.context,
      details: error,
      retryable,
      provider: options.provider,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize unknown errors
   */
  private static normalizeUnknownError(
    error: any,
    options: ErrorHandlerOptions
  ): UnifiedError {
    return {
      code: "unknown_error",
      message: String(error),
      userFriendlyMessage:
        options.defaultMessage || "An unexpected error occurred",
      context: options.context,
      details: error,
      retryable: false,
      provider: options.provider,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract error code from various error formats
   */
  private static extractErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.type) return error.type;
    if (error.name) return error.name;
    if (error.status) return `http_${error.status}`;
    return "unknown_error";
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(
    error: any,
    options: ErrorHandlerOptions
  ): boolean {
    if (options.retryable !== undefined) return options.retryable;

    const retryableCodes = [
      "network_error",
      "timeout_error",
      "server_error",
      "processing_error",
      "rate_limit",
      "ECONNRESET",
      "ENOTFOUND",
      "ETIMEDOUT",
    ];

    const code = this.extractErrorCode(error);
    return retryableCodes.includes(code);
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(
    error: any,
    options: ErrorHandlerOptions
  ): string {
    // Use default message if provided
    if (options.defaultMessage) return options.defaultMessage;

    // Check for provider-specific error messages
    if (options.provider === "stripe") {
      return this.getStripeUserMessage(error);
    } else if (options.provider === "ecomPayments") {
      return this.getEcomPaymentsUserMessage(error);
    }

    // Use error message if available
    if (error.message) return error.message;

    // Fallback messages
    const fallbackMessages: Record<string, string> = {
      network_error:
        "Network connection error. Please check your internet connection and try again.",
      timeout_error: "Request timed out. Please try again.",
      server_error: "Server error. Please try again later.",
      validation_error:
        "Invalid information. Please check your details and try again.",
      authentication_error:
        "Authentication error. Please log in again and try again.",
      permission_error: "Permission denied. Please contact support.",
      unknown_error:
        "An unexpected error occurred. Please try again or contact support.",
    };

    const code = this.extractErrorCode(error);
    return fallbackMessages[code] || fallbackMessages.unknown_error;
  }

  /**
   * Get Stripe-specific user messages
   */
  private static getStripeUserMessage(error: any): string {
    const stripeErrorMap: Record<string, string> = {
      card_declined:
        "Your card was declined. Please try a different payment method.",
      expired_card:
        "Your card has expired. Please update your payment information.",
      incorrect_cvc:
        "The security code (CVC) is incorrect. Please check and try again.",
      insufficient_funds:
        "Your card has insufficient funds. Please try a different payment method.",
      invalid_expiry_month:
        "The expiration month is invalid. Please check your card details.",
      invalid_expiry_year:
        "The expiration year is invalid. Please check your card details.",
      invalid_number: "The card number is invalid. Please check and try again.",
      processing_error:
        "An error occurred while processing your payment. Please try again.",
      rate_limit: "Too many requests. Please wait a moment and try again.",
    };

    const code = this.extractErrorCode(error);
    return (
      stripeErrorMap[code] ||
      error.message ||
      "Payment processing failed. Please try again."
    );
  }

  /**
   * Get Ecom Payments-specific user messages
   */
  private static getEcomPaymentsUserMessage(error: any): string {
    const ecomErrorMap: Record<string, string> = {
      "200":
        "Transaction was declined by processor. Please try a different payment method.",
      "201": "Card declined. Please try a different payment method.",
      "202": "Insufficient funds. Please try a different payment method.",
      "203": "Card limit exceeded. Please try a different payment method.",
      "204": "Transaction not allowed. Please contact support.",
      "220": "Incorrect payment information. Please check your card details.",
      "221": "Card issuer not found. Please try a different card.",
      "222": "Card not on file with issuer. Please try a different card.",
      "223": "Card has expired. Please update your payment information.",
      "224": "Invalid expiration date. Please check your card details.",
      "225": "Invalid security code. Please check and try again.",
      "300": "Transaction rejected by gateway. Please try again.",
      "400": "Payment processing error. Please try again.",
      "410": "Invalid merchant configuration. Please contact support.",
      "411": "Merchant account inactive. Please contact support.",
      "420": "Communication error. Please try again.",
      "421": "Communication error with card issuer. Please try again.",
      "430": "Duplicate transaction. Please try again.",
      "440": "Processor format error. Please contact support.",
      "441": "Invalid transaction information. Please try again.",
      "460": "Processor feature not available. Please contact support.",
      "461": "Unsupported card type. Please try a different card.",
    };

    const code = this.extractErrorCode(error);
    return (
      ecomErrorMap[code] ||
      error.message ||
      "Payment processing failed. Please try again."
    );
  }

  /**
   * Log error using the existing error logger
   */
  static logError(error: UnifiedError, additionalContext?: any): void {
    logError(error.message, {
      context: error.context,
      metadata: {
        code: error.code,
        userFriendlyMessage: error.userFriendlyMessage,
        retryable: error.retryable,
        provider: error.provider,
        timestamp: error.timestamp,
        details: error.details,
        ...additionalContext,
      },
    });
  }

  /**
   * Get retry delay in milliseconds
   */
  static getRetryDelay(error: UnifiedError, attempt: number): number {
    if (!error.retryable) return 0;

    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    return delay;
  }
}

/**
 * React hook for unified error handling
 */
export const useUnifiedErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const [error, setError] = useState<UnifiedError | null>(null);

  const handleError = useCallback(
    (err: any, customOptions?: Partial<ErrorHandlerOptions>) => {
      const mergedOptions = { ...options, ...customOptions };
      const normalizedError = UnifiedErrorHandler.normalizeError(
        err,
        mergedOptions
      );

      setError(normalizedError);
      UnifiedErrorHandler.logError(normalizedError);
    },
    [options]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};

/**
 * Enhanced Error Boundary component
 */
export class UnifiedErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: UnifiedError }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    const normalizedError = UnifiedErrorHandler.normalizeError(error, {
      context: "ErrorBoundary",
    });

    UnifiedErrorHandler.logError(normalizedError);

    return {
      hasError: true,
      error: normalizedError,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const normalizedError = UnifiedErrorHandler.normalizeError(error, {
      context: "ErrorBoundary",
    });

    UnifiedErrorHandler.logError(normalizedError, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={() =>
            this.setState({ hasError: false, error: undefined })
          }
        />
      );
    }

    return this.props.children;
  }
}
