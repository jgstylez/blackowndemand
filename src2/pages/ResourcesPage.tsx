import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { ExternalLink, Crown } from 'lucide-react';
import { supabase, getBusinessImageUrl } from '../lib/supabase';
import { Link } from 'react-router-dom';
import BusinessCTA from '../components/common/BusinessCTA';

const categories = [
  'All',
  'Payments & Finance',
  'Digital Products',
  'Logistics & Shipping',
  'Marketing & Advertising',
  'HR & Team Management',
  'Inventory & Operations',
  'Legal & Compliance',
  'Security & Protection',
  'Customer Service',
  'Content Creation'
];

// Static resources that aren't in the database
const staticResources = [
  {
    id: 'ecom-payments',
    name: 'Ecom Payments',
    category: 'Payments & Finance',
    description: 'Ecom Payments helps businesses accept all major credit cards and scale with confidence through secure, fast, and compliant payment solutions—including virtual terminals, chargeback management, and next-day settlements.',
    logo: 'https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//ecom-temp.png',
    url: 'https://bdn.ecompayments.io',
    isStatic: true
  },
  {
    id: 'lexore-spark',
    name: 'Lexore Spark',
    category: 'Digital Products',
    description: 'Lexore Spark transforms your product photos into cinematic, AI-generated brand videos—no crew, no delays. Start free and create high-quality, story-driven content in under 24 hours.',
    logo: 'https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//lexore-logo-bg.png',
    url: 'https://app.lexore.io/?ref=BDN',
    isStatic: true
  },
  {
    id: 'the-blacktube',
    name: 'The BlackTube',
    category: 'Content Creation',
    description: 'The BlackTube is a multimedia platform dedicated to promoting and educating on the beauty of the Black experience. Share your business story, connect with customers, and be part of a growing network of Black content creators.',
    logo: 'https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/business-images/xDV9eTRPDh61Gk4o8BvmIUPpOkBZWIpX.webp',
    url: 'https://theblacktube.com/register?invite=3555839516347fbdc231f85.93072946&fbclid=PAQ0xDSwK4hiRleHRuA2FlbQIxMAABp57tcvmPj_ekt1TJm6y8xbmiIs1tWlp5uCBU-OUgm9em-7UI3H7jUkxtYl8j_aem_xI4s2OvmZ5so0LsrQoAUBQ',
    isStatic: true
  }
];

interface Business {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  website_url: string;
  image_url: string;
  migration_source: string;
  is_verified: boolean;
}

const ResourcesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [businessResources, setBusinessResources] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to truncate description to 250 characters
  const truncateDescription = (description: string, maxLength: number = 250) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  useEffect(() => {
    const fetchBusinessResources = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching business resources...');

        // Look for businesses that could be resources (have websites and are in relevant categories)
        // Using actual enum values from the database schema
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .not('website_url', 'is', null)
          .or('is_verified.eq.true,migration_source.not.is.null')
          .in('category', [
            'Digital Products',
            'Content Creation',
            'Mobile Apps & Software Licenses',
            'Education'
          ])
          .order('name');

        if (error) {
          console.error('❌ Error fetching business resources:', error);
          throw error;
        }

        console.log('✅ Found business resources:', data?.length || 0);
        setBusinessResources(data || []);
      } catch (error) {
        console.error('💥 Error fetching business resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessResources();
  }, []);

  // Combine static resources with business resources
  const allResources = [
    ...staticResources,
    ...businessResources.map(business => ({
      id: business.id,
      name: business.name,
      category: business.category,
      description: business.description,
      logo: business.image_url,
      url: business.website_url,
      isStatic: false,
      business: business
    }))
  ];

  const filteredResources = selectedCategory === 'All' 
    ? allResources 
    : allResources.filter(resource => resource.category === selectedCategory);

  return (
    <Layout
      title="Business Resources | BlackOWNDemand"
      description="Discover trusted tools and services to help grow your Black-owned business. We've partnered with leading providers to bring you the best solutions for your business needs."
      url="/resources"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Business Resources</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover trusted tools and services to help grow your business. We've partnered with leading providers to bring you the best solutions for your business needs.
          </p>
        </div>

        {/* Category Filter - Hidden for now until properly implemented */}
        {/*
        <div className="relative mb-12">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10" />
          
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-8 min-w-max">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-white text-black'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
        */}

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-lg bg-gray-800 flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 bg-gray-800 rounded w-48" />
                      <div className="h-4 bg-gray-800 rounded w-20" />
                    </div>
                    <div className="h-4 bg-gray-800 rounded w-full mb-4" />
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-4" />
                    <div className="h-10 bg-gray-800 rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResources.map(resource => (
              <div key={resource.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={resource.isStatic ? resource.logo : getBusinessImageUrl(resource.logo)} 
                      alt={`${resource.name} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">{resource.name}</h2>
                        {!resource.isStatic && resource.business?.migration_source && (
                          <Crown className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      <span className="text-sm text-gray-400">{resource.category}</span>
                    </div>
                    <p className="text-gray-300 mb-4">
                      {truncateDescription(resource.description, 250)}
                    </p>
                    <div className="flex gap-4">
                      {!resource.isStatic ? (
                        <>
                          <Link
                            to={`/business/${resource.id}`}
                            className="hidden inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                          >
                            View Details
                          </Link>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                            >
                              Visit Website
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <button className="hidden inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                            View Details
                          </button>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                          >
                            Visit Website
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add the CTA section */}
      <BusinessCTA />
    </Layout>
  );
};

export default ResourcesPage;