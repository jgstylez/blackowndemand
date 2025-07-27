import React, { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { ExternalLink, Crown, Building2, Users, Handshake } from "lucide-react";
import { supabase, getBusinessImageUrl } from "../lib/supabase";
import { Link } from "react-router-dom";
import BusinessCTA from "../components/common/BusinessCTA";
import { trackWebsiteClick } from "../utils/analyticsUtils";

// Target business categories for collaboration page
const TARGET_CATEGORIES = [
  "Nonprofit",
  "Directory",
  "Trade Association",
  "Chamber",
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

const CollaborationPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [collaborationBusinesses, setCollaborationBusinesses] = useState<
    Business[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Helper function to truncate description to 250 characters
  const truncateDescription = (
    description: string,
    maxLength: number = 250
  ) => {
    if (!description) return "";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + "...";
  };

  useEffect(() => {
    const fetchCollaborationBusinesses = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching collaboration businesses...");

        // Look for businesses that could be resources (have websites and are in relevant categories)
        // Using actual enum values from the database schema
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .not("website_url", "is", null)
          .or("is_verified.eq.true,migration_source.not.is.null")
          .in("category", [
            "Digital Products",
            "Content Creation",
            "Mobile Apps & Software Licenses",
            "Education",
          ])
          .order("name");

        if (error) {
          console.error("❌ Error fetching collaboration businesses:", error);
          throw error;
        }

        console.log("✅ Found collaboration businesses:", data?.length || 0);
        setCollaborationBusinesses(data || []);
      } catch (error) {
        console.error("💥 Error fetching collaboration businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborationBusinesses();
  }, []);

  // Filter businesses by selected category
  const filteredBusinesses =
    selectedCategory === "All"
      ? collaborationBusinesses
      : collaborationBusinesses.filter(
          (business) => business.category === selectedCategory
        );

  // Get unique categories from the loaded businesses
  const availableCategories = [
    "All",
    ...new Set(collaborationBusinesses.map((business) => business.category)),
  ];

  const handleWebsiteClick = async (businessId: string, websiteUrl: string) => {
    try {
      await trackWebsiteClick(businessId, websiteUrl);
    } catch (error) {
      console.error("Error tracking website click:", error);
    }
    // Continue with normal link behavior
  };

  return (
    <Layout
      title="Collaboration | BlackOWNDemand"
      description="Collaborate with BlackOWNDemand. We partner with nonprofit organizations, trade associations, chambers of commerce, and other directories that support Black-owned businesses."
      url="/collaboration"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Collaboration Over Competition
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We believe in the power of unity. That's why we collaborate with
            nonprofit organizations, trade associations, chambers of commerce,
            and even other directories committed to uplifting Black-owned
            businesses. When we build together, we don't just grow, we multiply
            our impact.
          </p>
        </div>

        {/* Category Filter */}
        {availableCategories.length > 1 && (
          <div className="relative mb-12">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10" />

            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 px-8 min-w-max">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? "bg-white text-black"
                        : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
        ) : filteredBusinesses.length > 0 ? (
          <div className="space-y-6">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getBusinessImageUrl(business.image_url)}
                      alt={`${business.name} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">
                          {business.name}
                        </h2>
                        {business.is_verified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                            Verified
                          </span>
                        )}
                        {business.migration_source && (
                          <Crown className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        {business.category}
                      </span>
                    </div>
                    {business.tagline && (
                      <p className="text-gray-300 font-medium mb-2">
                        {business.tagline}
                      </p>
                    )}
                    <p className="text-gray-300 mb-4">
                      {truncateDescription(business.description, 250)}
                    </p>
                    <div className="flex gap-4">
                      <Link
                        to={`/business/${business.id}`}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                      >
                        View Details
                      </Link>
                      {business.website_url && (
                        <a
                          href={business.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                          onClick={() =>
                            handleWebsiteClick(
                              business.id,
                              business.website_url
                            )
                          }
                        >
                          Visit Website
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Information Section */}
        <div className="mt-16 bg-gray-900 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Why Collaborate?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Shared Mission
              </h3>
              <p className="text-gray-400">
                We partner with organizations that align with our commitment to
                economic empowerment, equity, and visibility for Black-owned
                businesses.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Collective Resources
              </h3>
              <p className="text-gray-400">
                Through collaboration, we combine knowledge, tools & resources,
                and support systems, and as a byproduct, creating more
                accessible and scalable opportunities for our communitiy.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Handshake className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Unified Impact
              </h3>
              <p className="text-gray-400">
                Together, we drive systemic change. By aligning goals, we expand
                our reach and deepen our influence in the communities we serve.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add the CTA section */}
      <BusinessCTA />
    </Layout>
  );
};

export default CollaborationPage;
