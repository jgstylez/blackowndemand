import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Search, 
  Filter, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useErrorHandler from '../../hooks/useErrorHandler';

interface PaymentRecord {
  id: string;
  business_id: string;
  business_name: string;
  nmi_transaction_id: string;
  amount: number;
  status: string;
  type: string;
  response_text: string;
  created_at: string;
}

interface PaymentHistoryManagementProps {
  onUpdate?: () => void;
}

const PaymentHistoryManagement: React.FC<PaymentHistoryManagementProps> = ({ onUpdate }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'PaymentHistoryManagement',
    defaultMessage: 'Failed to load payment history'
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, [currentPage, statusFilter, typeFilter, sortField, sortDirection]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      clearError();

      // Calculate pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Build query
      let query = supabase
        .from('payment_history')
        .select(`
          id,
          business_id,
          businesses(name),
          nmi_transaction_id,
          amount,
          status,
          type,
          response_text,
          created_at
        `, { count: 'exact' });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (searchTerm) {
        query = query.or(`nmi_transaction_id.ilike.%${searchTerm}%,businesses.name.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Apply pagination
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform data to include business name
      const transformedData = data?.map(item => ({
        ...item,
        business_name: item.businesses?.name || 'Unknown Business',
        businesses: undefined // Remove the nested businesses object
      })) || [];

      setPayments(transformedData as PaymentRecord[]);
      setTotalCount(count || 0);
    } catch (err) {
      handleError(err, 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPaymentHistory();
    if (onUpdate) onUpdate();
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new sort field
    }
  };

  const exportPaymentHistory = () => {
    // Create CSV content
    const headers = ['Transaction ID', 'Business', 'Amount', 'Status', 'Type', 'Date'];
    const rows = payments.map(payment => [
      payment.nmi_transaction_id || 'N/A',
      payment.business_name,
      `$${payment.amount.toFixed(2)}`,
      payment.status,
      payment.type,
      new Date(payment.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const viewPaymentDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => 
    searchTerm === '' || 
    payment.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.nmi_transaction_id && payment.nmi_transaction_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500/20 text-green-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  // Get payment type display name
  const getPaymentTypeDisplay = (type: string) => {
    switch (type) {
      case 'initial_subscription':
        return 'Initial Subscription';
      case 'recurring_payment':
        return 'Recurring Payment';
      case 'payment_method_update':
        return 'Payment Method Update';
      case 'subscription_cancellation':
        return 'Subscription Cancellation';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Payment History</h2>
          <p className="text-gray-400">Track and manage payment transactions</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportPaymentHistory}
            disabled={loading || payments.length === 0}
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

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by business name or transaction ID..."
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
              <option value="approved">Approved</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="initial_subscription">Initial Subscription</option>
              <option value="recurring_payment">Recurring Payment</option>
              <option value="payment_method_update">Payment Method Update</option>
              <option value="subscription_cancellation">Cancellation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
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
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No payment records found</p>
          {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          ) : (
            <p className="text-gray-500 text-sm mt-2">Payment records will appear here when transactions are processed</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 text-sm">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      <span>Date</span>
                      {sortField === 'created_at' && (
                        <ArrowUpDown className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('businesses.name')}>
                    <div className="flex items-center">
                      <span>Business</span>
                      {sortField === 'businesses.name' && (
                        <ArrowUpDown className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('amount')}>
                    <div className="flex items-center">
                      <span>Amount</span>
                      {sortField === 'amount' && (
                        <ArrowUpDown className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('type')}>
                    <div className="flex items-center">
                      <span>Type</span>
                      {sortField === 'type' && (
                        <ArrowUpDown className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <ArrowUpDown className={`h-4 w-4 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredPayments.map(payment => (
                  <tr key={payment.id} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-white">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {payment.business_name}
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-sm">
                      {payment.nmi_transaction_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-white">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {getPaymentTypeDisplay(payment.type)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewPaymentDetails(payment)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} payments
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

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Payment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Transaction Information</h4>
                  <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="text-white font-mono">{selectedPayment.nmi_transaction_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-white">{formatDate(selectedPayment.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-white">{getPaymentTypeDisplay(selectedPayment.type)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className={`text-sm font-medium ${getStatusBadgeClass(selectedPayment.status)}`}>
                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Details</h4>
                  <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Business</p>
                      <p className="text-white">{selectedPayment.business_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-white text-xl font-semibold">${selectedPayment.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Business ID</p>
                      <p className="text-white font-mono text-sm">{selectedPayment.business_id}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedPayment.response_text && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Gateway Response</h4>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap overflow-auto max-h-40">
                      {selectedPayment.response_text}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryManagement;