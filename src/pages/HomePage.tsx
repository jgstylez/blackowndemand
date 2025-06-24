import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Crown, Gift, Star, Shield } from 'lucide-react';
import Layout from '../components/layout/Layout';
import AdSection from '../components/ads/AdSection';
import { supabase, getBusinessImageUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import NewsletterSubscription from '../components/common/NewsletterSubscription';
import { logError } from '../lib/errorLogger';
import useErrorHandler from '../hooks/useErrorHandler';
import ErrorFallback from '../components/common/ErrorFallback';

interface Business {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  is_verified: boolean;
  is_featured: boolean;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  image_url: string;
  created_at: string;
  migration_source: string;
  subscription_plan_name?: string;
}

const HomePage = () => {
  const { user } = useAuth();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [vipBusinesses, setVipBusinesses] = useState<Business[]>([]);
  const [legacyBusinesses, setLegacyBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [vipCurrentPage, setVipCurrentPage] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { error, handleError, clearError } = useErrorHandler({
    context: 'HomePage',
    defaultMessage: 'Failed to load businesses'
  });

  // Calculate items per page based on screen size
  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 10; // Desktop: 5 columns × 2 rows
      if (window.innerWidth >= 768) return 6;   // Tablet: 3 columns × 2 rows
      return 1; // Mobile: 1 column × 1 row
    }
    return 10; // Default for SSR
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage());
      setCurrentPage(0); // Reset to first page on resize
      setVipCurrentPage(0); // Reset VIP page on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        clearError();
        console.log('🔍 Fetching businesses for homepage...');
        
        // Fetch featured businesses using the RPC function
        const { data: featured, error: featuredError } = await supabase
          .rpc('get_businesses_with_plan_details_v2', {
            p_is_featured: true,
            p_is_active: true,
            p_limit: 20
          });

        if (featuredError) {
          console.error('❌ Error fetching featured businesses:', featuredError);
          logError('Error fetching featured businesses', {
            context: 'HomePage',
            metadata: { error: featuredError }
          });
        } else {
          console.log('✅ Featured businesses:', featured?.length || 0);
          setFeaturedBusinesses(featured || []);
        }

        // Fetch VIP businesses using the RPC function
        const { data: vip, error: vipError } = await supabase
          .rpc('get_businesses_with_plan_details_v2', {
            p_subscription_plan_name: 'VIP Plan',
            p_is_active: true,
            p_limit: 50
          });

        if (vipError) {
          console.error('❌ Error fetching VIP businesses:', vipError);
          logError('Error fetching VIP businesses', {
            context: 'HomePage',
            metadata: { error: vipError }
          });
        } else {
          console.log('✅ VIP businesses:', vip?.length || 0);
          setVipBusinesses(vip || []);
        }

        // Fetch legacy businesses using the RPC function
        const { data: legacy, error: legacyError } = await supabase
          .rpc('get_businesses_with_plan_details_v2', {
            p_subscription_plan_name: 'Migrated',
            p_is_active: true,
            p_limit: 50
          });

        if (legacyError) {
          console.error('❌ Error fetching legacy businesses:', legacyError);
          logError('Error fetching legacy businesses', {
            context: 'HomePage',
            metadata: { error: legacyError }
          });
        } else {
          console.log('✅ Legacy businesses:', legacy?.length || 0);
          setLegacyBusinesses(legacy || []);
          setTotalCount(legacy.length > 0 ? legacy[0].total_count : 0);
        }
        
      } catch (err) {
        handleError(err, 'Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [handleError, clearError]);

  useEffect(() => {
    // Initialize video playback when component mounts
    const video = videoRef.current;
    if (video) {
      // Add event listeners
      const handleVideoError = () => {
        console.error('Video failed to load');
        setVideoError(true);
        logError('Video failed to load', {
          context: 'HomePage',
          metadata: { src: video.currentSrc }
        });
      };

      const handleVideoLoaded = () => {
        // Once video is loaded, make it visible
        if (video.parentElement) {
          video.parentElement.style.opacity = '1';
        }
      };

      video.addEventListener('error', handleVideoError);
      video.addEventListener('loadeddata', handleVideoLoaded);

      // Clean up event listeners
      return () => {
        video.removeEventListener('error', handleVideoError);
        video.removeEventListener('loadeddata', handleVideoLoaded);
      };
    }
  }, []);

  const totalPages = Math.ceil(legacyBusinesses.length / itemsPerPage);
  const currentLegacy = legacyBusinesses.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const vipTotalPages = Math.ceil(vipBusinesses.length / itemsPerPage);
  const currentVip = vipBusinesses.slice(
    vipCurrentPage * itemsPerPage,
    (vipCurrentPage + 1) * itemsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleVipPrevPage = () => {
    setVipCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleVipNextPage = () => {
    setVipCurrentPage(prev => Math.min(vipTotalPages - 1, prev + 1));
  };

  const getGridClasses = () => {
    // Desktop: 5 columns × 2 rows
    // Tablet: 3 columns × 2 rows  
    // Mobile: 1 column × 1 row
    return "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6";
  };

  const renderBusinessCard = (business: Business, showVipBadge = false, isLegacy = false) => (
    <Link 
      key={business.id}
      to={`/business/${business.id}`}
      className="block group"
    >
      <div className={`bg-gray-900 rounded-xl overflow-hidden hover:ring-2 transition-all h-full ${
        isLegacy ? 'hover:ring-blue-400/20' : 'hover:ring-white/20'
      }`}>
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={getBusinessImageUrl(business.image_url)} 
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
            }}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate">{business.name}</h3>
            <div className="flex items-center gap-1 ml-2">
              {business.is_verified && (
                <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
              )}
              {business.subscription_plan_name === 'VIP Plan' && (
                <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              )}
              {business.subscription_plan_name === 'Migrated' && (
                <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
              )}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{business.tagline}</p>
          <div className="flex items-center text-xs text-gray-500 mb-3">
            {business.city && business.state && (
              <>
                <span className="truncate">{business.city}, {business.state}</span>
                <span className="mx-2">•</span>
              </>
            )}
            <span className="truncate">{business.category}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {business.is_featured && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </span>
            )}
            {business.subscription_plan_name === 'VIP Plan' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-400 gap-1">
                <Crown className="h-3 w-3" />
                VIP
              </span>
            )}
            {business.subscription_plan_name === 'Migrated' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-400/20 text-blue-400 gap-1">
                <Shield className="h-3 w-3" />
                Legacy
              </span>
            )}
            {business.is_verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  if (error.hasError && !loading) {
    return (
      <Layout
        title="BlackOWNDemand - Discover Black-Owned Businesses Worldwide"
        description="Connect with talented Black professionals and businesses across every industry. BlackOWNDemand is the premier global directory for Black-owned businesses."
        image="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bod_bg_img_v2.png"
        url="/"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorFallback
            error={error.details}
            message={error.message || "Failed to load businesses"}
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
      title="BlackOWNDemand - Discover Black-Owned Businesses Worldwide"
      description="Connect with talented Black professionals and businesses across every industry. BlackOWNDemand is the premier global directory for Black-owned businesses."
      image="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bod_bg_img_v2.png"
      url="/"
    >
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 transition-opacity duration-500" style={{ opacity: 0 }}>
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ display: videoError ? 'none' : 'block' }}
            onError={() => setVideoError(true)}
          >
            <source src="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/videos//bod_bg_vid_v1.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Fallback Image (always present, shown when video fails) */}
          <img
            src="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bod_bg_img_v2.png"
            alt="Diverse group of Black professionals"
            className="w-full h-full object-cover"
            style={{ display: videoError ? 'block' : 'none' }}
          />
          
          {/* Semi-transparent Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <a 
            href="https://www.sowempowered.com" 
            target="_blank" 
            rel="noopener noreferrer" 
          >
            <div className="inline-flex items-center px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-6">
              <Gift className="h-4 w-4 text-white flex-shrink-0" /> &nbsp; Support Project Unity
            </div>
          </a>
<br/><br/>
          <h4 className="text-lg uppercase text-white font-bold mb-6">
            Global Black Business Directory
          </h4>
          <h1 className="text-5xl md:text-6xl bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent font-bold mb-4">
            Buying Black has never been easier!
          </h1>
          <br/>
          <p className="hidden text-xl text-white mb-8">
            Discover Black-owned businesses worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gradient-to-r from-white via-white to-white/90 text-black hover:from-gray-100 hover:via-gray-100 hover:to-gray-100/90 transition-all text-lg font-semibold"
            >
              Search The Directory
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            {/* Conditional CTA based on user login status - Changed to go to pricing page */}
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-colors text-lg font-semibold"
            >
              List Your Business
            </Link>
          </div>
        </div>
      </section>

      {/* Ad Section - Directly underneath hero */}
      <AdSection />

      {/* Featured Businesses Section */}
      {featuredBusinesses.length > 0 && (
        <section className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Featured Businesses
              </h2>
              <p className="text-xl text-gray-400">
                Discover exceptional Black-owned businesses
              </p>
            </div>
            <div className={getGridClasses()}>
              {featuredBusinesses.slice(0, itemsPerPage).map(business => 
                renderBusinessCard(business)
              )}
            </div>
            {featuredBusinesses.length > itemsPerPage && (
              <div className="text-center mt-8">
                <Link
                  to="/browse?featured=true"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors font-semibold"
                >
                  View All Featured
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* VIP Businesses Section */}
      {vipBusinesses.length > 0 && (
        <section className="py-16 bg-black from-yellow-900/20 to-amber-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-yellow-400/20 rounded-full text-yellow-400 text-sm font-medium mb-4">
                <Crown className="h-4 w-4 mr-2" />
                VIP Members
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our VIP Members
              </h2>
              <p className="text-xl text-gray-400">
                Our members who enjoy exclusive benefits. Join them!
              </p>
            </div>
            <div className={getGridClasses()}>
              {currentVip.map(business => 
                renderBusinessCard(business, true)
              )}
            </div>
            {vipTotalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={handleVipPrevPage}
                  disabled={vipCurrentPage === 0}
                  className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-white">
                  {vipCurrentPage + 1} of {vipTotalPages}
                </span>
                <button
                  onClick={handleVipNextPage}
                  disabled={vipCurrentPage === vipTotalPages - 1}
                  className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
             <div className="text-center mt-8">
              <Link
                to="/browse"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors text-lg font-semibold"
          >
            
                Search All Businesses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Legacy Businesses Section */}
      {legacyBusinesses.length > 0 && (
        <section className="hidden py-16 bg-gradient-to-br from-blue-900/20 to-indigo-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-blue-400/20 rounded-full text-blue-400 text-sm font-medium mb-4">
                <Shield className="h-4 w-4 mr-2" />
                Legacy Members
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Legacy Members
              </h2>
              <p className="text-xl text-gray-400">
               Meet the pioneering Black entrepreneurs who helped launch our platform. 
              </p>
            </div>
            <div className={getGridClasses()}>
              {currentLegacy.map(business => 
                renderBusinessCard(business, false, true)
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-white">
                  {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="text-center mt-8">
              <Link
                to="/browse"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
              >
                Search All Businesses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="hidden py-16 bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterSubscription />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of Black-owned businesses in our directory
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors text-lg font-semibold"
          >
            List Your Business Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;