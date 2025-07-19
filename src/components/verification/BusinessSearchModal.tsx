import React, { useState } from 'react';
import { Search, X, Building2, MapPin, Mail, Crown } from 'lucide-react';
import { supabase, getBusinessImageUrl } from '../../lib/supabase';
import { maskEmail } from '../../utils/emailUtils';

interface Business {
  id: string;
  name: string;
  description: string;
  email: string;
  city: string;
  state: string;
  category: string;
  image_url: string;
  migration_source: string;
  claimed_at: string | null;
}

interface BusinessSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessSelect: (business: Business) => void;
}

const BusinessSearchModal: React.FC<BusinessSearchModalProps> = ({
  isOpen,
  onClose,
  onBusinessSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .is('claimed_at', null) // Only show unclaimed businesses
        .not('migration_source', 'is', null) // Only show migrated businesses
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">Search For Your Business</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            Search for your business to claim ownership and access your dashboard
          </p>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter business name, email, or description"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg" />
                    <div className="flex-grow space-y-3">
                      <div className="h-5 bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-700 rounded w-1/2" />
                      <div className="h-4 bg-gray-700 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            searchResults.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Found {searchResults.length} business{searchResults.length !== 1 ? 'es' : ''}
                </h3>
                {searchResults.map(business => (
                  <div
                    key={business.id}
                    onClick={() => onBusinessSelect(business)}
                    className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  >
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
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-semibold">{business.name}</h4>
                          {business.migration_source && (
                            <Crown className="h-4 w-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                          {business.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {business.city && business.state && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{business.city}, {business.state}</span>
                            </div>
                          )}
                          {business.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{maskEmail(business.email)}</span>
                            </div>
                          )}
                          <span>{business.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                          Claim This Business
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No businesses found</h3>
                <p className="text-gray-400 mb-4">
                  We couldn't find any unclaimed businesses matching your search.
                </p>
                <p className="text-gray-500 text-sm">
                  Try different keywords or contact support if you believe your business should be listed.
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Search for Your Business</h3>
              <p className="text-gray-400">
                Enter your business name, email, or description to find your listing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessSearchModal;