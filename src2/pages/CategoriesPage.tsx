import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { 
  Palette, Car, Baby, Sparkles, Shirt, Laptop, 
  Dumbbell, UtensilsCrossed, Sofa, ShoppingCart, 
  Home, PackageOpen, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BusinessCTA from '../components/common/BusinessCTA';

interface CategoryData {
  category: string;
  count: number;
  label: string;
}

const CategoryIcon = ({ category }: { category: string }) => {
  // Map category enum values to icons
  const iconMap: Record<string, React.ComponentType<any>> = {
    'Arts, Crafts & Party Supplies': Palette,
    'Auto, Tires & Industrial': Car,
    'Baby': Baby,
    'Beauty & Cosmetics': Sparkles,
    'Clothing, Shoes & Accessories': Shirt,
    'Electronics': Laptop,
    'Exercise & Fitness': Dumbbell,
    'Food & Beverage': UtensilsCrossed,
    'Furniture & Appliances': Sofa,
    'Grocery': ShoppingCart,
    'Home Improvements & Decor': Home,
    // Add more mappings as needed
  };

  const IconComponent = iconMap[category] || PackageOpen;
  return <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />;
};

const CategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoriesFromBusinesses = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching categories from businesses table...');

        // Get all unique categories from businesses that are accessible
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('category')
          .not('category', 'is', null)
          .or('is_verified.eq.true,migration_source.not.is.null');

        if (businessError) {
          console.error('❌ Error fetching businesses:', businessError);
          throw businessError;
        }

        console.log('📋 Raw business data:', businessData?.length, 'records');

        // Get unique categories
        const uniqueCategories = [...new Set(businessData?.map(b => b.category).filter(Boolean) || [])];
        console.log('📊 Unique categories found:', uniqueCategories.length);

        if (uniqueCategories.length === 0) {
          console.log('⚠️ No categories found in businesses table');
          setCategoryCounts([]);
          return;
        }

        // Count businesses for each category
        console.log('📊 Counting businesses for each category...');
        const categoriesWithCounts = await Promise.all(
          uniqueCategories.map(async (category) => {
            const { count } = await supabase
              .from('businesses')
              .select('*', { count: 'exact', head: true })
              .eq('category', category)
              .or('is_verified.eq.true,migration_source.not.is.null');

            return {
              category,
              count: count || 0,
              label: category // Use the category as-is since it's already formatted
            };
          })
        );

        // Sort by label and filter out categories with 0 businesses
        const filteredCategories = categoriesWithCounts
          .filter(cat => cat.count > 0)
          .sort((a, b) => a.label.localeCompare(b.label));

        console.log('✅ Final categories with businesses:', filteredCategories.length);
        console.log('📋 Categories:', filteredCategories.map(c => `${c.label}: ${c.count}`));
        
        setCategoryCounts(filteredCategories);

      } catch (error) {
        console.error('💥 Error fetching categories:', error);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesFromBusinesses();
  }, []);

  const filteredCategories = categoryCounts.filter(({ label }) => 
    label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategorySlug = (category: string) => {
    return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  return (
    <Layout
      title="Categories | Black-Owned Business Directory | BlackOWNDemand"
      description="Browse Black-owned businesses by category. Find Black-owned businesses in arts, food, technology, professional services, and more."
      url="/categories"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section - Optimized for mobile */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            Search by Category
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-2">
            Search our diverse range of Black-owned businesses across different industries. Find the perfect business for your needs.
          </p>
        </div>

        {/* Search Bar - Mobile optimized */}
        <div className="relative mb-6 sm:mb-8">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3 text-sm sm:text-base bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            aria-label="Search categories"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-400 mb-4 text-sm sm:text-base">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State - Mobile optimized */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 sm:p-6 animate-pulse">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-800 rounded" />
                  <div className="h-5 sm:h-6 bg-gray-800 rounded flex-1" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 sm:h-4 bg-gray-800 rounded w-20" />
                  <div className="h-3 sm:h-4 bg-gray-800 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            {/* Results Count - Mobile friendly */}
            <div className="mb-4 sm:mb-6 text-center">
              <p className="text-gray-400 text-sm sm:text-base">
                Found {filteredCategories.length} categories with businesses
              </p>
            </div>
            
            {/* Categories Grid - Responsive breakpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredCategories.map(({ category, count, label }) => (
                <Link
                  key={category}
                  to={`/browse?category=${encodeURIComponent(category)}`}
                  className="bg-gray-900 rounded-xl p-4 sm:p-6 hover:bg-gray-800 transition-all duration-200 group border border-gray-800 hover:border-gray-700"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="text-white group-hover:text-gray-300 transition-colors flex-shrink-0">
                      <CategoryIcon category={label} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white group-hover:text-gray-300 transition-colors leading-tight line-clamp-2">
                      {label}
                    </h2>
                  </div>
                  
                  {/* Category Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-400">
                      {count} {count === 1 ? 'business' : 'businesses'}
                    </span>
                    <span className="text-xs sm:text-sm text-white group-hover:text-gray-300 transition-colors font-medium">
                      Browse →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          /* Empty State - Mobile optimized */
          <div className="text-center py-8 sm:py-12">
            <div className="bg-gray-900 rounded-xl p-6 sm:p-8 max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No categories found</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Categories will appear here once businesses are added.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Refresh Page
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Add the CTA section */}
      <BusinessCTA />
    </Layout>
  );
};

export default CategoriesPage;