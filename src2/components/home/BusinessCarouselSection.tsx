import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import BusinessCard from '../business/BusinessCard';

interface BusinessCarouselSectionProps {
  businesses: any[];
  title: string;
  description: string;
  badgeIcon?: React.ReactNode;
  badgeText?: string;
  badgeClass?: string;
  viewAllLink?: string;
  viewAllText?: string;
  isLoading?: boolean;
  emptyStateIcon?: React.ReactNode;
  emptyStateText?: string;
}

const BusinessCarouselSection: React.FC<BusinessCarouselSectionProps> = ({
  businesses,
  title,
  description,
  badgeIcon,
  badgeText,
  badgeClass = "bg-yellow-400/20 text-yellow-400",
  viewAllLink,
  viewAllText = "View All",
  isLoading = false,
  emptyStateIcon,
  emptyStateText = "No businesses found"
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Calculate items per page based on screen size
  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 10; // Desktop: 5 columns × 2 rows
      if (window.innerWidth >= 768) return 6;   // Tablet: 3 columns × 2 rows
      return 1; // Mobile: 1 column × 1 row
    }
    return 10; // Default for SSR
  };
  
  const itemsPerPage = getItemsPerPage();
  const totalPages = Math.ceil(businesses.length / itemsPerPage);
  
  const currentBusinesses = businesses.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
  // Get grid classes for the businesses display
  const getGridClasses = () => {
    return "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6";
  };
  
  if (isLoading) {
    return (
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-400">
              {description}
            </p>
          </div>
          <div className={getGridClasses()}>
            {[...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-800" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-4 bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  if (businesses.length === 0) {
    return null;
  }
  
  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {badgeIcon && badgeText && (
            <div className={`inline-flex items-center px-4 py-2 ${badgeClass} rounded-full text-sm font-medium mb-4`}>
              {badgeIcon}
              {badgeText}
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-400">
            {description}
          </p>
        </div>
        
        {businesses.length > 0 ? (
          <>
            <div className={getGridClasses()}>
              {currentBusinesses.map(business => (
                <BusinessCard key={business.id} business={business} />
              ))}
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
            
            {viewAllLink && (
              <div className="text-center mt-8">
                <Link
                  to={viewAllLink}
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors text-lg font-semibold"
                >
                  {viewAllText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            {emptyStateIcon || null}
            <p className="text-gray-400">{emptyStateText}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BusinessCarouselSection;