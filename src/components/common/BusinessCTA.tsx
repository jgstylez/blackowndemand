import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';


interface BusinessCTAProps {
  className?: string;
}

const BusinessCTA: React.FC<BusinessCTAProps> = ({ className = '' }) => {
  
  return (
    <section className={`py-16 bg-gradient-to-r from-purple-900 to-blue-900 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to grow your business?
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Join thousands of Black-owned businesses in our directory
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors text-lg font-semibold"
        >
          List Your Business Today
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </section>
  );
};

export default BusinessCTA;