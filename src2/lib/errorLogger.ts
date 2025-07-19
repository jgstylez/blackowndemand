/**
 * Centralized error logging utility
 * 
 * This module provides a consistent way to log errors throughout the application.
 * In a production environment, this could be extended to send errors to an external
 * monitoring service like Sentry, LogRocket, or a custom backend.
 */

interface ErrorLogOptions {
  context?: string;
  user?: string | null;
  metadata?: Record<string, any>;
  level?: 'error' | 'warning' | 'info';
}

// Initialize Sentry if we're in production
// This is a simple example using Sentry, but you could use any error monitoring service
const initializeErrorMonitoring = () => {
  if (import.meta.env.PROD) {
    try {
      // In a real implementation, you would initialize your error monitoring service here
      // For example, with Sentry:
      // 
      // import * as Sentry from '@sentry/browser';
      // Sentry.init({
      //   dsn: import.meta.env.VITE_SENTRY_DSN,
      //   environment: import.meta.env.MODE,
      //   tracesSampleRate: 1.0,
      // });
      
      console.info('Error monitoring initialized in production mode');
    } catch (err) {
      console.error('Failed to initialize error monitoring:', err);
    }
  }
};

// Call this function when the app starts (e.g., in main.tsx)
initializeErrorMonitoring();

/**
 * Log an error with additional context
 * 
 * @param error - The error object or message to log
 * @param options - Additional options for logging
 */
export const logError = (
  error: Error | string,
  options: ErrorLogOptions = {}
): void => {
  const { 
    context = 'app', 
    user = null, 
    metadata = {}, 
    level = 'error' 
  } = options;

  // Extract error message if it's an Error object
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Create a structured log object
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message: errorMessage,
    stack: errorStack,
    user,
    ...metadata
  };

  // In development, log to console with formatting
  if (import.meta.env.DEV) {
    if (level === 'error') {
      console.error(
        `%c[${context.toUpperCase()}]%c ${errorMessage}`,
        'color: red; font-weight: bold',
        'color: inherit',
        logData
      );
    } else if (level === 'warning') {
      console.warn(
        `%c[${context.toUpperCase()}]%c ${errorMessage}`,
        'color: orange; font-weight: bold',
        'color: inherit',
        logData
      );
    } else {
      console.info(
        `%c[${context.toUpperCase()}]%c ${errorMessage}`,
        'color: blue; font-weight: bold',
        'color: inherit',
        logData
      );
    }
  } else {
    // In production, send to error monitoring service
    try {
      // In a real implementation, you would send the error to your monitoring service
      // For example, with Sentry:
      // 
      // if (error instanceof Error) {
      //   Sentry.captureException(error, {
      //     tags: { context },
      //     user: user ? { id: user } : undefined,
      //     extra: metadata
      //   });
      // } else {
      //   Sentry.captureMessage(errorMessage, {
      //     level: level === 'error' ? Sentry.Severity.Error : 
      //            level === 'warning' ? Sentry.Severity.Warning : 
      //            Sentry.Severity.Info,
      //     tags: { context },
      //     user: user ? { id: user } : undefined,
      //     extra: metadata
      //   });
      // }
      
      // For now, just log to console in a more compact format
      console[level](JSON.stringify(logData));
    } catch (err) {
      // If sending to the monitoring service fails, log to console as fallback
      console.error('Failed to send error to monitoring service:', err);
      console.error('Original error:', logData);
    }
  }
};

/**
 * Log a warning with additional context
 */
export const logWarning = (
  message: string,
  options: Omit<ErrorLogOptions, 'level'> = {}
): void => {
  logError(message, { ...options, level: 'warning' });
};

/**
 * Log information with additional context
 */
export const logInfo = (
  message: string,
  options: Omit<ErrorLogOptions, 'level'> = {}
): void => {
  logError(message, { ...options, level: 'info' });
};

export default {
  logError,
  logWarning,
  logInfo
};