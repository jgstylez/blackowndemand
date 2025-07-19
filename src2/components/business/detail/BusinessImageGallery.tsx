import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBusinessImageUrl } from '../../../lib/supabase';

interface BusinessImageGalleryProps {
  businessName: string;
  additionalImages: any[];
  onImageClick: (index: number) => void;
}

const BusinessImageGallery: React.FC<BusinessImageGalleryProps> = ({
  businessName,
  additionalImages,
  onImageClick
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // If there are no additional images, don't render the gallery
  if (!additionalImages || additionalImages.length === 0) {
    return null;
  }
  
  // Create gallery images from additional images
  const galleryImages = additionalImages.map((img, index) => ({
    src: getBusinessImageUrl(img.url),
    alt: `${businessName} gallery image ${index + 1}`
  }));

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

  return (
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
              onClick={() => onImageClick(currentPage * imagesPerPage + index)}
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
  );
};

export default BusinessImageGallery;