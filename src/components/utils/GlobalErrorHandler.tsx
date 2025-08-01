import React, { useEffect } from "react";
import { logError } from "../../lib/errorLogger";

/**
 * GlobalErrorHandler component that sets up global error handling
 * for uncaught exceptions and promise rejections.
 */
const GlobalErrorHandler: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    // Handler for uncaught exceptions
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();

      logError(event.error || event.message, {
        context: "GlobalErrorHandler",
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: "uncaught-exception",
        },
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
        context: "GlobalErrorHandler",
        metadata: {
          type: "unhandled-promise-rejection",
          reason: event.reason?.toString?.() || "Unknown reason",
        },
      });

      // In production, you might want to show a generic error message to the user
      if (import.meta.env.PROD) {
        // Example: showErrorToast('Something went wrong. Please try again later.');
      }
    };

    // Handler for network errors
    const handleOnline = () => {
      console.info("Application is online");
    };

    const handleOffline = () => {
      console.warn("Application is offline");
      // You could show a notification to the user here
    };

    // Enhanced extension error suppression
    const handleExtensionError = (event: ErrorEvent) => {
      // Suppress LastPass and other extension errors
      if (
        event.message.includes("chrome-extension") ||
        event.message.includes("LastPass") ||
        event.message.includes("message channel closed") ||
        event.message.includes("asynchronous response") ||
        event.filename?.includes("chrome-extension") ||
        event.filename?.includes("moz-extension")
      ) {
        event.preventDefault();
        return false;
      }
    };

    // Enhanced promise rejection handling for extension errors
    const handleExtensionRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || "";
      if (
        reason.includes("message channel closed") ||
        reason.includes("asynchronous response") ||
        reason.includes("LastPass") ||
        reason.includes("chrome-extension")
      ) {
        event.preventDefault();
        return false;
      }
    };

    // Suppress runtime.lastError from extensions
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("runtime.lastError") ||
        message.includes("Cannot create item with duplicate id") ||
        message.includes("LastPass") ||
        message.includes("chrome-extension")
      ) {
        // Suppress these errors silently
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Add event listeners
    window.addEventListener("error", handleError);
    window.addEventListener("error", handleExtensionError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("unhandledrejection", handleExtensionRejection);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("error", handleExtensionError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener(
        "unhandledrejection",
        handleExtensionRejection
      );
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
};

export default GlobalErrorHandler;
