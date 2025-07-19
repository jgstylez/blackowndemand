import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AdSpot from './AdSpot';
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
  impressions: number;
  clicks: number;
}

const AdSection: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    checkScrollButtons();
  }, [ads]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      
      // Get current date in ISO format
      const today = new Date().toISOString();
      
      // Fetch active ads that are within their date range
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('position');

      if (error) {
        console.error('Error fetching ads:', error);
        throw error;
      }
      
      setAds(data || []);
      
      // Record impressions for these ads
      if (data && data.length > 0) {
        recordImpressions(data.map(ad => ad.id));
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      // Fallback to static ads if available
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const recordImpressions = async (adIds: string[]) => {
    try {
      // For each ad, increment the impression count
      for (const id of adIds) {
        await supabase.rpc('increment_ad_impressions', { ad_id: id });
      }
    } catch (error) {
      console.error('Error recording impressions:', error);
    }
  };

  const recordClick = async (adId: string) => {
    try {
      await supabase.rpc('increment_ad_clicks', { ad_id: adId });
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  const handleAdClick = (ad: Ad) => {
    recordClick(ad.id);
  };

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 320; // Approximate width of one ad card
    container.scrollBy({
      left: -cardWidth,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 320; // Approximate width of one ad card
    container.scrollBy({
      left: cardWidth,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    checkScrollButtons();
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Featured Partners</h2>
            <p className="text-gray-400">
              Trusted services to help grow your Black-owned business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg" />
                  <div className="flex-grow space-y-3">
                    <div className="h-5 bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const showScrollControls = ads.length > 3;

  return (
    <section className="py-12 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Featured Partners</h2>
          <p className="text-gray-400">
            Trusted services to help grow your Black-owned business
          </p>
        </div>

        {/* Ads Container */}
        <div className="relative">
          {/* Scroll Controls - Only show when there are more than 3 ads */}
          {showScrollControls && (
            <>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/80 text-white transition-all ${
                  canScrollLeft 
                    ? 'hover:bg-black/60 opacity-100' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/80 text-white transition-all ${
                  canScrollRight 
                    ? 'hover:bg-black/60 opacity-100' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Ads Grid/Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={
              showScrollControls
                ? "flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-8"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            }
          >
            {ads.map((ad) => (
              <div
                key={ad.id}
                className={showScrollControls ? "flex-shrink-0 w-80" : ""}
              >
                <AdSpot
                  id={ad.id}
                  title={ad.title}
                  description={ad.description}
                  imageUrl={ad.image_url}
                  linkUrl={ad.link_url}
                  ctaText={ad.cta_text}
                  backgroundColor={ad.background_color}
                  textColor={ad.text_color}
                  size={ad.size}
                  isSponsored={true}
                  onClick={() => handleAdClick(ad)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Sponsored content helps support our platform and community
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdSection;