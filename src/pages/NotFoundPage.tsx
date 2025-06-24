import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Home, Search, ArrowLeft, AlertCircle } from 'lucide-react';
import { logError } from '../lib/errorLogger';

const NotFoundPage = () => {
  const location = useLocation();
  
  // Log the 404 error for monitoring
  React.useEffect(() => {
    logError(`404 Page Not Found: ${location.pathname}`, {
      context: 'NotFoundPage',
      level: 'warning',
      metadata: {
        path: location.pathname,
        search: location.search,
        referrer: document.referrer
      }
    });
  }, [location]);

  return (
    <Layout
      title="Page Not Found | BlackOWNDemand"
      description="The page you're looking for doesn't exist or has been moved."
      noindex={true}
    >
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-9xl font-bold text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-6">Page Not Found</h2>
          <p className="text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <Home className="h-5 w-5" />
              Return to Home
            </Link>
            
            <Link
              to="/browse"
              className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
              Browse Businesses
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 w-full bg-transparent border border-gray-700 hover:border-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </button>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            If you believe this is an error, please <Link to="/contact" className="text-gray-400 hover:text-white">contact us</Link>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;