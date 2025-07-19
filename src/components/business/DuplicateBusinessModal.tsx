import React from 'react';
import { X, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBusinessImageUrl } from '../../lib/supabase';
import { maskEmail } from '../../utils/emailUtils';

interface Business {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  email?: string;
  migration_source?: string;
  claimed_at?: string | null;
}

interface DuplicateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  businesses: Business[];
}

const DuplicateBusinessModal: React.FC<DuplicateBusinessModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  businesses
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Similar Businesses Found</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-300 mb-6">
            We found {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} with a similar name. 
            Please check if your business already exists before creating a new listing.
          </p>
          
          <div className="space-y-4 mb-6">
            {businesses.map(business => (
              <div key={business.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getBusinessImageUrl(business.image_url)}
                      alt={business.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-white font-semibold mb-1">{business.name}</h3>
                    {business.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">{business.description}</p>
                    )}
                    {business.email && (
                      <p className="text-gray-500 text-xs">{maskEmail(business.email)}</p>
                    )}
                    
                    <div className="mt-3">
                      {business.migration_source && business.claimed_at === null ? (
                        <Link
                          to={`/claim-business?business=${business.id}`}
                          className="inline-flex items-center text-sm px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition-colors"
                        >
                          Claim This Business
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      ) : business.claimed_at ? (
                        <span className="inline-flex items-center text-sm px-3 py-1 bg-gray-700 text-gray-300 rounded">
                          <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                          Already Claimed
                        </span>
                      ) : (
                        <Link
                          to={`/business/${business.id}`}
                          className="inline-flex items-center text-sm px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          View Business
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onContinue}
              className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
            >
              Continue with New Business
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateBusinessModal;