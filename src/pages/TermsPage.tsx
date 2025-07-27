import React from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400 mb-6">
            Last updated: March 6, 2025
          </p>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-400">
                Welcome to BlackOWNDemand. By accessing our website, you agree to these terms and conditions. Please read them carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Placeholder Content</h2>
              <p className="text-gray-400">
                This is a placeholder for our Terms of Service. The complete terms will be provided through Termly.io integration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Contact Us</h2>
              <p className="text-gray-400">
                If you have any questions about these Terms, please{' '}
                <Link to="/contact" className="text-white hover:text-gray-300">
                  contact us
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;