// This file is now deprecated - use UnifiedErrorHandler from utils/unifiedErrorHandler.ts instead
import { UnifiedErrorHandler } from "./unifiedErrorHandler";

// Re-export for backward compatibility
export class PaymentErrorHandler {
  static normalizeError(error: any, provider: "stripe" | "ecomPayments") {
    return UnifiedErrorHandler.normalizeError(error, { provider });
  }

  static getUserFriendlyMessage(error: any) {
    const normalized = UnifiedErrorHandler.normalizeError(error);
    return normalized.userFriendlyMessage;
  }

  static isRetryableError(error: any) {
    const normalized = UnifiedErrorHandler.normalizeError(error);
    return normalized.retryable;
  }

  static getRetryDelay(error: any, attempt: number) {
    const normalized = UnifiedErrorHandler.normalizeError(error);
    return UnifiedErrorHandler.getRetryDelay(normalized, attempt);
  }

  static logError(error: any, context?: any) {
    const normalized = UnifiedErrorHandler.normalizeError(error);
    UnifiedErrorHandler.logError(normalized, context);
  }
}
