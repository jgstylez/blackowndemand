import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  message?: string;
  showHome?: boolean;
  showRefresh?: boolean;
}

/**
 * A reusable error fallback component that can be used both within ErrorBoundary
 * and for displaying errors from API calls or other runtime errors.
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  message = "We're sorry, but something went wrong.",
  showHome = true,
  showRefresh = true
}) => {
  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Error Encountered</h2>
        <p className="text-gray-400 mb-6">
          {message}
        </p>
        <div className="space-y-3">
          {showRefresh && resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>
          )}
          {showHome && (
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="h-5 w-5" />
              Return to Home
            </Link>
          )}
        </div>
        {import.meta.env.DEV && error && (
          <div className="mt-6 p-4 bg-red-500/10 rounded-lg text-left">
            <p className="text-red-400 font-medium mb-2">Error Details (Development Only):</p>
            <p className="text-red-400 text-sm overflow-auto max-h-40">
              {error.message || error.toString()}
            </p>
            {error.stack && (
              <details className="text-gray-400 text-xs mt-2">
                <summary className="cursor-pointer text-gray-300 mb-1">Stack Trace</summary>
                <pre className="whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-gray-800 rounded">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;