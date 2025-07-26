import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Search, 
  CreditCard, 
  DollarSign, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Subscription {
  subscription_id: string;
  plan_name: string;
  plan_price: number;
  subscription_status: string;
  payment_status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  business_id: string;
  business_name: string;
  is_verified: boolean;
  is_featured: boolean;
  city: string;
  state: string;
  country: string;
  owner_id: string;
  owner_email: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_full_name: string | null;
  subscription_created_at: string;
  subscription_updated_at: string;
}

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  revenue_this_month: number;
  revenue_total: number;
  starter_plan_count: number;
  enhanced_plan_count: number;
  vip_plan_count: number;
}

interface SubscriptionManagementProps {
  onUpdate?: () => void;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ onUpdate }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('paid_subscriptions_overview')
        .select('*');

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_subscription_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Error fetching subscription stats:', err);
      // Don't set error state here to avoid blocking the main subscription list
    }
  };

  const handleRefresh = () => {
    fetchSubscriptions();
    fetchStats();
    if (onUpdate) onUpdate();
  };

  const exportSubscriptions = () => {
    // Filter subscriptions based on current filters
    const dataToExport = filteredSubscriptions.map(sub => ({
      'Subscription ID': sub.subscription_id,
      'Business Name': sub.business_name,
      'Plan': sub.plan_name,
      'Price': `$${sub.plan_price}`,
      'Status': sub.subscription_status,
      'Payment Status': sub.payment_status,
      'Start Date': new Date(sub.current_period_start).toLocaleDateString(),
      'End Date': new Date(sub.current_period_end).toLocaleDateString(),
      'Auto Renew': !sub.cancel_at_period_end ? 'Yes' : 'No',
      'Owner': sub.owner_full_name || sub.owner_email,
      'Email': sub.owner_email,
      'Location': [sub.city, sub.state, sub.country].filter(Boolean).join(', '),
      'Created': new Date(sub.subscription_created_at).toLocaleDateString()
    }));

    // Convert to CSV
    const headers = Object.keys(dataToExport[0] || {});
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`; 
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter subscriptions based on search term and filters
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      searchTerm === '' || 
      sub.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.owner_full_name && sub.owner_full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      sub.subscription_status === statusFilter;
    
    const matchesPlan = 
      planFilter === 'all' || 
      sub.plan_name === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Subscription Management</h2>
          <p className="text-gray-400">Track and manage paid subscriptions</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportSubscriptions}
            disabled={loading || filteredSubscriptions.length === 0}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-3xl font-bold text-white">{stats.active_subscriptions}</p>
                <p className="text-sm text-gray-500">of {stats.total_subscriptions} total</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Revenue</p>
                <p className="text-3xl font-bold text-white">${stats.revenue_this_month || 0}</p>
                <p className="text-sm text-gray-500">current month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white">${stats.revenue_total || 0}</p>
                <p className="text-sm text-gray-500">all time</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Plan Distribution</p>
                <div className="flex flex-col gap-4 mt-2">
  {/* Starter */}
  <div className="flex flex-col">
    <span className="text-sm text-blue-400">Starter: {stats.starter_plan_count}</span>
    <div
      className="h-2 bg-blue-500 rounded"
      style={{
        width: `${stats.total_subscriptions ? (stats.starter_plan_count / stats.total_subscriptions) * 100 : 0}%`,
      }}
    />
  </div>

  {/* Enhanced */}
  <div className="flex flex-col">
    <span className="text-sm text-purple-400">Enhanced: {stats.enhanced_plan_count}</span>
    <div
      className="h-2 bg-purple-500 rounded"
      style={{
        width: `${stats.total_subscriptions ? (stats.enhanced_plan_count / stats.total_subscriptions) * 100 : 0}%`,
      }}
    />
  </div>

  {/* VIP */}
  <div className="flex flex-col">
    <span className="text-sm text-yellow-400">VIP: {stats.vip_plan_count}</span>
    <div
      className="h-2 bg-yellow-500 rounded"
      style={{
        width: `${stats.total_subscriptions ? (stats.vip_plan_count / stats.total_subscriptions) * 100 : 0}%`,
      }}
    />
  </div>
</div>

              </div>
              <CreditCard className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by business name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="all">All Plans</option>
              <option value="Starter Plan">Starter Plan</option>
              <option value="Enhanced">Enhanced</option>
              <option value="VIP Plan">VIP Plan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Subscriptions Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No subscriptions found</p>
          {searchTerm || statusFilter !== 'all' || planFilter !== 'all' ? (
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          ) : (
            <p className="text-gray-500 text-sm mt-2">Subscriptions will appear here when users purchase plans</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 text-sm">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Business</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 rounded-tr-lg">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedSubscriptions.map(sub => (
                  <tr key={sub.subscription_id} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{sub.business_name}</p>
                        <div className="flex gap-1 mt-1">
                          {sub.is_verified && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              Verified
                            </span>
                          )}
                          {sub.is_featured && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          sub.plan_name === 'VIP Plan' ? 'bg-yellow-500' :
                          sub.plan_name === 'Enhanced' ? 'bg-purple-500' :
                          'bg-blue-500'
                        }`}></span>
                        <div>
                          <p className="text-white">{sub.plan_name}</p>
                          <p className="text-gray-500 text-xs">${sub.plan_price}/year</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sub.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' :
                          sub.subscription_status === 'canceled' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {sub.subscription_status === 'active' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : sub.subscription_status === 'canceled' ? (
                            <XCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {sub.subscription_status.charAt(0).toUpperCase() + sub.subscription_status.slice(1)}
                        </span>
                        <p className="text-gray-500 text-xs mt-1">
                          {sub.payment_status.charAt(0).toUpperCase() + sub.payment_status.slice(1)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm">{formatDate(sub.current_period_start)}</p>
                        <p className="text-gray-500 text-xs">to {formatDate(sub.current_period_end)}</p>
                        {sub.cancel_at_period_end && (
                          <p className="text-red-400 text-xs mt-1">Cancels at period end</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white">
                          {sub.owner_full_name || 'No name'}
                        </p>
                        <p className="text-gray-500 text-xs">{sub.owner_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(sub.subscription_created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length} subscriptions
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
        </>
      )}
    </div>
  );
};

export default SubscriptionManagement;