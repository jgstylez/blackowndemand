import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PaymentModal from '../components/payment/PaymentModal';
import { ArrowLeft, ArrowRight, Building2, MapPin, Mail, Phone, Globe, Camera, Tags, Video, Link as LinkIcon, Facebook, Instagram, Twitter, Linkedin, Star, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BusinessCategory, BusinessCategoryLabels, BusinessTag, BusinessTagLabels } from '../types';
import Select from 'react-select';
import { debounce } from 'lodash';
import DuplicateBusinessModal from '../components/business/DuplicateBusinessModal';
import DiscountCodeInput, { DiscountInfo } from '../components/payment/DiscountCodeInput';
import { extractVideoSrc } from '../utils/videoUtils';

type Step = 'payment' | 'info' | 'location' | 'media' | 'premium_features' | 'summary';

interface TagOption {
  value: BusinessTag;
  label: string;
}

interface Business {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  email?: string;
  migration_source?: string;
  claimed_at?: string | null;
}

const BusinessListingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract both planPrice and planName from location state
  const planPrice = location.state?.planPrice;
  const planName = location.state?.planName;
  const paymentCompleted = location.state?.paymentCompleted || false;
  const businessIdToUpdate = location.state?.businessIdToUpdate || null;
  
  console.log('Initial planPrice:', planPrice); // Log initial planPrice
  console.log('Payment completed:', paymentCompleted);
  console.log('Business ID to update:', businessIdToUpdate);
  
  // Determine if premium features should be shown based on plan name
  const isPremiumPlan = planName === 'Enhanced' || planName === 'VIP Plan';
  
  // Define steps array dynamically based on plan type and payment status
  const steps = useMemo<Step[]>(() => {
    const baseSteps: Step[] = [];
    
    // Add payment step first if payment is not completed
    if (!paymentCompleted) {
      baseSteps.push('payment');
    }
    
    // Add other steps after payment
    baseSteps.push('info', 'location', 'media');
    
    // Add premium_features step only for Enhanced and VIP plans
    if (isPremiumPlan) {
      baseSteps.push('premium_features');
    }
    
    // Add summary step before payment
    baseSteps.push('summary');
    
    return baseSteps;
  }, [isPremiumPlan, paymentCompleted]);
  
  // Set initial step based on payment status
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [nameCheckPerformed, setNameCheckPerformed] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number>(planPrice || 0);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    category: '',
    tags: [] as BusinessTag[],
    email: '',
    phone: '',
    website: '',
    city: '',
    state: '',
    region: '',
    country: '',
    postalCode: '',
    imageUrl: '',
    promoVideoUrl: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      theBlackTube: '',
      fanbase: ''
    }
  });

  // Determine max tags allowed based on plan
  const maxTagsAllowed = useMemo(() => {
    if (planName === 'Enhanced' || planName === 'VIP Plan') {
      return 20;
    }
    return 5;
  }, [planName]);

  // Check if we need to load an existing business
  useEffect(() => {
    if (businessIdToUpdate) {
      fetchBusinessToUpdate();
    }
  }, [businessIdToUpdate]);

  // Fetch business data if we're updating an existing business
  const fetchBusinessToUpdate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessIdToUpdate)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Populate form data with existing business data
        setFormData({
          name: data.name || '',
          tagline: data.tagline || '',
          description: data.description || '',
          category: data.category || '',
          tags: data.tags || [],
          email: data.email || '',
          phone: data.phone || '',
          website: data.website_url || '',
          city: data.city || '',
          state: data.state || '',
          region: '',
          country: data.country || '',
          postalCode: data.zip_code || '',
          imageUrl: data.image_url || '',
          promoVideoUrl: data.promo_video_url || '',
          socialLinks: data.social_links || {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
            theBlackTube: '',
            fanbase: ''
          }
        });
      }
    } catch (err) {
      console.error('Error fetching business:', err);
      setError('Failed to load business data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If this is the promo video URL field, extract the src from iframe if present
    if (name === 'promoVideoUrl') {
      const extractedSrc = extractVideoSrc(value);
      setFormData(prev => ({ ...prev, [name]: extractedSrc }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value
      }
    }));
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  // Get available tags based on selected category
  const availableTags = useMemo(() => {
    if (!formData.category) {
      // If no category selected, show all tags
      return Object.entries(BusinessTagLabels).map(([value, label]) => ({
        value: value as BusinessTag,
        label,
      }));
    }

    // Map categories to their related tags
    const categoryTagMap: Record<string, BusinessTag[]> = {
      'Arts, Crafts & Party Supplies': [
        BusinessTag.ART_SUPPLIES,
        BusinessTag.PARTY_SUPPLIES,
        BusinessTag.CUSTOM_INVITATIONS,
        BusinessTag.KIDS_CRAFTS,
        BusinessTag.SEASONAL_CRAFTS,
        BusinessTag.PAINT_BRUSHES,
        BusinessTag.CANVAS_BOARDS,
        BusinessTag.GLUE_GLITTER,
        BusinessTag.DIY_KITS,
        BusinessTag.CRAFT_CLASSES
      ],
      'Auto, Tires & Industrial': [
        BusinessTag.CAR_PARTS,
        BusinessTag.AUTO_ACCESSORIES,
        BusinessTag.MOTOR_OIL,
        BusinessTag.TIRE_SERVICES,
        BusinessTag.CAR_AUDIO,
        BusinessTag.CAR_WASH_KITS,
        BusinessTag.GARAGE_EQUIPMENT,
        BusinessTag.REPAIR_TOOLS,
        BusinessTag.JUMP_STARTERS,
        BusinessTag.LED_HEADLIGHTS
      ],
      'Baby': [
        BusinessTag.BABY_CLOTHES,
        BusinessTag.STROLLERS_CAR_SEATS,
        BusinessTag.DIAPERS_WIPES,
        BusinessTag.NURSERY_DECOR,
        BusinessTag.BABY_MONITORS,
        BusinessTag.FEEDING_SETS,
        BusinessTag.TEETHING_TOYS,
        BusinessTag.CRIBS_BASSINETS,
        BusinessTag.MATERNITY_WEAR,
        BusinessTag.BABY_BOOKS
      ],
      'Beauty & Cosmetics': [
        BusinessTag.SKINCARE_SETS,
        BusinessTag.LIPSTICKS,
        BusinessTag.FRAGRANCES_PERFUME,
        BusinessTag.HAIR_STYLING_TOOLS,
        BusinessTag.NAIL_POLISH,
        BusinessTag.FACIAL_MASKS,
        BusinessTag.MAKEUP_BRUSHES,
        BusinessTag.ORGANIC_BEAUTY,
        BusinessTag.BARBER_KITS,
        BusinessTag.EYEBROW_KITS
      ],
      'Clothing, Shoes & Accessories': [
        BusinessTag.WOMENS_FASHION,
        BusinessTag.MENSWEAR,
        BusinessTag.SNEAKERS,
        BusinessTag.FASHION_ACCESSORIES,
        BusinessTag.DESIGNER_BAGS,
        BusinessTag.JEWELRY_SETS,
        BusinessTag.PLUS_SIZE_WEAR,
        BusinessTag.HATS_SCARVES,
        BusinessTag.DENIM_WEAR,
        BusinessTag.KIDS_FASHION
      ],
      'Electronics': [
        BusinessTag.LAPTOPS_COMPUTERS,
        BusinessTag.SMARTPHONES,
        BusinessTag.BLUETOOTH_SPEAKERS,
        BusinessTag.TV_MONITORS,
        BusinessTag.HOME_SECURITY_CAMS,
        BusinessTag.VIDEO_DOORBELLS,
        BusinessTag.GAMING_CONSOLES,
        BusinessTag.HEADPHONES,
        BusinessTag.CHARGING_STATIONS,
        BusinessTag.TECH_ACCESSORIES
      ],
      'Exercise & Fitness': [
        BusinessTag.DUMBBELLS,
        BusinessTag.YOGA_MATS,
        BusinessTag.RESISTANCE_BANDS,
        BusinessTag.STATIONARY_BIKES,
        BusinessTag.PROTEIN_SHAKES,
        BusinessTag.FOAM_ROLLERS,
        BusinessTag.HOME_GYMS,
        BusinessTag.FITNESS_TIMERS,
        BusinessTag.GYM_CLOTHES,
        BusinessTag.BODYWEIGHT_BARS
      ],
      'Food & Beverage': [
        BusinessTag.GOURMET_SNACKS,
        BusinessTag.MEAL_KITS,
        BusinessTag.ETHNIC_FOODS,
        BusinessTag.COFFEE_BLENDS,
        BusinessTag.VEGAN_TREATS,
        BusinessTag.COOKING_INGREDIENTS,
        BusinessTag.ARTISAN_BREAD,
        BusinessTag.SPICES_RUBS,
        BusinessTag.SHELF_STABLE_MEALS,
        BusinessTag.BEVERAGE_VARIETY
      ],
      'Furniture & Appliances': [
        BusinessTag.SOFAS,
        BusinessTag.DINING_TABLES,
        BusinessTag.MICROWAVES,
        BusinessTag.REFRIGERATORS,
        BusinessTag.BED_FRAMES,
        BusinessTag.CLOSET_ORGANIZERS,
        BusinessTag.TV_STANDS,
        BusinessTag.WASHER_DRYER_SETS,
        BusinessTag.OTTOMANS,
        BusinessTag.FUTON_COUCHES
      ],
      'Grocery': [
        BusinessTag.ORGANIC_VEGGIES,
        BusinessTag.PANTRY_ITEMS,
        BusinessTag.FROZEN_GOODS,
        BusinessTag.DELI_ITEMS,
        BusinessTag.DAIRY_EGGS,
        BusinessTag.SNACK_PACKS,
        BusinessTag.BAKING_GOODS,
        BusinessTag.GROCERY_BUNDLES,
        BusinessTag.CEREAL_BOXES,
        BusinessTag.GRAINS_LEGUMES
      ]
    };

    // Get tags for the selected category
    const categoryTags = categoryTagMap[formData.category] || [];
    
    return categoryTags.map(tag => ({
      value: tag,
      label: BusinessTagLabels[tag],
    }));
  }, [formData.category]);

  const handleTagChange = (selectedOptions: readonly TagOption[]) => {
    // Use maxTagsAllowed instead of hardcoded 5
    const newTags = selectedOptions.slice(0, maxTagsAllowed).map(option => option.value);
    setFormData(prev => ({ ...prev, tags: newTags }));
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `business-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      
      // Clear error when user uploads an image
      if (error) {
        setError(null);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    }
  };

  const handlePaymentClick = () => {
    console.log('handlePaymentClick - discountedAmount before opening modal:', discountedAmount);
    setShowPaymentModal(true);
  };

  const handleApplyDiscount = (info: DiscountInfo) => {
    setDiscountInfo(info);
    
    // Calculate discounted amount
    if (info.valid && info.discountType && info.discountValue) {
      let newAmount = planPrice;
      
      if (info.discountType === 'percentage') {
        // Apply percentage discount
        const discountAmount = (planPrice * info.discountValue) / 100;
        newAmount = planPrice - discountAmount;
      } else if (info.discountType === 'fixed') {
        // Apply fixed discount
        newAmount = planPrice - info.discountValue;
      }
      
      // Ensure amount doesn't go below zero
      const finalAmount = Math.max(0, newAmount);
      console.log('handleApplyDiscount - calculated newAmount:', newAmount, 'finalAmount:', finalAmount);
      setDiscountedAmount(finalAmount);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountInfo(null);
    setDiscountedAmount(planPrice);
    console.log('handleRemoveDiscount - reset to planPrice:', planPrice);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setLoading(true);
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create a subscription record first
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          plan_id: await getPlanIdByName(planName),
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          payment_status: 'paid'
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        throw subscriptionError;
      }

      console.log('Subscription created successfully:', subscriptionData);

      // Create a minimal business record
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: 'Pending Business Listing',
          owner_id: user.id,
          subscription_id: subscriptionData.id,
          is_active: false, // Initially inactive until details are filled
          is_verified: true // Set is_verified to true by default for new businesses
        })
        .select()
        .single();

      if (businessError) {
        console.error('Error creating business:', businessError);
        throw businessError;
      }

      console.log('Initial business record created:', businessData);

      // Store the business ID for updating later
      const newBusinessId = businessData.id;

      // Close payment modal
      setShowPaymentModal(false);

      // Save payment info to session storage for persistence
      sessionStorage.setItem('paymentCompleted', 'true');
      sessionStorage.setItem('businessIdToUpdate', newBusinessId);
      sessionStorage.setItem('planName', planName || '');
      sessionStorage.setItem('planPrice', planPrice?.toString() || '0');

      // Update location state and move to the next step
      navigate('/business/new', { 
        state: { 
          paymentCompleted: true,
          businessIdToUpdate: newBusinessId,
          planName,
          planPrice
        },
        replace: true
      });

      // Move to the info step
      setCurrentStep('info');
    } catch (error) {
      console.error('Error in payment success handler:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get plan ID by name
  const getPlanIdByName = async (planName: string | undefined): Promise<string> => {
    if (!planName) throw new Error('Plan name is required');
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', planName)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error(`Plan not found: ${planName}`);
    
    return data.id;
  };

  // Debounced function to check for similar businesses
  const checkForSimilarBusinesses = useMemo(
    () => debounce(async (businessName: string) => {
      if (!businessName || businessName.length < 3) return;
      
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, description, email, image_url, migration_source, claimed_at')
          .ilike('name', `%${businessName}%`)
          .limit(5);
        
        if (error) {
          console.error('Error checking for similar businesses:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setSimilarBusinesses(data);
          setShowDuplicateModal(true);
        } else {
          setNameCheckPerformed(true);
        }
      } catch (err) {
        console.error('Error checking for similar businesses:', err);
      }
    }, 500),
    []
  );

  // Check for similar businesses when the name field loses focus
  const handleNameBlur = () => {
    if (formData.name && formData.name.length >= 3 && !nameCheckPerformed) {
      checkForSimilarBusinesses(formData.name);
    }
  };

  // Clear the debounce on unmount
  useEffect(() => {
    return () => {
      checkForSimilarBusinesses.cancel();
    };
  }, [checkForSimilarBusinesses]);

  // Check for saved data in session storage on component mount
  useEffect(() => {
    const savedPaymentCompleted = sessionStorage.getItem('paymentCompleted') === 'true';
    const savedBusinessId = sessionStorage.getItem('businessIdToUpdate');
    const savedPlanName = sessionStorage.getItem('planName');
    const savedPlanPrice = sessionStorage.getItem('planPrice');
    
    // If we have saved data and no location state, restore from session storage
    if (savedPaymentCompleted && savedBusinessId && !location.state) {
      navigate('/business/new', { 
        state: { 
          paymentCompleted: true,
          businessIdToUpdate: savedBusinessId,
          planName: savedPlanName,
          planPrice: savedPlanPrice ? parseFloat(savedPlanPrice) : undefined
        },
        replace: true
      });
    }
  }, []);

  // Sort categories alphabetically by label
  const sortedCategories = Object.entries(BusinessCategoryLabels)
    .sort((a, b) => a[1].localeCompare(b[1]));

  // Validation functions for each step
  const validateInfoStep = (): boolean => {
    if (!formData.name.trim()) {
      setError('Business name is required');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Business description is required');
      return false;
    }
    
    if (!formData.category) {
      setError('Please select a business category');
      return false;
    }
    
    return true;
  };

  const validateLocationStep = (): boolean => {
    if (!formData.country.trim()) {
      setError('Country is required');
      return false;
    }
    
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    
    if (!formData.state.trim()) {
      setError('State/Province/Region is required');
      return false;
    }
    
    if (!formData.postalCode.trim()) {
      setError('Postal code is required');
      return false;
    }
    
    return true;
  };

  const validateMediaStep = (): boolean => {
    if (!formData.imageUrl) {
      setError('Business image is required');
      return false;
    }
    
    if (!formData.website.trim()) {
      setError('Website URL is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Business email is required');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Business phone is required');
      return false;
    }
    
    // Basic URL validation
    if (!formData.website.startsWith('http://') && !formData.website.startsWith('https://')) {
      setError('Website URL must start with http:// or https://');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  // Function to submit the final business data
  const submitBusinessData = async () => {
    if (!businessIdToUpdate) {
      setError('No business ID found. Please restart the process.');
      return false;
    }

    try {
      setLoading(true);

      // Prepare business data with social links and promo video if applicable
      const businessData = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        category: formData.category,
        city: formData.city,
        state: formData.state,
        zip_code: formData.postalCode,
        country: formData.country || 'USA',
        website_url: formData.website,
        phone: formData.phone,
        email: formData.email,
        image_url: formData.imageUrl,
        tags: formData.tags,
        is_active: true, // Now activate the business
        // Only include premium features for Enhanced and VIP plans
        ...(isPremiumPlan && {
          promo_video_url: formData.promoVideoUrl,
          social_links: formData.socialLinks
        })
      };

      console.log('Updating business data:', businessData);

      const { error: updateError } = await supabase
        .from('businesses')
        .update(businessData)
        .eq('id', businessIdToUpdate);

      if (updateError) {
        console.error('Error updating business:', updateError);
        throw updateError;
      }

      console.log('Business updated successfully');
      
      // Clear session storage
      sessionStorage.removeItem('paymentCompleted');
      sessionStorage.removeItem('businessIdToUpdate');
      sessionStorage.removeItem('planName');
      sessionStorage.removeItem('planPrice');

      // Redirect to dashboard
      navigate('/dashboard', { 
        state: { 
          newBusiness: true, 
          businessId: businessIdToUpdate,
          businessName: formData.name
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating business:', error);
      setError('Failed to update business. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle next button click with validation
  const handleNextStep = () => {
    // Get the current step index
    const currentStepIndex = steps.indexOf(currentStep);
    
    // Validate the current step
    let isValid = true;
    
    switch (currentStep) {
      case 'info':
        isValid = validateInfoStep();
        break;
      case 'location':
        isValid = validateLocationStep();
        break;
      case 'media':
        isValid = validateMediaStep();
        break;
      case 'summary':
        // For summary step, submit the business data
        isValid = submitBusinessData();
        return; // Return early as submitBusinessData handles navigation
      // No validation for premium_features or payment steps
      default:
        isValid = true;
    }
    
    // Only proceed if validation passes
    if (isValid) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'info':
        return (
          <div className="space-y-6">
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
                  onBlur={handleNameBlur}
                  className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Your business name"
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
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="A short, catchy description"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Tell us about your business"
                required
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
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {sortedCategories.map(([value, label]) => (
                  <option key={value} value={label}>
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
                  value={formData.tags.map(tag => ({
                    value: tag,
                    label: BusinessTagLabels[tag],
                  }))}
                  onChange={handleTagChange}
                  options={availableTags}
                  placeholder={`Select up to ${maxTagsAllowed} tags`}
                  classNames={{
                    control: (state) => 
                      `!bg-gray-900 !border-gray-700 !rounded-lg !text-white !pl-10 !min-h-[46px] ${
                        state.isFocused ? '!ring-2 !ring-white !border-transparent' : ''
                      }`,
                    menu: () => "!bg-gray-900 !border !border-gray-700 !rounded-lg !mt-1",
                    menuList: () => "!p-1",
                    option: (state) => 
                      `!px-3 !py-2 !rounded-md ${
                        state.isFocused 
                          ? '!bg-gray-800 !text-white' 
                          : '!bg-gray-900 !text-gray-300'
                      }`,
                    multiValue: () => "!bg-gray-800 !rounded-md !my-1",
                    multiValueLabel: () => "!text-white !px-2 !py-1",
                    multiValueRemove: () => "!text-gray-300 hover:!text-white hover:!bg-gray-600 !rounded-r-md !px-2",
                    placeholder: () => "!text-gray-400",
                    input: () => "!text-white",
                    indicatorsContainer: () => "!text-gray-400",
                    clearIndicator: () => "hover:!text-white !cursor-pointer",
                    dropdownIndicator: () => "hover:!text-white !cursor-pointer",
                  }}
                  isDisabled={formData.tags.length >= maxTagsAllowed}
                  noOptionsMessage={() => formData.category ? "No tags available for this category" : "Please select a category first"}
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {formData.tags.length}/{maxTagsAllowed} tags selected
                {!formData.category && (
                  <span className="block text-yellow-400 text-sm mt-1">
                    Select a category to see relevant tags
                  </span>
                )}
              </p>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Country"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="City"
                required
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">
                State/Province/Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="State, Province, or Region"
                required
              />
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-2">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Postal/ZIP Code"
                required
              />
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">
                Business Image <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  required={!formData.imageUrl}
                />
                <label
                  htmlFor="image"
                  className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-white transition-colors"
                >
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Business"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <span className="mt-2 block text-sm text-gray-400">
                        Upload business image <span className="text-red-500">*</span>
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                Website URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Business Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="business@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Business Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="International format: +1234567890"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'premium_features':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Premium Features
              </h3>
              <p className="text-gray-400 text-sm">
                Your {planName} includes these additional features to enhance your business listing.
                All fields below are optional.
              </p>
            </div>

            <div>
              <label htmlFor="promoVideoUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Promo Video URL (Optional)
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="promoVideoUrl"
                  name="promoVideoUrl"
                  value={formData.promoVideoUrl}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://theblacktube.com/embed/D1UMvOIf9Fzqjfj"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Only videos are supported via The BlackTube. <a href="https://theblacktube.com/register?invite=3555839516347fbdc231f85.93072946&fbclid=PAQ0xDSwK4hiRleHRuA2FlbQIxMAABp57tcvmPj_ekt1TJm6y8xbmiIs1tWlp5uCBU-OUgm9em-7UI3H7jUkxtYl8j_aem_xI4s2OvmZ5so0LsrQoAUBQ" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Create an account here</a>, upload your video, then copy and paste the embed code in the input field above.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Social Media Links (Optional)
              </label>
              
              <div className="space-y-4">
                {/* Facebook */}
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="url"
                    name="facebook"
                    value={formData.socialLinks.facebook}
                    onChange={handleSocialLinkChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://facebook.com/yourbusiness"
                  />
                </div>
                
                {/* Instagram */}
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="url"
                    name="instagram"
                    value={formData.socialLinks.instagram}
                    onChange={handleSocialLinkChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://instagram.com/yourbusiness"
                  />
                </div>
                
                {/* Twitter */}
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="url"
                    name="twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleSocialLinkChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://twitter.com/yourbusiness"
                  />
                </div>
                
                {/* LinkedIn */}
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleSocialLinkChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://linkedin.com/company/yourbusiness"
                  />
                </div>
                
                {/* The BlackTube */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg 
                      viewBox="0 0 24 24" 
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M21.582 7.15c-.239-2.012-.978-3.707-2.889-3.889C16.375 3.017 13.692 3 12.001 3h-.002c-1.691 0-4.374.017-6.692.261-1.911.182-2.65 1.877-2.889 3.889C2.167 9.215 2 11.515 2 13.612v.776c0 2.097.167 4.397.418 6.462.239 2.012.978 3.707 2.889 3.889 2.318.244 5.001.261 6.692.261h.002c1.691 0 4.374-.017 6.692-.261 1.911-.182 2.65-1.877 2.889-3.889.251-2.065.418-4.365.418-6.462v-.776c0-2.097-.167-4.397-.418-6.462zM9.5 16.5v-9l7 4.5-7 4.5z"/>
                    </svg>
                  </div>
                  <input
                    type="url"
                    name="theBlackTube"
                    value={formData.socialLinks.theBlackTube}
                    onChange={handleSocialLinkChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://theblacktube.com/yourbusiness"
                  />
                </div>
                
                {/* Fanbase */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg 
                      viewBox="0 0 512 512" 
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" clipRule="evenodd" d="M199.7,62.7l-93.4,246.3h33.9l-58.8,147l155.2-196.6h-25l28.5-49.4H284l34.9-41.8h-53.7l25.7-39h78l61.9-66.4H199.7z" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    name="fanbase"
                    value={formData.socialLinks.fanbase}
                    onChange={handleSocialLinkChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://fanbase.app/yourbusiness"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <h3 className="text-white font-medium mb-2">Business Summary</h3>
              <p className="text-gray-400 text-sm mb-4">
                Please review your business information before submitting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Business Details</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">Name:</span>
                    <p className="text-white">{formData.name}</p>
                  </div>
                  {formData.tagline && (
                    <div>
                      <span className="text-gray-400 text-sm">Tagline:</span>
                      <p className="text-white">{formData.tagline}</p>
                    </div>
                  )}
                  {formData.category && (
                    <div>
                      <span className="text-gray-400 text-sm">Category:</span>
                      <p className="text-white">{formData.category}</p>
                    </div>
                  )}
                  {formData.tags.length > 0 && (
                    <div>
                      <span className="text-gray-400 text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-800 rounded-full text-xs text-white">
                            {BusinessTagLabels[tag]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Contact Information</h4>
                <div className="space-y-2">
                  {formData.email && (
                    <div>
                      <span className="text-gray-400 text-sm">Email:</span>
                      <p className="text-white">{formData.email}</p>
                    </div>
                  )}
                  {formData.phone && (
                    <div>
                      <span className="text-gray-400 text-sm">Phone:</span>
                      <p className="text-white">{formData.phone}</p>
                    </div>
                  )}
                  {formData.website && (
                    <div>
                      <span className="text-gray-400 text-sm">Website:</span>
                      <p className="text-white">{formData.website}</p>
                    </div>
                  )}
                  {formData.city && formData.state && (
                    <div>
                      <span className="text-gray-400 text-sm">Location:</span>
                      <p className="text-white">{formData.city}, {formData.state} {formData.postalCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Plan Summary */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Subscription Plan</h3>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Annual Subscription - {planName}</span>
                <div className="text-right">
                  <span className="text-white">${planPrice}</span>
                  <p className="text-sm text-gray-500">
                    (${(planPrice / 12).toFixed(2)} per month)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between mt-2 border-t border-gray-700 pt-2">
                <span className="text-gray-400">Payment Status</span>
                <span className="text-green-400 font-medium">Paid</span>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Order Summary</h3>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Annual Subscription</span>
                <div className="text-right">
                  <span className={`${discountInfo?.valid ? 'line-through text-gray-500' : 'text-white'}`}>
                    ${planPrice}
                  </span>
                  <p className="text-sm text-gray-500">
                    (${(planPrice / 12).toFixed(2)} per month)
                  </p>
                </div>
              </div>
              
              {discountInfo?.valid && (
                <>
                  <div className="flex justify-between mb-4">
                    <span className="text-green-400">
                      {discountInfo.discountType === 'percentage' 
                        ? `Discount (${discountInfo.discountValue}%)` 
                        : 'Discount'}
                    </span>
                    <span className="text-green-400">
                      -${(planPrice - discountedAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white font-medium">${discountedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Discount Code */}
            <DiscountCodeInput 
              onApply={handleApplyDiscount}
              onRemove={handleRemoveDiscount}
              planName={planName}
            />

            <div>
              <button
                onClick={handlePaymentClick}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        );
    }
  };

  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStepIndex ? 'bg-white' : 'bg-gray-700'
                  }`}
                />
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gray-700" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white mb-8">
            {currentStep === 'payment' && 'Complete Payment'}
            {currentStep === 'info' && 'Business Information'}
            {currentStep === 'location' && 'Business Location'}
            {currentStep === 'media' && 'Media & Contact'}
            {currentStep === 'premium_features' && 'Premium Features'}
            {currentStep === 'summary' && 'Review & Submit'}
          </h1>

          {/* Error message display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(steps[currentStepIndex - 1])}
              disabled={currentStepIndex === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Previous
            </button>
            {currentStep !== 'payment' && (
              <button
                onClick={handleNextStep}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
              >
                {currentStep === 'summary' ? 'Submit' : 'Next'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          amount={discountedAmount}
          description={`Annual ${planName || "Business Listing"} subscription`}
          planName={planName || "Business Listing"}
          customerEmail={formData.email}
        />

        {/* Duplicate Business Modal */}
        <DuplicateBusinessModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          onContinue={() => {
            setShowDuplicateModal(false);
            setNameCheckPerformed(true);
          }}
          businesses={similarBusinesses}
        />
      </div>
    </Layout>
  );
};

export default BusinessListingPage;