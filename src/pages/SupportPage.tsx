import React from 'react';
import Layout from '../components/layout/Layout';
import { ArrowRight, Heart } from 'lucide-react';

const SupportPage = () => {
  const handleDonateClick = () => {
    window.location.href = 'https://sowempowered.com';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Support PROJECT UNITY</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join us in making a difference. Your support helps create lasting economic change in our communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-gray-900 rounded-xl p-8">
            <Heart className="h-12 w-12 text-white mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">One-Time Donation</h2>
            <p className="text-gray-400 mb-6">
              Make a one-time contribution to support our mission of empowering Black-owned businesses and creating economic opportunities.
            </p>
            <button 
              onClick={handleDonateClick}
              className="w-full bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg transition-colors"
            >
              Donate Now
            </button>
          </div>

          <div className="bg-gray-900 rounded-xl p-8">
            <Heart className="h-12 w-12 text-white mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Monthly Support</h2>
            <p className="text-gray-400 mb-6">
              Become a monthly supporter and help us sustain our efforts to build stronger Black communities through economic empowerment.
            </p>
            <button 
              onClick={handleDonateClick}
              className="w-full bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg transition-colors"
            >
              Become a Supporter
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">Your Impact</h2>
          <p className="text-gray-400 mb-6">
            Your support helps us:
          </p>
          <ul className="space-y-4 text-gray-400">
            <li className="flex items-center">
              <ArrowRight className="h-5 w-5 text-white mr-3" />
              Provide resources and support to Black entrepreneurs
            </li>
            <li className="flex items-center">
              <ArrowRight className="h-5 w-5 text-white mr-3" />
              Create economic opportunities within Black communities
            </li>
            <li className="flex items-center">
              <ArrowRight className="h-5 w-5 text-white mr-3" />
              Develop technology solutions for Black-owned businesses
            </li>
            <li className="flex items-center">
              <ArrowRight className="h-5 w-5 text-white mr-3" />
              Expand our network of Black-owned businesses
            </li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">
            All donations are made to Black Dollar Movement, Inc., a registered 501(c)(3) nonprofit organization.
            Your donation is fully tax-deductible.
          </p>
          <a 
            href="https://sowempowered.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300"
          >
            Learn more about our mission
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default SupportPage;