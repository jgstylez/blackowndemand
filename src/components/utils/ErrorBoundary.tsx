import { Component, ReactNode } from "react";
import ErrorFallback from "../common/ErrorFallback";
import {
  UnifiedErrorHandler,
  UnifiedError,
} from "../../utils/unifiedErrorHandler";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: UnifiedError;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
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

export default ErrorBoundary;
