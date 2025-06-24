import React, { useState, useEffect } from 'react';
import { Business, BusinessCategory, BusinessCategoryLabels, BusinessTag, BusinessTagLabels } from '../../types';
import { Mail, Globe, Phone, Building2, MapPin, Video, Tags } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../../lib/supabase';
import { extractVideoSrc } from '../../utils/videoUtils';

interface BusinessFormProps {
  business: Business;
  onSubmit: (data: Partial<Business>) => Promise<void>;
  onCancel: () => void;
}

interface TagOption {
  value: BusinessTag;
  label: string;
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  theBlackTube?: string;
  fanbase?: string;
  [key: string]: string | undefined;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ business, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Business>>({
    name: business.name,
    tagline: business.tagline,
    description: business.description,
    category: business.category,
    website_url: business.website_url,
    phone: business.phone,
    email: business.email,
    city: business.city,
    state: business.state,
    zip_code: business.zip_code,
    country: business.country,
    tags: business.tags || [],
    promo_video_url: business.promo_video_url,
    social_links: business.social_links || {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxTagsAllowed, setMaxTagsAllowed] = useState(5);
  const [isPremiumPlan, setIsPremiumPlan] = useState(false);

  // Fetch subscription plan details to determine tag limits and premium features
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        if (business.subscription_id) {
          const { data, error } = await supabase
            .from('subscriptions')
            .select(`
              id,
              plan_id,
              subscription_plans(
                name,
                image_limit,
                category_limit,
                features
              )
            `)
            .eq('id', business.subscription_id)
            .single();

          if (error) throw error;

          if (data && data.subscription_plans) {
            const plan = data.subscription_plans;
            
            // Set max tags allowed based on plan
            if (plan.name === 'Enhanced' || plan.name === 'VIP Plan') {
              setMaxTagsAllowed(20);
              setIsPremiumPlan(true);
            } else {
              setMaxTagsAllowed(5);
              setIsPremiumPlan(false);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching subscription details:', err);
      }
    };

    fetchSubscriptionDetails();
  }, [business.subscription_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If this is the promo video URL field, extract the src from iframe if present
    if (name === 'promo_video_url') {
      const extractedSrc = extractVideoSrc(value);
      setFormData(prev => ({ ...prev, [name]: extractedSrc }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError(null);
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...(prev.social_links as SocialLinks || {}),
        [name]: value
      }
    }));
    setError(null);
  };

  const handleTagChange = (selectedOptions: readonly TagOption[]) => {
    // Limit tags based on subscription plan
    const newTags = selectedOptions.slice(0, maxTagsAllowed).map(option => option.value);
    setFormData(prev => ({ ...prev, tags: newTags }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.name?.trim()) {
      setError('Business name is required');
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      setLoading(false);
      return;
    }

    if (!formData.email?.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business');
    } finally {
      setLoading(false);
    }
  };

  // Get available tags as options for react-select
  const tagOptions = Object.entries(BusinessTagLabels).map(([value, label]) => ({
    value: value as BusinessTag,
    label,
  }));

  // Sort categories alphabetically by label
  const sortedCategories = Object.entries(BusinessCategoryLabels)
    .sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-white mb-6">Edit Business</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-gray-300 mb-2">
              Tagline
            </label>
            <input
              type="text"
              id="tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {sortedCategories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (max {maxTagsAllowed})
            </label>
            <div className="relative">
              <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <Select
                isMulti
                value={(formData.tags || []).map(tag => ({
                  value: tag,
                  label: BusinessTagLabels[tag],
                }))}
                onChange={handleTagChange}
                options={tagOptions}
                placeholder={`Select up to ${maxTagsAllowed} tags`}
                classNames={{
                  control: (state) => 
                    `!bg-gray-800 !border-gray-700 !rounded-lg !text-white !pl-10 !min-h-[46px] ${
                      state.isFocused ? '!ring-2 !ring-white !border-transparent' : ''
                    }`,
                  menu: () => "!bg-gray-800 !border !border-gray-700 !rounded-lg !mt-1",
                  menuList: () => "!p-1",
                  option: (state) => 
                    `!px-3 !py-2 !rounded-md ${
                      state.isFocused 
                        ? '!bg-gray-700 !text-white' 
                        : '!bg-gray-800 !text-gray-300'
                    }`,
                  multiValue: () => "!bg-gray-700 !rounded-md !my-1",
                  multiValueLabel: () => "!text-white !px-2 !py-1",
                  multiValueRemove: () => "!text-gray-300 hover:!text-white hover:!bg-gray-600 !rounded-r-md !px-2",
                  placeholder: () => "!text-gray-400",
                  input: () => "!text-white",
                  indicatorsContainer: () => "!text-gray-400",
                  clearIndicator: () => "hover:!text-white !cursor-pointer",
                  dropdownIndicator: () => "hover:!text-white !cursor-pointer",
                }}
                isDisabled={(formData.tags || []).length >= maxTagsAllowed}
              />
            </div>
            <p className="mt-2 text-sm text-gray-400">
              {(formData.tags || []).length}/{maxTagsAllowed} tags selected
            </p>
          </div>

          <div>
            <label htmlFor="website_url" className="block text-sm font-medium text-gray-300 mb-2">
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-300 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
              Country
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          {/* Premium Features - Only show for Enhanced and VIP plans */}
          {isPremiumPlan && (
            <>
              <div className="border-t border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-medium text-white mb-4">Premium Features</h3>
                
                <div>
                  <label htmlFor="promo_video_url" className="block text-sm font-medium text-gray-300 mb-2">
                    Promo Video URL
                  </label>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="promo_video_url"
                      name="promo_video_url"
                      value={formData.promo_video_url || ''}
                      onChange={handleChange}
                      className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="https://theblacktube.com/embed/D1UMvOIf9Fzqjfj"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add a promo video URL from The BlackTube or other video platforms
                  </p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Social Media Links
                  </label>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="facebook" className="block text-xs text-gray-400 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={(formData.social_links as SocialLinks)?.facebook || ''}
                        onChange={handleSocialLinkChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="https://facebook.com/yourbusiness"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="instagram" className="block text-xs text-gray-400 mb-1">
                        Instagram
                      </label>
                      <input
                        type="url"
                        id="instagram"
                        name="instagram"
                        value={(formData.social_links as SocialLinks)?.instagram || ''}
                        onChange={handleSocialLinkChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="https://instagram.com/yourbusiness"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="twitter" className="block text-xs text-gray-400 mb-1">
                        Twitter
                      </label>
                      <input
                        type="url"
                        id="twitter"
                        name="twitter"
                        value={(formData.social_links as SocialLinks)?.twitter || ''}
                        onChange={handleSocialLinkChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="https://twitter.com/yourbusiness"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="linkedin" className="block text-xs text-gray-400 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={(formData.social_links as SocialLinks)?.linkedin || ''}
                        onChange={handleSocialLinkChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="https://linkedin.com/company/yourbusiness"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="theBlackTube" className="block text-xs text-gray-400 mb-1">
                        The BlackTube
                      </label>
                      <input
                        type="url"
                        id="theBlackTube"
                        name="theBlackTube"
                        value={(formData.social_links as SocialLinks)?.theBlackTube || ''}
                        onChange={handleSocialLinkChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="https://theblacktube.com/yourbusiness"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="fanbase" className="block text-xs text-gray-400 mb-1">
                        Fanbase
                      </label>
                      <input
                        type="url"
                        id="fanbase"
                        name="fanbase"
                        value={(formData.social_links as SocialLinks)?.fanbase || ''}
                        onChange={handleSocialLinkChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="https://fanbase.app/yourbusiness"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessForm;