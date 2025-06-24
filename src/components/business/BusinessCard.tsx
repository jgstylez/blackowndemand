import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Crown, Shield } from 'lucide-react';
import { getBusinessImageUrl } from '../../lib/supabase';
import BookmarkButton from '../common/BookmarkButton';

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
  migration_source?: string;
  created_at: string;
  subscription_id?: string;
  subscription_plan_name?: string;
  vip_member?: any;
}

interface BusinessCardProps {
  business: Business;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  // Determine badge display logic based on subscription plan
  const isLegacy = !!business.migration_source && business.subscription_plan_name === 'Migrated';
  const isVIP = business.subscription_plan_name === 'VIP Plan';
  
  return (
    <Link to={`/business/${business.id}`} className="block">
      <div className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-white/20 transition-all relative">
        <div className="aspect-video w-full overflow-hidden relative">
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
          <BookmarkButton 
            businessId={business.id} 
            size={20} 
            className="absolute bottom-2 right-2 z-10 bg-black/50"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-white">{business.name}</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">{business.tagline}</p>
          <div className="flex items-center text-sm text-gray-500">
            {business.city && business.state ? (
              <>
                <span>{business.city}, {business.state}</span>
                <span className="mx-2">•</span>
              </>
            ) : null}
            <span>{business.category}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {business.is_featured && (
              <span className="px-2 py-1 bg-white/10 text-white rounded-full text-xs">
                Featured
              </span>
            )}
            {isVIP && (
              <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
                <Crown className="h-3 w-3" />
                VIP
              </span>
            )}
            {isLegacy && (
              <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Legacy
              </span>
            )}
            {business.is_verified && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;