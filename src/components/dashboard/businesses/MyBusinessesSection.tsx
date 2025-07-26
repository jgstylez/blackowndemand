import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, Clock, Crown, CheckCircle } from 'lucide-react';
import { Business } from '../../../types';

interface MyBusinessesSectionProps {
  businesses: Business[];
  incompleteBusinesses: Business[];
  loading: boolean;
  hasBusinesses: boolean;
  onDeleteBusiness: (businessId: string) => Promise<boolean>;
  onEditBusiness: (business: Business) => void;
  onContinueListing: (business: Business) => void;
}

const MyBusinessesSection: React.FC<MyBusinessesSectionProps> = ({
  businesses,
  incompleteBusinesses,
  loading,
  hasBusinesses,
  onDeleteBusiness,
  onEditBusiness,
  onContinueListing
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <div className="h-6 bg-gray-800 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-800 rounded w-1/4" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-800 rounded" />
                <div className="w-10 h-10 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">My Businesses</h2>
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Business
        </button>
      </div>

      {/* Incomplete Businesses Section */}
      {incompleteBusinesses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            Incomplete Listings
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {incompleteBusinesses.map(business => (
              <div key={business.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {business.name === 'Pending Business Listing' ? 'Complete Your Business Listing' : business.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Incomplete
                      </span>
                    </div>
                    <p className="text-gray-400 mb-4">
                      You've started the process of listing your business. Complete your listing to make it visible in our directory.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Plan: {business.subscription_plan_name || 'Basic'}</span>
                      <span>•</span>
                      <span>Created: {new Date(business.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onContinueListing(business)}
                      className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      Complete Listing
                    </button>
                    <button
                      onClick={() => onDeleteBusiness(business.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Businesses */}
      {businesses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {businesses.map(business => (
            <div key={business.id} className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">{business.name}</h3>
                    {business.isVerified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                    {business.subscription_plan_name === 'VIP Plan' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-400/20 text-yellow-400">
                        <Crown className="h-3 w-3 mr-1" />
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{business.tagline}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {business.city && business.state && (
                      <span>{business.city}, {business.state}</span>
                    )}
                    {business.category && (
                      <>
                        <span>•</span>
                        <span>{business.category}</span>
                      </>
                    )}
                    {business.subscription_plan_name && (
                      <>
                        <span>•</span>
                        <span>Plan: {business.subscription_plan_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditBusiness(business)}
                    className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDeleteBusiness(business.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!hasBusinesses && !incompleteBusinesses.length && (
        <div className="mb-8">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Building2 className="h-12 w-12 text-gray-600" />
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-white mb-2">List Your Business</h3>
                <p className="text-gray-400 mb-4">
                  Join hundreds of Black-owned businesses on our platform. Get discovered by customers looking for your services.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/pricing')}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    List Your Business
                  </button>
                  <button
                    onClick={() => navigate('/claim-business')}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Claim Existing Business
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBusinessesSection;