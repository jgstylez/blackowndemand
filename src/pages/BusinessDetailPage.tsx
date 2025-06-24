import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Globe, Phone, Mail, Check, Share2, Heart, ChevronLeft, ChevronRight, Video, Crown, Star, Shield, CheckCircle } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Layout from '../components/layout/Layout';
import TipModal from '../components/business/TipModal';
import ShareModal from '../components/business/ShareModal';
import { supabase, getBusinessImageUrl } from '../lib/supabase';
import { logError } from '../lib/errorLogger';
import useErrorHandler from '../hooks/useErrorHandler';
import ErrorFallback from '../components/common/ErrorFallback';
import useFeatureFlag from '../hooks/useFeatureFlag';
import BookmarkButton from '../components/common/BookmarkButton';

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
  zip_code: string;
  country: string;
  website_url: string;
  phone: string;
  email: string;
  image_url: string;
  social_links: any;
  business_hours: any;
  amenities: string[];
  payment_methods: string[];
  created_at: string;
  subscription_id: string | null;
  subscription_plan_name?: string;
  promo_video_url: string | null;
  migration_source?: string;
  claimed_at?: string | null;
}

const BusinessDetailPage = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [businessImages, setBusinessImages] = useState<any[]>([]);
  
  // Feature flag for tip button
  const enableTipFeature = useFeatureFlag('enable_tip_feature', false);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'BusinessDetailPage',
    defaultMessage: 'Failed to load business details'
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        setLoading(true);
        clearError();
        
        // Use the RPC function to get business details
        const { data, error } = await supabase.rpc('get_businesses_with_plan_details', {
          p_business_id: id
        });

        if (error) throw error;
        
        if (!data || data.length === 0) {
          throw new Error('Business not found');
        }
        
        setBusiness(data[0]);

        // Fetch actual business images from business_images table
        const { data: images, error: imagesError } = await supabase
          .from('business_images')
          .select('*')
          .eq('business_id', id)
          .order('created_at', { ascending: true });

        if (imagesError) {
          logError('Failed to fetch business images', {
            context: 'BusinessDetailPage',
            metadata: { businessId: id, error: imagesError }
          });
        } else if (images) {
          setBusinessImages(images);
        }

        // Fetch similar businesses
        if (data[0]?.category) {
          const { data: similar, error: similarError } = await supabase.rpc('get_businesses_with_plan_details', {
            p_category: data[0].category,
            p_is_active: true,
            p_limit: 4
          });

          if (similarError) {
            logError('Failed to fetch similar businesses', {
              context: 'BusinessDetailPage',
              metadata: { businessId: id, category: data[0].category, error: similarError }
            });
          } else {
            // Filter out the current business
            const filteredSimilar = similar?.filter(b => b.id !== id) || [];
            setSimilarBusinesses(filteredSimilar);
          }
        }
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id, handleError, clearError]);

  // Helper function to check if business is unclaimed migrated business
  const isUnclaimedMigratedBusiness = () => {
    return !!business?.migration_source && !business?.claimed_at;
  };

  // Helper function to determine if premium content should be shown
  const shouldShowPremiumContent = () => {
    // Show premium content based on subscription plan
    return business?.subscription_plan_name === 'Enhanced' || 
           business?.subscription_plan_name === 'VIP Plan';
  };

  // Helper function to determine if image gallery should be shown
  const shouldShowImageGallery = () => {
    return business?.subscription_plan_name === 'Starter Plan' || 
           business?.subscription_plan_name === 'Enhanced' || 
           business?.subscription_plan_name === 'VIP Plan' || 
           business?.subscription_plan_name === 'Migrated';
  };

  // Helper function to determine if contact info should be shown
  const shouldShowContactInfo = () => {
    return business?.subscription_plan_name === 'Starter Plan' || 
           business?.subscription_plan_name === 'Enhanced' || 
           business?.subscription_plan_name === 'VIP Plan';
  };

  // Create gallery images based on available data
  const createGalleryImages = () => {
    const images = [];

    // Add main business image if available
    if (business?.image_url) {
      images.push({
        src: getBusinessImageUrl(business.image_url),
        alt: `${business.name} main image`
      });
    }

    // Add additional business images if available
    if (businessImages.length > 0) {
      businessImages.forEach((img, index) => {
        images.push({
          src: getBusinessImageUrl(img.url),
          alt: `${business?.name} gallery image ${index + 1}`
        });
      });
    }

    return images;
  };

  const galleryImages = createGalleryImages();
  const shouldShowGallery = shouldShowImageGallery() && galleryImages.length > 1;

  const imagesPerPage = 4;
  const totalPages = Math.ceil(galleryImages.length / imagesPerPage);
  const displayedImages = galleryImages.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleTipSubmit = async (amount: number) => {
    try {
      // Here you would integrate with your payment processing service
      console.log(`Processing tip of $${amount} for ${business?.name}`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      throw new Error('Failed to process payment');
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Function to mask email address
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(Math.max(1, localPart.length - 2))
      : localPart;
    
    return `${maskedLocal}@${domain}`;
  };

  // Determine if business is VIP or Legacy based on subscription plan
  const isVIP = business?.subscription_plan_name === 'VIP Plan';
  const isLegacy = business?.subscription_plan_name === 'Migrated';

  // Prepare SEO metadata
  const getBusinessLocation = () => {
    if (!business) return '';
    const parts = [business.city, business.state, business.country].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div>
                <div className="aspect-video bg-gray-800 rounded-xl mb-6" />
                <div className="h-12 bg-gray-800 rounded mb-4" />
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
              <div>
                <div className="bg-gray-800 rounded-xl p-6">
                  <div className="h-6 bg-gray-700 rounded mb-4" />
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error.hasError || !business) {
    return (
      <Layout 
        title="Business Not Found | BlackOWNDemand"
        description="The business you're looking for could not be found."
        noindex={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorFallback
            error={error.details}
            message={error.message || "Business not found"}
            resetErrorBoundary={() => {
              clearError();
              window.location.reload();
            }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${business.name} | BlackOWNDemand`}
      description={business.tagline || business.description?.substring(0, 160) || `${business.name} is a Black-owned business. Search for them on BlackOWNDemand.`}
      image={getBusinessImageUrl(business.image_url)}
      url={`/business/${business.id}`}
      type="business.business"
      businessName={business.name}
      businessCategory={business.category}
      businessLocation={getBusinessLocation()}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/browse" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to browse
        </Link>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column */}
          <div>
            {/* Main Image */}
            <div className="aspect-video w-full overflow-hidden rounded-xl mb-6">
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

            {/* Business Header - Combined name, badges, and share button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-white">{business.name}</h1>
                  {business.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                  {business.is_featured && (
                    <span className="inline-flex items-center px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                  {isVIP && (
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </span>
                  )}
                  {isLegacy && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-400/20 text-blue-400 rounded-full text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Legacy
                    </span>
                  )}
                </div>
                {business.tagline && (
                  <p className="text-xl text-gray-400">{business.tagline}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <BookmarkButton businessId={business.id} size={20} />
                <button 
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors flex-shrink-0"
                  title="Share this business"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Business Description */}
            <div className="mb-8">
              {business.description && (
                <p className="text-gray-400 mb-6">{business.description}</p>
              )}

              {/* Tip Button - Only show if feature flag is enabled */}
              {enableTipFeature && (
                <div className="mb-6">
                  <button 
                    onClick={() => setIsTipModalOpen(true)}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Tip this Business
                  </button>
                </div>
              )}
            </div>

            {/* Categories & Tags */}
            {business.category && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-white mb-4">Category</h2>
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                    {business.category}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {/* Promo Video Section */}
            {isUnclaimedMigratedBusiness() ? (
              // Unclaimed migrated business - show placeholder with CTA
              <div className="mb-8">
                <div className="aspect-video w-full bg-gray-800 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Video className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Is this your business?</h3>
                    <p className="text-gray-400 mb-4">
                      Claim your business listing to update information, add photos, and access premium features.
                    </p>
                    <Link
                      to={`/claim-business?business=${business.id}`}
                      className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-colors font-medium"
                    >
                      Claim This Business
                    </Link>
                  </div>
                </div>
              </div>
            ) : shouldShowPremiumContent() ? (
              // Premium content - show promo video if available
              <div className="mb-8">
                <h2 className="hidden text-xl font-semibold text-white mb-4">Promo Video</h2>
                <div className="aspect-video w-full bg-gray-800 rounded-lg overflow-hidden">
                  {business.promo_video_url ? (
                    <iframe
                      src={business.promo_video_url}
                      title={`${business.name} promo video`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Video className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No promo video available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Image Gallery - Only show if gallery should be displayed */}
            {shouldShowGallery && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Image Gallery</h2>
                </div>
                <div className="relative">
                  {totalPages > 1 && (
                    <>
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-black/75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-black/75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <div className="grid grid-cols-4 gap-4">
                    {displayedImages.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedImageIndex(currentPage * imagesPerPage + index);
                          setIsLightboxOpen(true);
                        }}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                      >
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information - Only show if contact info should be displayed */}
            {shouldShowContactInfo() && (business.city || business.website_url || business.phone || business.email) && (
              <div className="bg-gray-900 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
                <div className="space-y-4">
                  {business.city && business.state && (
                    <div className="flex items-center text-gray-400">
                      <MapPin className="h-5 w-5 mr-3" />
                      <span>{business.city}, {business.state} {business.zip_code}</span>
                    </div>
                  )}
                  {business.website_url && (
                    <div className="flex items-center text-gray-400">
                      <Globe className="h-5 w-5 mr-3" />
                      <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                        Visit website
                      </a>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center text-gray-400">
                      <Phone className="h-5 w-5 mr-3" />
                      <a href={`tel:${business.phone}`} className="text-white hover:text-gray-300">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center text-gray-400">
                      <Mail className="h-5 w-5 mr-3" />
                      <a
                        href={`mailto:${business.email}`}
                        className="text-white hover:text-gray-300"
                      >
                        Email business owner
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Media - Only show if premium features are enabled */}
            {shouldShowPremiumContent() && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Social Media</h2>
                {business.social_links && Object.keys(business.social_links).length > 0 ? (
                  <div className="flex gap-4">
                    {Object.entries(business.social_links).map(([platform, url]) => (
                      <a 
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-gray-300"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <p>No social media links available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar Businesses */}
        {similarBusinesses.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Similar Businesses</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarBusinesses.map(similarBusiness => (
                <Link 
                  key={similarBusiness.id}
                  to={`/business/${similarBusiness.id}`}
                  className="block group"
                >
                  <div className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-white/20 transition-all">
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={getBusinessImageUrl(similarBusiness.image_url)} 
                        alt={similarBusiness.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">{similarBusiness.name}</h3>
                        <div className="flex items-center gap-1">
                          {similarBusiness.is_verified && (
                            <CheckCircle className="h-3 w-3 text-white flex-shrink-0" />
                          )}
                          {similarBusiness.subscription_plan_name === 'VIP Plan' && (
                            <Crown className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                          )}
                          {similarBusiness.subscription_plan_name === 'Migrated' && (
                            <Shield className="h-3 w-3 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{similarBusiness.tagline}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={galleryImages}
          index={selectedImageIndex}
        />

        {/* Tip Modal - Only show if feature flag is enabled */}
        {enableTipFeature && (
          <TipModal
            businessName={business.name}
            isOpen={isTipModalOpen}
            onClose={() => setIsTipModalOpen(false)}
            onSubmit={handleTipSubmit}
          />
        )}

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          businessName={business.name}
          businessUrl={`/business/${business.id}`}
          businessDescription={business.description}
        />
      </div>
    </Layout>
  );
}

export default BusinessDetailPage;