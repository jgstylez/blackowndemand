import React from 'react';
import { MapPin, Globe, Phone, Mail } from 'lucide-react';

interface BusinessContactSocialProps {
  business: any;
}

const BusinessContactSocial: React.FC<BusinessContactSocialProps> = ({ business }) => {
  if (!business) return null;

  return (
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
            <a 
              href={business.website_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-gray-300"
            >
              Visit website
            </a>
          </div>
        )}
        
        {business.phone && (
          <div className="flex items-center text-gray-400">
            <Phone className="h-5 w-5 mr-3" />
            <a 
              href={`tel:${business.phone}`} 
              className="text-white hover:text-gray-300"
            >
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

      {/* Social Media Links */}
      {business.social_links && Object.keys(business.social_links).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Social Media</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(business.social_links).map(([platform, url]) => (
              <a 
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300"
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessContactSocial;