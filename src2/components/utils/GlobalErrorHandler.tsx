import React, { useEffect } from 'react';
import { logError } from '../../lib/errorLogger';

/**
 * GlobalErrorHandler component that sets up global error handling
 * for uncaught exceptions and promise rejections.
 */
const GlobalErrorHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Handler for uncaught exceptions
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      
      logError(event.error || event.message, {
        context: 'GlobalErrorHandler',
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'uncaught-exception'
        }
      });
      
      // In production, you might want to show a generic error message to the user
      // or redirect to an error page
      if (import.meta.env.PROD) {
        // Example: showErrorToast('Something went wrong. Please try again later.');
      }
    };

    // Handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      
      logError(event.reason, {
        context: 'GlobalErrorHandler',
        metadata: {
          type: 'unhandled-promise-rejection',
          reason: event.reason?.toString?.() || 'Unknown reason'
        }
      });
      
      // In production, you might want to show a generic error message to the user
      if (import.meta.env.PROD) {
        // Example: showErrorToast('Something went wrong. Please try again later.');
      }
    };

    // Handler for network errors
    const handleOnline = () => {
      console.info('Application is online');
    };

    const handleOffline = () => {
      console.warn('Application is offline');
      // You could show a notification to the user here
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
};

export default GlobalErrorHandler;