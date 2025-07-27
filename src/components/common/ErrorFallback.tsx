import React from "react";
import { UnifiedError } from "../../utils/unifiedErrorHandler";

interface ErrorFallbackProps {
  error?: UnifiedError | Error | null;
  resetErrorBoundary?: () => void;
  showRefresh?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  showRefresh = true,
}) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : error?.userFriendlyMessage || error?.message || "Something went wrong";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-400 mb-6">{errorMessage}</p>
        {showRefresh && resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
