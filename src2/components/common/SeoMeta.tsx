import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'business.business';
  twitterCard?: 'summary' | 'summary_large_image';
  businessName?: string;
  businessCategory?: string;
  businessLocation?: string;
  noindex?: boolean;
}

const SeoMeta: React.FC<SeoMetaProps> = ({
  title = 'BlackOWNDemand - Black Business Directory',
  description = 'Discover Black-owned businesses worldwide. Connect with talented Black professionals and businesses across every industry.',
  image = 'https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bod_bg_img_v2.png',
  url,
  type = 'website',
  twitterCard = 'summary_large_image',
  businessName,
  businessCategory,
  businessLocation,
  noindex = false
}) => {
  // Ensure we have absolute URLs
  const siteUrl = 'https://blackowndemand.com';
  const canonicalUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  
  // Create a full title with site name
  const fullTitle = businessName 
    ? `${businessName} | BlackOWNDemand` 
    : title;
  
  // Create a structured description for business pages
  const fullDescription = businessName && businessCategory && businessLocation
    ? `${businessName} is a Black-owned ${businessCategory} business located in ${businessLocation}. Search for them on BlackOWNDemand, the premier directory for Black-owned businesses.`
    : description;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:site_name" content="BlackOWNDemand" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@blackdollarnet" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Additional Business Metadata */}
      {businessName && (
        <>
          <meta property="og:locale" content="en_US" />
          {businessCategory && <meta property="business:category" content={businessCategory} />}
          {businessLocation && <meta property="business:location" content={businessLocation} />}
        </>
      )}
    </Helmet>
  );
};

export default SeoMeta;