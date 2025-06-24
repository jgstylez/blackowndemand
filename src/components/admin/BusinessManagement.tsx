import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Crown, 
  Edit, 
  Trash2, 
  Star,
  Eye,
  MoreHorizontal,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase, getBusinessImageUrl } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../../hooks/useErrorHandler';
import ErrorFallback from '../common/ErrorFallback';

interface Business {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  city: string;
  state: string;
  country: string;
  website_url: string;
  phone: string;
  email: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  migration_source: string;
  claimed_at: string;
  vip_member?: any;
}

type BusinessFilter = 'all' | 'verified' | 'unverified' | 'featured' | 'members' | 'unclaimed' | 'inactive';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'category';

interface BusinessManagementProps {
  onBusinessUpdate?: () => void;
}

const BusinessManagement: React.FC<BusinessManagementProps> = ({ onBusinessUpdate }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<BusinessFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Reduced from 20 to 12
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    featured: 0,
    members: 0,
    unclaimed: 0,
    inactive: 0
  });

  const { error, handleError, clearError } = useErrorHandler({
    context: 'BusinessManagement',
    defaultMessage: 'Failed to manage businesses'
  });

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_business_stats');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats({
          total: data[0].total_businesses || 0,
          verified: data[0].verified_businesses || 0,
          featured: data[0].featured_businesses || 0,
          members: data[0].member_businesses || 0,
          unclaimed: data[0].unclaimed_businesses || 0,
          inactive: data[0].inactive_businesses || 0
        });
      }
    } catch (err) {
      logError('Failed to fetch stats', {
        context: 'BusinessManagement.fetchStats',
        metadata: { error: err }
      });
    }
  }, []);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      
      let query = supabase
        .from('businesses')
        .select(`
          *,
          vip_member(*)
        `, { count: 'exact' });
      
      // Apply filters
      switch (filter) {
        case 'verified':
          query = query.eq('is_verified', true);
          break;
        case 'unverified':
          query = query.eq('is_verified', false);
          break;
        case 'featured':
          query = query.eq('is_featured', true);
          break;
        case 'members':
          query = query.not('vip_member', 'is', null);
          break;
        case 'unclaimed':
          query = query.not('migration_source', 'is', null).is('claimed_at', null);
          break;
        case 'inactive':
          query = query.eq('is_active', false);
          break;
      }
      
      // Apply search
      if (searchTerm) {
        query = query.or(`
          name.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%,
          description.ilike.%${searchTerm}%,
          category.ilike.%${searchTerm}%
        `);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name_desc':
          query = query.order('name', { ascending: false });
          break;
        case 'category':
          query = query.order('category', { ascending: true }).order('name', { ascending: true });
          break;
      }
      
      // Apply pagination
      const start = (currentPage - 1) * itemsPerPage;
      query = query.range(start, start + itemsPerPage - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setBusinesses(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      handleError(err, 'Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filter, sortBy, currentPage, itemsPerPage, handleError, clearError]);

  useEffect(() => {
    fetchBusinesses();
    fetchStats();
  }, [fetchBusinesses, fetchStats]);

  const handleBusinessAction = async (action: string, businessId: string) => {
    try {
      setLoading(true);
      clearError();
      
      switch (action) {
        case 'verify':
          await supabase
            .from('businesses')
            .update({ is_verified: true })
            .eq('id', businessId);
          break;
        case 'unverify':
          await supabase
            .from('businesses')
            .update({ is_verified: false })
            .eq('id', businessId);
          break;
        case 'feature':
          await supabase
            .from('businesses')
            .update({ is_featured: true })
            .eq('id', businessId);
          break;
        case 'unfeature':
          await supabase
            .from('businesses')
            .update({ is_featured: false })
            .eq('id', businessId);
          break;
        case 'activate':
          await supabase
            .from('businesses')
            .update({ is_active: true })
            .eq('id', businessId);
          break;
        case 'deactivate':
          await supabase
            .from('businesses')
            .update({ is_active: false })
            .eq('id', businessId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
            await supabase
              .from('businesses')
              .delete()
              .eq('id', businessId);
          }
          break;
      }
      
      // Refresh data
      fetchBusinesses();
      fetchStats();
      onBusinessUpdate?.();
    } catch (err) {
      handleError(err, `Failed to ${action} business`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBusinesses.length === 0) return;
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedBusinesses.length} businesses?`;
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setLoading(true);
      clearError();
      
      for (const businessId of selectedBusinesses) {
        await handleBusinessAction(action, businessId);
      }
      
      setSelectedBusinesses([]);
    } catch (err) {
      handleError(err, `Failed to perform bulk ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const exportBusinesses = async () => {
    try {
      setLoading(true);
      clearError();
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .csv();
      
      if (error) throw error;
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `businesses-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      handleError(err, 'Failed to export businesses');
    } finally {
      setLoading(false);
    }
  };

  const toggleBusinessSelection = (businessId: string) => {
    setSelectedBusinesses(prev => 
      prev.includes(businessId)
        ? prev.filter(id => id !== businessId)
        : [...prev, businessId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedBusinesses(
      selectedBusinesses.length === businesses.length 
        ? [] 
        : businesses.map(b => b.id)
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // If there's an error, show the error fallback
  if (error.hasError && !loading) {
    return (
      <ErrorFallback 
        error={error.details}
        message={error.message || "Failed to load businesses"}
        resetErrorBoundary={fetchBusinesses}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Management</h2>
          <p className="text-gray-400">Manage business listings and verification status</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportBusinesses}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              fetchBusinesses();
              fetchStats();
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Building2 className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Verified</p>
              <p className="text-2xl font-bold text-white">{stats.verified}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Featured</p>
              <p className="text-2xl font-bold text-white">{stats.featured}</p>
            </div>
            <Star className="h-6 w-6 text-purple-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">VIP</p>
              <p className="text-2xl font-bold text-white">{stats.members}</p>
            </div>
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unclaimed</p>
              <p className="text-2xl font-bold text-white">{stats.unclaimed}</p>
            </div>
            <AlertCircle className="h-6 w-6 text-orange-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Inactive</p>
              <p className="text-2xl font-bold text-white">{stats.inactive}</p>
            </div>
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as BusinessFilter)}
          className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        >
          <option value="all">All Businesses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="featured">Featured</option>
          <option value="members">VIP Members</option>
          <option value="unclaimed">Unclaimed</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="category">By Category</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedBusinesses.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-white">
              {selectedBusinesses.length} business{selectedBusinesses.length !== 1 ? 'es' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('verify')}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                Verify
              </button>
              <button
                onClick={() => handleBulkAction('feature')}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
              >
                Feature
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-800 rounded-lg" />
                <div className="flex-grow space-y-3">
                  <div className="h-6 bg-gray-800 rounded w-1/3" />
                  <div className="h-4 bg-gray-800 rounded w-2/3" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg">
            <input
              type="checkbox"
              checked={selectedBusinesses.length === businesses.length && businesses.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-white focus:ring-white"
            />
            <span className="text-white text-sm">
              Select All ({businesses.length} businesses)
            </span>
          </div>

          {/* Business Items */}
          {businesses.map((business) => (
            <div
              key={business.id}
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
                              <Trash2 className="h-4 w-4" />
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
          ))}
          
          {businesses.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No businesses found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} businesses
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessManagement;