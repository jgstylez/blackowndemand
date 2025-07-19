import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  Image as ImageIcon,
  ExternalLink,
  Upload,
  BarChart3,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  Copy,
  Check,
  RefreshCw,
  Clock,
  RotateCw,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  cta_text: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
  target_audience: string;
  budget: number;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
}

interface AdForm {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  cta_text: string;
  background_color: string;
  text_color: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  target_audience: string;
  budget: number;
  start_date: string;
  end_date: string;
}

interface AdSettings {
  autoRotation: {
    enabled: boolean;
    interval: number; // in hours
    metric: 'ctr' | 'impressions' | 'random';
  };
  frequencyCapping: {
    enabled: boolean;
    maxImpressions: number;
    timeframe: 'day' | 'week' | 'month';
  };
  abTesting: {
    enabled: boolean;
    trafficSplit: number; // percentage for variant A (0-100)
    activeTest: boolean;
  };
}

const defaultForm: AdForm = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  cta_text: 'Learn More',
  background_color: '#1f2937',
  text_color: '#ffffff',
  position: 1,
  size: 'medium',
  target_audience: 'all',
  budget: 100,
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

const defaultSettings: AdSettings = {
  autoRotation: {
    enabled: false,
    interval: 24, // rotate every 24 hours by default
    metric: 'ctr' // rotate based on CTR by default
  },
  frequencyCapping: {
    enabled: false,
    maxImpressions: 3, // show ad max 3 times by default
    timeframe: 'day' // per day by default
  },
  abTesting: {
    enabled: false,
    trafficSplit: 50, // 50/50 split by default
    activeTest: false
  }
};

const colorPresets = [
  { name: 'Dark Gray', bg: '#1f2937', text: '#ffffff' },
  { name: 'Blue', bg: '#1e40af', text: '#ffffff' },
  { name: 'Green', bg: '#059669', text: '#ffffff' },
  { name: 'Purple', bg: '#7c3aed', text: '#ffffff' },
  { name: 'Red', bg: '#dc2626', text: '#ffffff' },
  { name: 'Orange', bg: '#ea580c', text: '#ffffff' },
  { name: 'Yellow', bg: '#d97706', text: '#ffffff' },
  { name: 'Light', bg: '#f3f4f6', text: '#111827' },
];

const sizeOptions = [
  { value: 'small', label: 'Small (Banner)', description: '320x100px' },
  { value: 'medium', label: 'Medium (Card)', description: '400x200px' },
  { value: 'large', label: 'Large (Hero)', description: '800x300px' }
];

const targetAudienceOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'business_owners', label: 'Business Owners' },
  { value: 'customers', label: 'Customers' },
  { value: 'new_users', label: 'New Users' },
  { value: 'returning_users', label: 'Returning Users' }
];

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'list' | 'analytics' | 'settings'>('list');
  const [copied, setCopied] = useState<string | null>(null);
  const [adSettings, setAdSettings] = useState<AdSettings>(defaultSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    fetchAds();
    fetchAdSettings();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      setError('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSettings = async () => {
    try {
      // In a real implementation, you would fetch settings from the database
      // For now, we'll just use the default settings
      
      // Simulating a fetch delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, you would fetch from a settings table
      // const { data, error } = await supabase
      //   .from('ad_settings')
      //   .select('*')
      //   .single();
      
      // if (error) throw error;
      // if (data) setAdSettings(data.settings);
    } catch (err) {
      console.error('Failed to fetch ad settings:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
    setError(null);
  };

  const handleColorPreset = (bg: string, text: string) => {
    setFormData(prev => ({ 
      ...prev, 
      background_color: bg, 
      text_color: text 
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `ad-${Date.now()}.${fileExt}`;
      const filePath = `ads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
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
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new ad
        const { error } = await supabase
          .from('ads')
          .insert({
            ...formData,
            is_active: false,
            impressions: 0,
            clicks: 0
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
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      link_url: ad.link_url,
      cta_text: ad.cta_text,
      background_color: ad.background_color,
      text_color: ad.text_color,
      position: ad.position,
      size: ad.size,
      target_audience: ad.target_audience,
      budget: ad.budget,
      start_date: ad.start_date,
      end_date: ad.end_date
    });
    setEditingId(ad.id);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
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

  const handleDuplicate = async (ad: Ad) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('ads')
        .insert({
          title: `${ad.title} (Copy)`,
          description: ad.description,
          image_url: ad.image_url,
          link_url: ad.link_url,
          cta_text: ad.cta_text,
          background_color: ad.background_color,
          text_color: ad.text_color,
          position: ad.position + 1,
          size: ad.size,
          target_audience: ad.target_audience,
          budget: ad.budget,
          start_date: ad.start_date,
          end_date: ad.end_date,
          is_active: false,
          impressions: 0,
          clicks: 0
        });

      if (error) throw error;
      
      fetchAds();
      onAdUpdate?.();
    } catch (err) {
      console.error('Failed to duplicate ad:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyAdCode = (ad: Ad) => {
    const adCode = `<div style="background-color: ${ad.background_color}; color: ${ad.text_color}; padding: 20px; border-radius: 8px; text-align: center;">
  <h3>${ad.title}</h3>
  <p>${ad.description}</p>
  <a href="${ad.link_url}" style="background: white; color: black; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${ad.cta_text}</a>
</div>`;
    
    navigator.clipboard.writeText(adCode);
    setCopied(ad.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const cancelForm = () => {
    setFormData(defaultForm);
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const calculateCTR = (ad: Ad) => {
    return ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
  };

  const calculateCPC = (ad: Ad) => {
    return ad.clicks > 0 ? (ad.budget / ad.clicks).toFixed(2) : '0.00';
  };

  // Handle settings changes
  const handleSettingChange = (
    section: keyof AdSettings, 
    field: string, 
    value: any
  ) => {
    setAdSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setSettingsSaved(false);
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would save to the database
      // For now, we'll just simulate a successful save
      
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, you would save to a settings table
      // const { error } = await supabase
      //   .from('ad_settings')
      //   .upsert({ settings: adSettings })
      
      // if (error) throw error;
      
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const renderAdPreview = () => (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-white font-medium mb-3">Preview</h4>
      <div 
        className={`rounded-lg p-4 text-center transition-all ${
          formData.size === 'small' ? 'max-w-xs' : 
          formData.size === 'medium' ? 'max-w-md' : 'max-w-2xl'
        }`}
        style={{ 
          backgroundColor: formData.background_color,
          color: formData.text_color 
        }}
      >
        <div className="flex items-center gap-4">
          {formData.image_url && (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={formData.image_url}
                alt="Ad preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-grow text-left">
            <h3 className="font-bold text-lg mb-2">{formData.title || 'Ad Title'}</h3>
            <p className="text-sm opacity-90 mb-3">{formData.description || 'Ad description will appear here'}</p>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{formData.cta_text}</span>
              <ExternalLink className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Ads</p>
              <p className="text-3xl font-bold text-white">{ads.length}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Ads</p>
              <p className="text-3xl font-bold text-white">{ads.filter(ad => ad.is_active).length}</p>
            </div>
            <Eye className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Impressions</p>
              <p className="text-3xl font-bold text-white">
                {ads.reduce((sum, ad) => sum + ad.impressions, 0).toLocaleString()}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Clicks</p>
              <p className="text-3xl font-bold text-white">
                {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Ad Performance</h3>
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{ad.title}</h4>
                  <p className="text-gray-400 text-sm">{ad.target_audience}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-white font-medium">{ad.impressions.toLocaleString()}</p>
                    <p className="text-gray-400">Impressions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{ad.clicks.toLocaleString()}</p>
                    <p className="text-gray-400">Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-400 font-medium">{calculateCTR(ad)}%</p>
                    <p className="text-gray-400">CTR</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-400 font-medium">${calculateCPC(ad)}</p>
                    <p className="text-gray-400">CPC</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {settingsSaved && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-500 flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Settings saved successfully</span>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <RotateCw className="h-6 w-6 text-blue-500" />
          Auto-rotation
        </h3>
        <p className="text-gray-400 mb-6">
          Automatically rotate ads based on performance metrics to optimize engagement and conversions.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-white">Enable Auto-rotation</span>
            <button
              onClick={() => handleSettingChange('autoRotation', 'enabled', !adSettings.autoRotation.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                adSettings.autoRotation.enabled ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  adSettings.autoRotation.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {adSettings.autoRotation.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rotation Interval
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={adSettings.autoRotation.interval}
                    onChange={(e) => handleSettingChange('autoRotation', 'interval', parseInt(e.target.value) || 24)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-400">hours</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  How often to rotate ads (1-168 hours)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rotation Metric
                </label>
                <select
                  value={adSettings.autoRotation.metric}
                  onChange={(e) => handleSettingChange('autoRotation', 'metric', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ctr">Click-Through Rate (CTR)</option>
                  <option value="impressions">Impressions</option>
                  <option value="random">Random</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Which metric to use when determining which ads to show more frequently
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="h-6 w-6 text-purple-500" />
          Frequency Capping
        </h3>
        <p className="text-gray-400 mb-6">
          Limit how often the same user sees a specific ad to prevent ad fatigue and improve user experience.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-white">Enable Frequency Capping</span>
            <button
              onClick={() => handleSettingChange('frequencyCapping', 'enabled', !adSettings.frequencyCapping.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                adSettings.frequencyCapping.enabled ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  adSettings.frequencyCapping.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {adSettings.frequencyCapping.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Impressions
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={adSettings.frequencyCapping.maxImpressions}
                    onChange={(e) => handleSettingChange('frequencyCapping', 'maxImpressions', parseInt(e.target.value) || 3)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="text-gray-400">impressions</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of times a user will see the same ad
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Period
                </label>
                <select
                  value={adSettings.frequencyCapping.timeframe}
                  onChange={(e) => handleSettingChange('frequencyCapping', 'timeframe', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Time period for the impression limit
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Layers className="h-6 w-6 text-yellow-500" />
          A/B Testing
        </h3>
        <p className="text-gray-400 mb-6">
          Test different ad variations to optimize performance and learn what resonates with your audience.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-white">Enable A/B Testing</span>
            <button
              onClick={() => handleSettingChange('abTesting', 'enabled', !adSettings.abTesting.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                adSettings.abTesting.enabled ? 'bg-yellow-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  adSettings.abTesting.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {adSettings.abTesting.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Traffic Split (Variant A)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="10"
                    value={adSettings.abTesting.trafficSplit}
                    onChange={(e) => handleSettingChange('abTesting', 'trafficSplit', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-white w-12 text-center">{adSettings.abTesting.trafficSplit}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Variant A: {adSettings.abTesting.trafficSplit}%</span>
                  <span>Variant B: {100 - adSettings.abTesting.trafficSplit}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white">Active Test Running</span>
                <button
                  onClick={() => handleSettingChange('abTesting', 'activeTest', !adSettings.abTesting.activeTest)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    adSettings.abTesting.activeTest ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      adSettings.abTesting.activeTest ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 inline animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Ad Management</h2>
          <p className="text-gray-400">Create and manage advertisements across the platform</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Ad
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('list')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'list'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Ad Listings
        </button>
        <button
          onClick={() => setSelectedTab('analytics')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'analytics'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setSelectedTab('settings')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'settings'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingId ? 'Edit Advertisement' : 'Create New Advertisement'}
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
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Ad title"
                />
              </div>

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
                placeholder="Ad description"
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ad Image
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-white transition-colors"
                    >
                      {uploadingImage ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                          <span className="text-sm text-gray-400">Uploading...</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-400">Upload image</span>
                        </div>
                      )}
                    </label>
                    <input
                      type="text"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleFormChange}
                      placeholder="Or enter image URL"
                      className="w-full mt-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  {formData.image_url ? (
                    <div className="h-32 rounded-lg overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt="Ad preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x200/1f2937/ffffff?text=Image+Error';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad Size
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  {sizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.description})
                    </option>
                  ))}
                </select>
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
                  min="1"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Audience
                </label>
                <select
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  {targetAudienceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleFormChange}
                    min="0"
                    step="10"
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
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
            {renderAdPreview()}

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

      {/* Content based on selected tab */}
      {selectedTab === 'list' && (
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
                        <h3 className="text-lg font-bold text-white">{ad.title}</h3>
                        {ad.is_active && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            Active
                          </span>
                        )}
                        {!ad.is_active && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                            Inactive
                          </span>
                        )}
                        {new Date(ad.end_date) < new Date() && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                            Expired
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-300 mb-3">{ad.description}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <ExternalLink className="h-4 w-4" />
                        <span>Links to: {ad.link_url}</span>
                        <span>({ad.cta_text})</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Size</p>
                          <p className="text-white">{ad.size.charAt(0).toUpperCase() + ad.size.slice(1)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Position</p>
                          <p className="text-white">{ad.position}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Target</p>
                          <p className="text-white">{ad.target_audience}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Budget</p>
                          <p className="text-white">${ad.budget}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <p className="text-gray-500">Impressions</p>
                          <p className="text-white">{ad.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Clicks</p>
                          <p className="text-white">{ad.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">CTR</p>
                          <p className="text-green-400">{calculateCTR(ad)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">CPC</p>
                          <p className="text-blue-400">${calculateCPC(ad)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <div 
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: ad.background_color }}
                        />
                        <div 
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: ad.text_color }}
                        />
                        <span className="text-xs text-gray-500">Color scheme</span>
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
                        onClick={() => handleDuplicate(ad)}
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => copyAdCode(ad)}
                        className={`p-2 rounded-lg transition-colors ${
                          copied === ad.id
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                        title="Copy embed code"
                      >
                        {copied === ad.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Code className="h-5 w-5" />
                        )}
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
      )}

      {selectedTab === 'analytics' && renderAnalytics()}
      {selectedTab === 'settings' && renderSettings()}
    </div>
  );
};

export default AdManagement;

// Code component for the copy button
const Code = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);