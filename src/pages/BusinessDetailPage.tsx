import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Heart,
  Video,
  Crown,
  CheckCircle,
  Star,
  Shield,
  Globe,
  Phone,
  Mail,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Layout from "../components/layout/Layout";
import TipModal from "../components/business/TipModal";
import ShareModal from "../components/business/ShareModal";
import { getBusinessImageUrl } from "../lib/supabase";
import ErrorFallback from "../components/common/ErrorFallback";
import useFeatureFlag from "../hooks/useFeatureFlag";
import BookmarkButton from "../components/common/BookmarkButton";
import useBusinessDetails from "../hooks/useBusinessDetails";
import BusinessImageGallery from "../components/business/detail/BusinessImageGallery";
import BusinessContactSocial from "../components/business/detail/BusinessContactSocial";
import {
  shouldShowPremiumContent,
  shouldShowImageGallery,
  shouldShowContactInfo,
  isUnclaimedMigratedBusiness,
  isVipMember,
  isLegacyMember,
} from "../utils/businessFeatureUtils";
import {
  recordBusinessView,
  trackWebsiteClick,
  trackPhoneClick,
  trackEmailClick,
} from "../utils/analyticsUtils";

const BusinessDetailPage = () => {
  const { id } = useParams();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Feature flag for tip button
  const enableTipFeature = useFeatureFlag("enable_tip_feature", false);

  // Use the custom hook to fetch business details
  const {
    business,
    businessImages,
    similarBusinesses,
    loading,
    error,
    clearError,
  } = useBusinessDetails(id);

  // Add debugging for contact info visibility
  console.log("🔍 Business Detail Debug:", {
    businessName: business?.name,
    promoVideoUrl: business?.promo_video_url,
    subscriptionPlan: business?.subscription_plans,
    shouldShowPremium: shouldShowPremiumContent(business),
    shouldShowContact: shouldShowContactInfo(business),
    isUnclaimed: isUnclaimedMigratedBusiness(business),
    hasVideoUrl: !!business?.promo_video_url,
    businessHours: business?.business_hours,
    businessHoursType: typeof business?.business_hours,
    businessHoursKeys: business?.business_hours
      ? Object.keys(business.business_hours)
      : [],
  });

  // Add more detailed debugging right after the existing debug log
  console.log("🔍 Business Detail Debug:", {
    businessName: business?.name,
    promoVideoUrl: business?.promo_video_url,
    subscriptionPlan: business?.subscription_plans,
    shouldShowPremium: shouldShowPremiumContent(business),
    shouldShowContact: shouldShowContactInfo(business),
    isUnclaimed: isUnclaimedMigratedBusiness(business),
    hasVideoUrl: !!business?.promo_video_url,
    // Add contact info debugging
    hasCity: !!business?.city,
    hasWebsite: !!business?.website_url,
    hasPhone: !!business?.phone,
    hasEmail: !!business?.email,
    contactInfoCondition: !!(
      business?.city ||
      business?.website_url ||
      business?.phone ||
      business?.email
    ),
    // Add business data debugging
    businessId: business?.id,
    businessData: business,
  });

  // Create gallery images based on available data
  const createGalleryImages = () => {
    const images = [];

    // Add main business image if available
    if (business?.image_url) {
      images.push({
        src: getBusinessImageUrl(business.image_url),
        alt: `${business.name} main image`,
      });
    }

    // Add additional business images if available
    if (businessImages.length > 0) {
      businessImages.forEach((img, index) => {
        images.push({
          src: getBusinessImageUrl(img.url),
          alt: `${business?.name} gallery image ${index + 1}`,
        });
      });
    }

    return images;
  };

  const galleryImages = createGalleryImages();
  const shouldShowGallery =
    business && shouldShowImageGallery(business) && businessImages.length > 0;

  const handleTipSubmit = async (amount: number) => {
    try {
      // Here you would integrate with your payment processing service
      console.log(`Processing tip of $${amount} for ${business?.name}`);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      throw new Error("Failed to process payment");
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Add click handlers for tracking
  const handleWebsiteClick = () => {
    if (business?.website_url) {
      trackWebsiteClick(business.id, business.website_url);
      window.open(business.website_url, "_blank");
    }
  };

  const handlePhoneClick = () => {
    if (business?.phone) {
      trackPhoneClick(business.id, business.phone);
      window.open(`tel:${business.phone}`, "_self");
    }
  };

  const handleEmailClick = () => {
    if (business?.email) {
      trackEmailClick(business.id, business.email);
      window.open(`mailto:${business.email}`, "_self");
    }
  };

  // Prepare SEO metadata
  const getBusinessLocation = () => {
    if (!business) return "";
    const parts = [business.city, business.state, business.country].filter(
      Boolean
    );
    return parts.join(", ");
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

  if (error || !business) {
    return (
      <Layout
        title="Business Not Found | BlackOWNDemand"
        description="The business you're looking for could not be found."
        noindex={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorFallback
            error={error}
            resetErrorBoundary={() => {
              clearError();
              window.location.reload();
            }}
          />
        </div>
      </Layout>
    );
  }

  // Helper to check if a value is empty
  const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  };

  return (
    <Layout
      title={`${business.name} | BlackOWNDemand`}
      description={
        business.tagline ||
        business.description?.substring(0, 160) ||
        `${business.name} is a Black-owned business. Search for them on BlackOWNDemand.`
      }
      image={getBusinessImageUrl(business.image_url)}
      url={`/business/${business.id}`}
      type="business.business"
      businessName={business.name}
      businessCategory={business.category}
      businessLocation={getBusinessLocation()}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/browse"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to browse
        </Link>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column */}
          <div>
            {/* Main Business Image */}
            {business.image_url && (
              <div className="aspect-video w-full overflow-hidden rounded-xl mb-6">
                <img
                  src={getBusinessImageUrl(business.image_url)}
                  alt={business.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                  }}
                />
              </div>
            )}

            {/* Business Header - Combined name, badges, and share button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {business.name}
                  </h1>
                  {business.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                  {business.is_featured && (
                    <span className="inline-flex items-center px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                  {isVipMember(business) && (
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </span>
                  )}
                  {isLegacyMember(business) && (
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
            {business.description && (
              <div className="mb-8">
                <p className="text-gray-400 mb-6">{business.description}</p>
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
            )}

            {/* Category */}
            {!isEmpty(business.category) && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Category
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                  {business.category}
                </span>
              </div>
            )}

            {/* Tags */}
            {business.tags && business.tags.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {business.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {/* Promo Video Section */}
            {isUnclaimedMigratedBusiness(business) ? (
              // Unclaimed migrated business - show placeholder with CTA
              <div className="mb-8">
                <div className="aspect-video w-full bg-gray-800 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Video className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Is this your business?
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Claim your business listing to update information, add
                      photos, and access premium features.
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
            ) : shouldShowPremiumContent(business) ? (
              // Business has premium plan - show video or placeholder
              <div className="mb-8">
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
                      onError={(e) => {
                        console.error("Video iframe error:", e);
                        console.log(
                          "🔍 Failed video URL:",
                          business.promo_video_url
                        );
                        // Fallback to video element if iframe fails
                        const iframe = e.target as HTMLIFrameElement;
                        iframe.style.display = "none";
                        const videoContainer = iframe.parentElement;
                        if (videoContainer) {
                          const video = document.createElement("video");
                          video.src = business.promo_video_url;
                          video.controls = true;
                          video.className = "w-full h-full";
                          videoContainer.appendChild(video);
                        }
                      }}
                      onLoad={() => {
                        console.log(
                          "🔍 Video iframe loaded successfully:",
                          business.promo_video_url
                        );
                      }}
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Video className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          No promo video available
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Image Gallery - Only show if gallery should be displayed */}
            {shouldShowGallery && (
              <BusinessImageGallery
                businessName={business.name}
                additionalImages={businessImages}
                onImageClick={(index) => {
                  // Add 1 to the index since the main image is at index 0 in the lightbox
                  setSelectedImageIndex(index + 1);
                  setIsLightboxOpen(true);
                }}
              />
            )}

            {/* Contact Information - Only show if contact info should be displayed */}
            {shouldShowContactInfo(business) &&
              (business.city ||
                business.website_url ||
                business.phone ||
                business.email) && (
                <BusinessContactSocial business={business} />
              )}
          </div>
        </div>

        {/* Similar Businesses */}
        {similarBusinesses.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Similar Businesses
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarBusinesses.map((similarBusiness) => (
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
                          target.src =
                            "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {similarBusiness.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {similarBusiness.is_verified && (
                            <CheckCircle className="h-3 w-3 text-white flex-shrink-0" />
                          )}
                          {similarBusiness.subscription_plans ===
                            "VIP Plan" && (
                            <Crown className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                          )}
                          {similarBusiness.subscription_plans ===
                            "Migrated" && (
                            <Shield className="h-3 w-3 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {similarBusiness.tagline}
                      </p>
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
};

export default BusinessDetailPage;
