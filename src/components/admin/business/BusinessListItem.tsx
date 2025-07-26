import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Crown, 
  Star, 
  Eye, 
  MoreHorizontal, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
   
  Calendar, 
  Users 
} from 'lucide-react';
import { getBusinessImageUrl } from '../../../lib/supabase';

interface BusinessListItemProps {
  business: any;
  selectedBusinesses: string[];
  toggleBusinessSelection: (businessId: string) => void;
  showActions: string | null;
  setShowActions: (id: string | null) => void;
  handleBusinessAction: (action: string, businessId: string) => void;
}

const BusinessListItem: React.FC<BusinessListItemProps> = ({
  business,
  selectedBusinesses,
  toggleBusinessSelection,
  showActions,
  setShowActions,
  handleBusinessAction
}) => {
  return (
    <div
      className={`bg-gray-900 rounded-xl p-6 transition-all ${
        selectedBusinesses.includes(business.id) ? 'ring-2 ring-white' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={selectedBusinesses.includes(business.id)}
          onChange={() => toggleBusinessSelection(business.id)}
          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-white focus:ring-white mt-1"
        />
        
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={getBusinessImageUrl(business.image_url)}
            alt={business.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
            }}
          />
        </div>
        
        <div className="flex-grow">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">{business.name}</h3>
                {business.is_verified && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {business.is_featured && (
                  <Star className="h-5 w-5 text-purple-500" />
                )}
                {business.vip_member && (
                  <Crown className="h-5 w-5 text-yellow-500" />
                )}
                {!business.is_active && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              {business.tagline && (
                <p className="text-gray-400 mb-2">{business.tagline}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                <div className="space-y-1">
                  {business.category && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{business.category}</span>
                    </div>
                  )}
                  {business.city && business.state && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{business.city}, {business.state}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {business.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{business.email}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(business.created_at).toLocaleDateString()}</span>
                </div>
                {business.claimed_at && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Claimed {new Date(business.claimed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative ml-4">
              <button
                onClick={() => setShowActions(showActions === business.id ? null : business.id)}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              
              {showActions === business.id && (
                <div className="absolute right-0 top-12 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10 min-w-48">
                  <div className="p-2">
                    <button
                      onClick={() => window.open(`/business/${business.id}`, '_blank')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                    >
                      <Eye className="h-4 w-4" />
                      View Business
                    </button>
                    
                    {!business.is_verified ? (
                      <button
                        onClick={() => handleBusinessAction('verify', business.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-gray-700 rounded"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Verify Business
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBusinessAction('unverify', business.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded"
                      >
                        <XCircle className="h-4 w-4" />
                        Remove Verification
                      </button>
                    )}
                    
                    {!business.is_featured ? (
                      <button
                        onClick={() => handleBusinessAction('feature', business.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-gray-700 rounded"
                      >
                        <Star className="h-4 w-4" />
                        Feature Business
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBusinessAction('unfeature', business.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded"
                      >
                        <Star className="h-4 w-4" />
                        Remove Featured
                      </button>
                    )}

                    {business.is_active ? (
                      <button
                        onClick={() => handleBusinessAction('deactivate', business.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-gray-700 rounded"
                      >
                        <XCircle className="h-4 w-4" />
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBusinessAction('activate', business.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-gray-700 rounded"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Activate
                      </button>
                    )}
                    
                    <hr className="my-2 border-gray-700" />
                    
                    <button
                      onClick={() => handleBusinessAction('delete', business.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                    >
                      <XCircle className="h-4 w-4" />
                      Delete Business
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessListItem;