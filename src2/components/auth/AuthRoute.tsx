import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ErrorFallback from '../common/ErrorFallback';
import { logError } from '../../lib/errorLogger';

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  console.log('🔒 AuthRoute: Current path:', location.pathname);
  console.log('👤 AuthRoute: User state:', user ? 'Logged in' : 'Not logged in');
  console.log('⏳ AuthRoute: Loading state:', loading);
  console.log('❓ AuthRoute: Error state:', error ? 'Error present' : 'No error');

  // Log any authentication errors
  if (error) {
    console.error('❌ AuthRoute: Authentication error:', error);
    logError('Authentication error in protected route', {
      context: 'AuthRoute',
      metadata: { path: location.pathname, error }
    });
  }

  if (loading) {
    console.log('⏳ AuthRoute: Still loading, showing spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    console.log('❌ AuthRoute: Showing error fallback...');
    return (
      <ErrorFallback
        error={error}
        message="Authentication error. Please try logging in again."
        showHome={true}
      />
    );
  }

  if (!user) {
    console.log('🔄 AuthRoute: No user found, redirecting to login...');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ AuthRoute: User authenticated, rendering protected content');
  return <>{children}</>;
};

export default AuthRoute;