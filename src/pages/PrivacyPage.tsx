import React from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400 mb-6">
            Last updated: March 6, 2025
          </p>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-400">
                Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Placeholder Content</h2>
              <p className="text-gray-400">
                This is a placeholder for our Privacy Policy. The complete policy will be provided through Termly.io integration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Contact Us</h2>
              <p className="text-gray-400">
                If you have any questions about this Privacy Policy, please{' '}
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

export default PrivacyPage;