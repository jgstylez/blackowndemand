
import { useState, useCallback } from 'react';

interface ErrorHandlerOptions {
  context?: string;
  defaultMessage?: string;
}

interface ErrorDetails {
  hasError: boolean;
  message: string | null;
  details: any;
}

const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const [error, setError] = useState<ErrorDetails>({
    hasError: false,
    message: null,
    details: null
  });

  const handleError = useCallback((err: any, customMessage?: string) => {
    const message = customMessage || options.defaultMessage || 'An error occurred';
    
    console.error(`Error in ${options.context || 'component'}:`, err);
    
    setError({
      hasError: true,
      message,
      details: err
    });
  }, [options.context, options.defaultMessage]);

  const clearError = useCallback(() => {
    setError({
      hasError: false,
      message: null,
      details: null
    });
  }, []);

  return {
    error,
    handleError,
    clearError
  };
};

export default useErrorHandler;
