import React from 'react';
import { ExternalLink } from 'lucide-react';

interface AdSpotProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  ctaText?: string;
  backgroundColor?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
  isSponsored?: boolean;
  onClick?: () => void;
}

const AdSpot: React.FC<AdSpotProps> = ({
  title,
  description,
  imageUrl,
  linkUrl,
  ctaText = 'Learn More',
  backgroundColor = '#1f2937',
  textColor = '#ffffff',
  size = 'medium',
  isSponsored = true,
  onClick
}) => {
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const handleClick = () => {
    if (onClick) onClick();
    window.open(linkUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`rounded-xl ${sizeClasses[size]} cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group`}
      style={{ backgroundColor, color: textColor }}
      onClick={handleClick}
    >
      {/* Sponsored Badge - Moved to bottom right */}
      {isSponsored && (
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/20 rounded-full text-xs font-medium opacity-70">
          Sponsored
        </div>
      )}

      <div className="flex items-center gap-4 h-full">
        {/* Image */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-grow">
          <h3 className="font-bold text-lg mb-2 group-hover:underline">{title}</h3>
          <p className="text-sm opacity-90 mb-3 line-clamp-2">{description}</p>
          
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{ctaText}</span>
            <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default AdSpot;