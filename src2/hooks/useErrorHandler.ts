import { useState, useCallback } from 'react';
import { logError } from '../lib/errorLogger';
import { useAuth } from '../contexts/AuthContext';

interface ErrorState {
  hasError: boolean;
  message: string | null;
  details: any;
}

interface UseErrorHandlerOptions {
  context?: string;
  defaultMessage?: string;
}

/**
 * Custom hook for handling errors in components
 * 
 * @param options - Configuration options
 * @returns Error state and handler functions
 */
export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { context = 'component', defaultMessage = 'An unexpected error occurred' } = options;
  const { user } = useAuth();
  
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: null,
    details: null
  });

  /**
   * Handle an error by logging it and updating component state
   */
  const handleError = useCallback((error: any, customMessage?: string) => {
    // Extract error message
    let errorMessage = customMessage || defaultMessage;
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Log the error
    logError(error, {
      context,
      user: user?.id,
      metadata: {
        component: context,
        timestamp: new Date().toISOString()
      }
    });
    
    // Update component state
    setErrorState({
      hasError: true,
      message: errorMessage,
      details: error
    });
    
    return errorMessage;
  }, [context, defaultMessage, user]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: null,
      details: null
    });
  }, []);

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    customMessage?: string
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        clearError();
        return await fn(...args);
      } catch (error) {
        handleError(error, customMessage);
        return undefined;
      }
    };
  }, [handleError, clearError]);

  return {
    error: errorState,
    handleError,
    clearError,
    withErrorHandling
  };
};

export default useErrorHandler;