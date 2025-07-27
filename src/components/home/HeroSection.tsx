import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize video playback when component mounts
    const video = videoRef.current;
    if (video) {
      // Add event listeners
      const handleVideoError = () => {
        console.error('Video failed to load');
        setVideoError(true);
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

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 transition-opacity duration-500" style={{ opacity: 0 }}>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-top object-cover"
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
  );
};

export default HeroSection;