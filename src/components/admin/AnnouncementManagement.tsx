import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  Megaphone,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_url: string;
  link_text: string;
  is_active: boolean;
  background_color: string;
  text_color: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface AnnouncementForm {
  title: string;
  message: string;
  link_url: string;
  link_text: string;
  background_color: string;
  text_color: string;
}

const defaultForm: AnnouncementForm = {
  title: '',
  message: '',
  link_url: '',
  link_text: '',
  background_color: '#1f2937',
  text_color: '#ffffff'
};

const colorPresets = [
  { name: 'Dark Gray', bg: '#1f2937', text: '#ffffff' },
  { name: 'Blue', bg: '#1e40af', text: '#ffffff' },
  { name: 'Green', bg: '#059669', text: '#ffffff' },
  { name: 'Purple', bg: '#7c3aed', text: '#ffffff' },
  { name: 'Red', bg: '#dc2626', text: '#ffffff' },
  { name: 'Yellow', bg: '#d97706', text: '#ffffff' },
  { name: 'Light', bg: '#f3f4f6', text: '#111827' },
];

interface AnnouncementManagementProps {
  onAnnouncementUpdate?: () => void;
}

const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ onAnnouncementUpdate }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnnouncementForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleColorPreset = (bg: string, text: string) => {
    setFormData(prev => ({ 
      ...prev, 
      background_color: bg, 
      text_color: text 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      setError('Message is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editingId) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert({
            ...formData,
            created_by: user.id
          });

        if (error) throw error;
      }

      // Reset form and refresh data
      setFormData(defaultForm);
      setShowForm(false);
      setEditingId(null);
      fetchAnnouncements();
      onAnnouncementUpdate?.();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      setError('Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title || '',
      message: announcement.message,
      link_url: announcement.link_url || '',
      link_text: announcement.link_text || '',
      background_color: announcement.background_color,
      text_color: announcement.text_color
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      
      // If activating this announcement, deactivate all others first
      if (!currentStatus) {
        await supabase
          .from('announcements')
          .update({ is_active: false })
          .neq('id', id);
      }

      const { error } = await supabase
        .from('announcements')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      fetchAnnouncements();
      onAnnouncementUpdate?.();
    } catch (err) {
      console.error('Failed to toggle announcement status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchAnnouncements();
      onAnnouncementUpdate?.();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
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
          <h2 className="text-2xl font-bold text-white">Announcement Management</h2>
          <p className="text-gray-400">Manage homepage announcement bar</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Announcement
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
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
                  Title (optional)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  name="link_text"
                  value={formData.link_text}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Learn More"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                required
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                placeholder="Your announcement message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Link URL (optional)
              </label>
              <input
                type="url"
                name="link_url"
                value={formData.link_url}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="https://example.com or /internal-page"
              />
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleColorPreset(preset.bg, preset.text)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.background_color === preset.bg 
                        ? 'border-white' 
                        : 'border-transparent hover:border-gray-600'
                    }`}
                    style={{ backgroundColor: preset.bg, color: preset.text }}
                  >
                    <div className="text-xs font-medium">{preset.name}</div>
                  </button>
                ))}
              </div>
              
              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Background Color</label>
                  <input
                    type="color"
                    name="background_color"
                    value={formData.background_color}
                    onChange={handleFormChange}
                    className="w-full h-10 rounded border border-gray-700 bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Text Color</label>
                  <input
                    type="color"
                    name="text_color"
                    value={formData.text_color}
                    onChange={handleFormChange}
                    className="w-full h-10 rounded border border-gray-700 bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preview
              </label>
              <div 
                className="p-4 rounded-lg text-center text-sm font-medium"
                style={{ 
                  backgroundColor: formData.background_color,
                  color: formData.text_color 
                }}
              >
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {formData.title && (
                    <span className="font-semibold">{formData.title}</span>
                  )}
                  <span>{formData.message || 'Your message will appear here'}</span>
                  {formData.link_url && formData.link_text && (
                    <span className="underline">{formData.link_text}</span>
                  )}
                </div>
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

      {/* Announcements List */}
      <div className="space-y-4">
        {loading && announcements.length === 0 ? (
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
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-gray-900 rounded-xl p-6 transition-all ${
                  announcement.is_active ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      {announcement.title && (
                        <h3 className="text-lg font-bold text-white">{announcement.title}</h3>
                      )}
                      {announcement.is_active && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mb-3">{announcement.message}</p>
                    
                    {announcement.link_url && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <ExternalLink className="h-4 w-4" />
                        <span>Links to: {announcement.link_url}</span>
                        {announcement.link_text && (
                          <span>({announcement.link_text})</span>
                        )}
                      </div>
                    )}
                    
                    {/* Color Preview */}
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-6 h-6 rounded border border-gray-600"
                        style={{ backgroundColor: announcement.background_color }}
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-600"
                        style={{ backgroundColor: announcement.text_color }}
                      />
                      <span className="text-xs text-gray-500">Color scheme</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Created {new Date(announcement.created_at).toLocaleDateString()}
                      {announcement.updated_at !== announcement.created_at && (
                        <span> • Updated {new Date(announcement.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        announcement.is_active
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                      title={announcement.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {announcement.is_active ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {announcements.length === 0 && !loading && (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No announcements created yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Create First Announcement
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagement;