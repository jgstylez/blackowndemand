import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../../hooks/useErrorHandler';
import ErrorFallback from '../common/ErrorFallback';
import BusinessStatsCards from './business/BusinessStatsCards';
import BusinessFilters from './business/BusinessFilters';
import BusinessListItem from './business/BusinessListItem';
import PaginationControls from '../common/PaginationControls';

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
      
      const { data, error: fetchError, count } = await query;
      
      if (fetchError) throw fetchError;
      
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
      <BusinessStatsCards stats={stats} />

      {/* Filters and Search */}
      <BusinessFilters 
        searchTerm={searchTerm}
        filter={filter}
        sortBy={sortBy}
        selectedBusinesses={selectedBusinesses}
        businesses={businesses}
        onSearchChange={setSearchTerm}
        onFilterChange={(value) => {
          setFilter(value as BusinessFilter);
          setCurrentPage(1);
        }}
        onSortChange={(value) => {
          setSortBy(value as SortOption);
          setCurrentPage(1);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setFilter('all');
          setSortBy('newest');
          setCurrentPage(1);
        }}
        onBulkAction={handleBulkAction}
        toggleSelectAll={toggleSelectAll}
      />

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
      ) : businesses.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No businesses found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business) => (
            <BusinessListItem
              key={business.id}
              business={business}
              selectedBusinesses={selectedBusinesses}
              toggleBusinessSelection={toggleBusinessSelection}
              showActions={showActions}
              setShowActions={setShowActions}
              handleBusinessAction={handleBusinessAction}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
};

export default BusinessManagement;