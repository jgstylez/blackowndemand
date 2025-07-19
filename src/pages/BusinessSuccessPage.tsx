import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { CheckCircle } from 'lucide-react';

const BusinessSuccessPage = () => {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-white mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Business Listed Successfully!
          </h1>
          <p className="text-gray-400 mb-8">
            Your business has been added to our directory. Our team will review your listing and verify your business within 24-48 hours.
          </p>
          <div className="space-y-4">
            <Link
              to="/business/dashboard"
              className="block w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/browse"
              className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BusinessSuccessPage;