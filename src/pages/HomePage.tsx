import React, { useCallback } from "react";
import { Crown } from "lucide-react";
import Layout from "../components/layout/Layout";
import AdSection from "../components/ads/AdSection";
import BusinessCTA from "../components/common/BusinessCTA";
import HeroSection from "../components/home/HeroSection";
import BusinessCarouselSection from "../components/home/BusinessCarouselSection";
import useFeaturedBusinesses from "../hooks/home/useFeaturedBusinesses";
import useVipBusinesses from "../hooks/home/useVipBusinesses";
import useLegacyBusinesses from "../hooks/home/useLegacyBusinesses";
import { useUnifiedErrorHandler } from "../utils/unifiedErrorHandler";
import ErrorFallback from "../components/common/ErrorFallback";

const HomePage: React.FC = () => {
  const {
    businesses: featuredBusinesses,
    loading: featuredLoading,
    error: featuredError,
    refetch: refetchFeatured,
  } = useFeaturedBusinesses();

  const {
    businesses: vipBusinesses,
    loading: vipLoading,
    error: vipError,
    refetch: refetchVip,
  } = useVipBusinesses();

  const {
    loading: legacyLoading,
    error: legacyError,
    refetch: refetchLegacy,
  } = useLegacyBusinesses();

  const { error, handleError, clearError } = useUnifiedErrorHandler({
    context: "HomePage",
    defaultMessage: "Failed to load businesses",
  });

  // Memoize the refetch callback
  const handleRefetch = useCallback(() => {
    clearError();
    refetchFeatured();
    refetchVip();
    refetchLegacy();
  }, [clearError, refetchFeatured, refetchVip, refetchLegacy]);

  // Combine errors from all hooks
  React.useEffect(() => {
    if (featuredError || vipError || legacyError) {
      handleError(featuredError || vipError || legacyError);
    } else {
      clearError();
    }
  }, [featuredError, vipError, legacyError]);

  // If there's an error, show the error fallback
  if (error && !featuredLoading && !vipLoading && !legacyLoading) {
    return (
      <Layout
        title="BlackOWNDemand - Discover Black-Owned Businesses Worldwide"
        description="Connect with talented Black professionals and businesses across every industry. BlackOWNDemand is the premier global directory for Black-owned businesses."
        image="https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bod_bg_img_v2.png"
        url="/"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorFallback error={error} resetErrorBoundary={handleRefetch} />
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
      <HeroSection />

      {/* Ad Section - Directly underneath hero */}
      <AdSection />

      {/* Featured Businesses Section */}
      {(featuredLoading || featuredBusinesses.length > 0) && (
        <BusinessCarouselSection
          businesses={featuredBusinesses}
          title="Featured Businesses"
          description="Discover exceptional Black-owned businesses"
          viewAllLink="/browse?featured=true"
          viewAllText="View All Featured"
          isLoading={featuredLoading}
        />
      )}

      {/* VIP Businesses Section */}
      {(vipLoading || vipBusinesses.length > 0) && (
        <BusinessCarouselSection
          businesses={vipBusinesses}
          title="Our VIP Members"
          description="Our members who enjoy exclusive benefits. Join them!"
          badgeIcon={<Crown className="h-4 w-4 mr-2" />}
          badgeText="VIP Members"
          badgeClass="bg-yellow-400/20 text-yellow-400"
          viewAllLink="/browse"
          viewAllText="Search All Businesses"
          isLoading={vipLoading}
        />
      )}

      {/* Call to Action Section */}
      <BusinessCTA />
    </Layout>
  );
};

export default HomePage;
