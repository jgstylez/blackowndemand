
import React from 'react';
import { Star, Crown, Users, TrendingUp, Shield, Zap } from 'lucide-react';

interface BusinessPremiumStepProps {
  formData?: any;
  setFormData?: (data: any) => void;
  updateFormData?: (updates: any) => void;
  onNext?: () => void;
  onBack?: () => void;
  nextStep?: () => void;
  startPayment?: (planName: string, price: number) => void;
}

const BusinessPremiumStep: React.FC<BusinessPremiumStepProps> = ({
  onNext,
  onBack,
  nextStep,
  startPayment
}) => {
  
  const handleNext = () => {
    if (onNext) onNext();
    if (nextStep) nextStep();
  };

  const handleStartPayment = (planName: string, price: number) => {
    if (startPayment) {
      startPayment(planName, price);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          Choose a Premium Plan
        </h2>
        <p className="text-gray-400">
          Enhance your business listing with premium features.
        </p>
      </div>

      {/* Premium Plan Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Featured Listing */}
        <div 
          className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => handleStartPayment("Featured", 99)}
        >
          <div className="flex items-center space-x-3 mb-3">
            <Star className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">
              Featured Listing
            </h3>
          </div>
          <p className="text-gray-400 text-sm">
            Highlight your business at the top of search results.
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 text-sm">
            <li>Increased visibility</li>
            <li>Attract more customers</li>
            <li>Stand out from the competition</li>
          </ul>
        </div>

        {/* Verified Badge */}
        <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Verified Badge
            </h3>
          </div>
          <p className="text-gray-400 text-sm">
            Build trust with a verified badge on your listing.
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 text-sm">
            <li>Show customers you're legitimate</li>
            <li>Increase credibility</li>
            <li>Boost confidence in your business</li>
          </ul>
        </div>

        {/* Priority Support */}
        <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <Zap className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              Priority Support
            </h3>
          </div>
          <p className="text-gray-400 text-sm">
            Get faster support and assistance when you need it.
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 text-sm">
            <li>Dedicated support team</li>
            <li>Faster response times</li>
            <li>Personalized assistance</li>
          </ul>
        </div>

        {/* VIP Membership */}
        <div 
          className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => handleStartPayment("VIP Plan", 299)}
        >
          <div className="flex items-center space-x-3 mb-3">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">
              VIP Membership
            </h3>
          </div>
          <p className="text-gray-400 text-sm">
            Unlock exclusive benefits and features with VIP membership.
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 text-sm">
            <li>All premium features included</li>
            <li>Exclusive events and promotions</li>
            <li>Dedicated account manager</li>
          </ul>
        </div>

        {/* Enhanced Analytics */}
        <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">
              Enhanced Analytics
            </h3>
          </div>
          <p className="text-gray-400 text-sm">
            Track your listing's performance with detailed analytics.
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 text-sm">
            <li>Detailed traffic data</li>
            <li>Customer engagement metrics</li>
            <li>Insights to improve your listing</li>
          </ul>
        </div>

        {/* Unlimited Media Uploads */}
        <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="h-5 w-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-white">
              Unlimited Media
            </h3>
          </div>
          <p className="text-gray-400 text-sm">
            Upload unlimited photos and videos to showcase your business.
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 text-sm">
            <li>Showcase your business</li>
            <li>Attract more customers</li>
            <li>Better represent your business</li>
          </ul>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Skip / Continue
        </button>
      </div>
    </div>
  );
};

export default BusinessPremiumStep;
