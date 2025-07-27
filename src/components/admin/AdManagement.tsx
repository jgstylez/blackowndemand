import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  X,
  Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Ad {
  id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_text: string | null;
  is_active: boolean | null;
  position: number | null;
  priority: number | null;
  placement_area: string | null;
  ad_type: string;
  start_date: string;
  end_date: string;
  impressions_count: number | null;
  clicks_count: number | null;
  business_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AdForm {
  name: string;
  description: string;
  image_url: string;
  link_url: string;
  cta_text: string;
  ad_type: string;
  placement_area: string;
  position: number;
  priority: number;
  start_date: string;
  end_date: string;
  business_id: string;
}

const defaultForm: AdForm = {
  name: '',
  description: '',
  image_url: '',
  link_url: '',
  cta_text: 'Learn More',
  ad_type: 'banner',
  placement_area: 'homepage',
  position: 0,
  priority: 0,
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  business_id: ''
};

interface AdManagementProps {
  onAdUpdate?: () => void;
}

const AdManagement: React.FC<AdManagementProps> = ({ onAdUpdate }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      setError('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'position' || name === 'priority' ? parseInt(value) || 0 : value 
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Ad name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingId) {
        // Update existing ad
        const { error } = await supabase
          .from('ads')
          .update({
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            link_url: formData.link_url,
            cta_text: formData.cta_text,
            ad_type: formData.ad_type,
            placement_area: formData.placement_area,
            position: formData.position,
            priority: formData.priority,
            start_date: formData.start_date,
            end_date: formData.end_date,
            business_id: formData.business_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new ad
        const { error } = await supabase
          .from('ads')
          .insert({
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            link_url: formData.link_url,
            cta_text: formData.cta_text,
            ad_type: formData.ad_type,
            placement_area: formData.placement_area,
            position: formData.position,
            priority: formData.priority,
            start_date: formData.start_date,
            end_date: formData.end_date,
            business_id: formData.business_id || null,
            is_active: true
          });

        if (error) throw error;
      }

      // Reset form and refresh data
      setFormData(defaultForm);
      setShowForm(false);
      setEditingId(null);
      fetchAds();
      onAdUpdate?.();
    } catch (err) {
      console.error('Failed to save ad:', err);
      setError('Failed to save ad');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ad: Ad) => {
    setFormData({
      name: ad.name || '',
      description: ad.description || '',
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      cta_text: ad.cta_text || 'Learn More',
      ad_type: ad.ad_type,
      placement_area: ad.placement_area || 'homepage',
      position: ad.position || 0,
      priority: ad.priority || 0,
      start_date: ad.start_date,
      end_date: ad.end_date,
      business_id: ad.business_id || ''
    });
    setEditingId(ad.id);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean | null) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('ads')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      fetchAds();
      onAdUpdate?.();
    } catch (err) {
      console.error('Failed to toggle ad status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchAds();
      onAdUpdate?.();
    } catch (err) {
      console.error('Failed to delete ad:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData(defaultForm);
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Ad Management</h2>
          <p className="text-gray-400">Manage promotional ads and banners</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Ad
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingId ? 'Edit Ad' : 'Create New Ad'}
            </h3>
            <button
              onClick={cancelForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Enter ad name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad Type
                </label>
                <select
                  name="ad_type"
                  value={formData.ad_type}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="banner">Banner</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="inline">Inline</option>
                  <option value="popup">Popup</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                placeholder="Describe your ad"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link URL
                </label>
                <input
                  type="url"
                  name="link_url"
                  value={formData.link_url}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Call to Action Text
                </label>
                <input
                  type="text"
                  name="cta_text"
                  value={formData.cta_text}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Learn More"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position
                </label>
                <input
                  type="number"
                  name="position"
                  value={formData.position}
                  onChange={handleFormChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
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
                className="flex-1 py-3 px-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ads List */}
      <div className="space-y-4">
        {loading && ads.length === 0 ? (
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
        ) : (
          <>
            {ads.map((ad) => (
              <div
                key={ad.id}
                className={`bg-gray-900 rounded-xl p-6 transition-all ${
                  ad.is_active ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{ad.name || 'Untitled Ad'}</h3>
                      {ad.is_active && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                        {ad.ad_type}
                      </span>
                    </div>
                    
                    {ad.description && (
                      <p className="text-gray-300 mb-3">{ad.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Impressions</div>
                        <div className="text-white font-medium">{ad.impressions_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Clicks</div>
                        <div className="text-white font-medium">{ad.clicks_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Position</div>
                        <div className="text-white font-medium">{ad.position || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Priority</div>
                        <div className="text-white font-medium">{ad.priority || 0}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-3">
                      {ad.start_date} to {ad.end_date}
                      {ad.created_at && (
                        <span> • Created {new Date(ad.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(ad.id, ad.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        ad.is_active
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                      title={ad.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {ad.is_active ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(ad)}
                      className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {ads.length === 0 && !loading && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No ads created yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Create First Ad
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdManagement;