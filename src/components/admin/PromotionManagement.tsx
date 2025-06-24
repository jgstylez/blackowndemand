import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Calendar, 
  DollarSign, 
  Percent, 
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  Download,
  Info,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Promotion {
  id: string;
  name: string;
  description: string;
  original_plan_id: string;
  original_plan_name: string;
  original_price: number;
  promotional_price: number;
  start_date: string;
  end_date: string | null;
  target_audience: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  savings_amount: number;
  savings_percentage: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
}

interface PromotionFormData {
  name: string;
  description: string;
  original_plan_id: string;
  promotional_price: number;
  start_date: string;
  end_date: string;
  target_audience: string;
  is_active: boolean;
}

interface PromotionManagementProps {
  onUpdate?: () => void;
}

const PromotionManagement: React.FC<PromotionManagementProps> = ({ onUpdate }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const defaultFormData: PromotionFormData = {
    name: '',
    description: '',
    original_plan_id: '',
    promotional_price: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    target_audience: 'all',
    is_active: true
  };
  
  const [formData, setFormData] = useState<PromotionFormData>(defaultFormData);

  useEffect(() => {
    fetchPromotions();
    fetchSubscriptionPlans();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          id,
          name,
          description,
          original_plan_id,
          promotional_price,
          start_date,
          end_date,
          target_audience,
          is_active,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch plan details for each promotion
      const promotionsWithDetails = await Promise.all((data || []).map(async (promo) => {
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('name, price')
          .eq('id', promo.original_plan_id)
          .single();
          
        if (planError) {
          console.error('Error fetching plan details:', planError);
          return {
            ...promo,
            original_plan_name: 'Unknown Plan',
            original_price: 0,
            savings_amount: 0,
            savings_percentage: 0
          };
        }
        
        const original_price = planData?.price || 0;
        const savings_amount = original_price - promo.promotional_price;
        const savings_percentage = original_price > 0 
          ? Math.round((savings_amount / original_price) * 100 * 10) / 10 
          : 0;
          
        return {
          ...promo,
          original_plan_name: planData?.name || 'Unknown Plan',
          original_price,
          savings_amount,
          savings_percentage
        };
      }));
      
      setPromotions(promotionsWithDetails);
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price')
        .order('price', { ascending: true });

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (err) {
      console.error('Failed to fetch subscription plans:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Promotion name is required');
      return;
    }
    
    if (!formData.original_plan_id) {
      setError('Please select a subscription plan');
      return;
    }
    
    if (formData.promotional_price <= 0) {
      setError('Promotional price must be greater than 0');
      return;
    }
    
    // Get the original plan price to validate the promotional price
    const plan = subscriptionPlans.find(p => p.id === formData.original_plan_id);
    if (plan && formData.promotional_price >= plan.price) {
      setError('Promotional price must be less than the original price');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const promotionData = {
        name: formData.name,
        description: formData.description,
        original_plan_id: formData.original_plan_id,
        promotional_price: formData.promotional_price,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        target_audience: formData.target_audience,
        is_active: formData.is_active
      };

      if (editingId) {
        // Update existing promotion
        const { error } = await supabase
          .from('promotions')
          .update({
            ...promotionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
        setSuccess('Promotion updated successfully');
      } else {
        // Create new promotion
        const { error } = await supabase
          .from('promotions')
          .insert(promotionData);

        if (error) throw error;
        setSuccess('Promotion created successfully');
      }

      // Reset form and refresh data
      setFormData(defaultFormData);
      setShowForm(false);
      setEditingId(null);
      fetchPromotions();
      if (onUpdate) onUpdate();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to save promotion:', err);
      setError('Failed to save promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setFormData({
      name: promotion.name,
      description: promotion.description,
      original_plan_id: promotion.original_plan_id,
      promotional_price: promotion.promotional_price,
      start_date: new Date(promotion.start_date).toISOString().split('T')[0],
      end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().split('T')[0] : '',
      target_audience: promotion.target_audience,
      is_active: promotion.is_active
    });
    setEditingId(promotion.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('Promotion deleted successfully');
      fetchPromotions();
      if (onUpdate) onUpdate();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to delete promotion:', err);
      setError('Failed to delete promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('promotions')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      setSuccess(`Promotion ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchPromotions();
      if (onUpdate) onUpdate();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to toggle promotion status:', err);
      setError('Failed to update promotion status');
    } finally {
      setLoading(false);
    }
  };

  const exportPromotions = () => {
    const csvContent = [
      ['Name', 'Description', 'Plan', 'Original Price', 'Promotional Price', 'Savings', 'Start Date', 'End Date', 'Target Audience', 'Status'],
      ...promotions.map(promo => [
        promo.name,
        promo.description,
        promo.original_plan_name,
        `$${promo.original_price}`,
        `$${promo.promotional_price}`,
        `$${promo.savings_amount} (${promo.savings_percentage}%)`,
        new Date(promo.start_date).toLocaleDateString(),
        promo.end_date ? new Date(promo.end_date).toLocaleDateString() : 'No expiration',
        promo.target_audience,
        promo.is_active ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promotions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculateTimeRemaining = (endDate: string | null) => {
    if (!endDate) return 'No expiration';
    
    const end = new Date(endDate);
    const now = new Date();
    
    if (end <= now) return 'Expired';
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} left`;
    }
    
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
  };

  const cancelForm = () => {
    setFormData(defaultFormData);
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Promotion Management</h2>
          <p className="text-gray-400">Create and manage promotional offers for subscription plans</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportPromotions}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={fetchPromotions}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Promotion
          </button>
        </div>
      </div>

      {/* Success and Error Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Promotion Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingId ? 'Edit Promotion' : 'Create New Promotion'}
            </h3>
            <button
              onClick={cancelForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Promotion Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="e.g., Summer Sale, VIP Special Offer"
                  required
                />
              </div>

              <div>
                <label htmlFor="original_plan_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Subscription Plan *
                </label>
                <select
                  id="original_plan_id"
                  name="original_plan_id"
                  value={formData.original_plan_id}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  required
                >
                  <option value="">Select a plan</option>
                  {subscriptionPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} (Regular: ${plan.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={2}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                placeholder="Describe the promotion"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="promotional_price" className="block text-sm font-medium text-gray-300 mb-2">
                  Promotional Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    id="promotional_price"
                    name="promotional_price"
                    value={formData.promotional_price}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="99.00"
                    required
                  />
                </div>
                {formData.original_plan_id && subscriptionPlans.find(p => p.id === formData.original_plan_id)?.price && (
                  <div className="mt-2 text-sm">
                    {(() => {
                      const plan = subscriptionPlans.find(p => p.id === formData.original_plan_id);
                      if (!plan) return null;
                      
                      const originalPrice = plan.price;
                      const promoPrice = formData.promotional_price;
                      
                      if (promoPrice >= originalPrice) {
                        return (
                          <p className="text-red-500">
                            Promotional price must be less than original price (${originalPrice})
                          </p>
                        );
                      }
                      
                      const savings = originalPrice - promoPrice;
                      const savingsPercent = Math.round((savings / originalPrice) * 100 * 10) / 10;
                      
                      return (
                        <p className="text-green-500">
                          Savings: ${savings.toFixed(2)} ({savingsPercent}% off)
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="target_audience" className="block text-sm font-medium text-gray-300 mb-2">
                  Target Audience
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    id="target_audience"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="new_users">New Users Only</option>
                    <option value="existing_users">Existing Users Only</option>
                    <option value="claimed_businesses">Claimed Businesses</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-white focus:ring-white focus:ring-offset-gray-900"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-300">
                Active
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Promotion' : 'Create Promotion')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotions List */}
      <div className="space-y-4">
        {loading && promotions.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-800 rounded w-48" />
                    <div className="h-4 bg-gray-800 rounded w-96" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-gray-800 rounded" />
                    <div className="w-10 h-10 bg-gray-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : promotions.length > 0 ? (
          <>
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className={`bg-gray-900 rounded-xl p-6 transition-all ${
                  promotion.is_active ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{promotion.name}</h3>
                      {promotion.is_active && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                      {!promotion.is_active && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                      {promotion.end_date && new Date(promotion.end_date) < new Date() && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                          Expired
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mb-3">{promotion.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Plan</p>
                        <p className="text-white">{promotion.original_plan_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price</p>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 line-through">${promotion.original_price}</span>
                          <span className="text-white font-medium">${promotion.promotional_price}</span>
                          <span className="text-green-500">(-{promotion.savings_percentage}%)</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500">Audience</p>
                        <p className="text-white capitalize">{promotion.target_audience.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {new Date(promotion.start_date).toLocaleDateString()}</span>
                      </div>
                      
                      {promotion.end_date && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>End: {new Date(promotion.end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {promotion.end_date && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{calculateTimeRemaining(promotion.end_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(promotion.id, promotion.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        promotion.is_active
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                      title={promotion.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {promotion.is_active ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(promotion)}
                      className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(promotion.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No promotions found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create First Promotion
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-400 flex items-start gap-3">
        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm">
            <strong>Promotions</strong> allow you to offer discounted pricing on subscription plans for a limited time.
            You can set start and end dates, target specific audiences, and control which plans are discounted.
          </p>
          <ul className="mt-2 text-sm list-disc list-inside">
            <li>Active promotions will be displayed on the pricing page</li>
            <li>You can have multiple promotions, but only one per plan will be shown</li>
            <li>Promotions without end dates will run indefinitely until manually deactivated</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PromotionManagement;