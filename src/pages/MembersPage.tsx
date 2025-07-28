import React, { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import {
  Crown,
  Users,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
  Share2,
  Gift,
  FileText,
  Shield,
} from "lucide-react";
import { supabase, getBusinessImageUrl } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useUnifiedPayment } from "../hooks/useUnifiedPayment";
import { usePaymentProvider } from "../hooks/usePaymentProvider";
import BusinessCTA from "../components/common/BusinessCTA";
import PlanPromotion from "../components/pricing/PlanPromotion";
import { getPlanConfigByName } from "../config/paymentConfig";
import PaymentModal from "../components/payment/PaymentModal";
import { Database } from "../lib/database.types";

// Update the VIPBusiness interface to match database types
interface VIPBusiness {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: Database["public"]["Enums"]["business_category_enum"] | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  image_url: string | null;
  migration_source: string | null;
  created_at: string;
  subscriptions?: {
    id: string;
    status: string;
    subscription_plans: {
      id: string;
      name: string;
    };
  };
}

const BUSINESSES_PER_PAGE = 12;

const VIPPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { provider } = usePaymentProvider();
  const [loading, setLoading] = useState(false);
  const [vipBusinesses, setVIPBusinesses] = useState<VIPBusiness[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Use unified payment hook - same as PricingPage
  const { handlePayment } = useUnifiedPayment({
    onSuccess: (result) => {
      console.log("Payment successful:", result);
      // Payment success is handled by URL redirect
    },
    onError: (error) => {
      console.error("Payment failed:", error.userFriendlyMessage);
      setError(error.userFriendlyMessage || "Payment failed");
      setTimeout(() => setError(null), 5000);
    },
  });

  // Check for Stripe checkout results (same as pricing page)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const success = urlParams.get("success");
    const canceled = urlParams.get("canceled");
    const planName = urlParams.get("plan");

    if (success === "true" && planName) {
      // Payment successful, navigate to business creation
      navigate("/business/new", {
        state: {
          planName: decodeURIComponent(planName),
          paymentCompleted: true,
        },
      });
    } else if (canceled === "true") {
      setError("Payment was canceled. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  }, [location, navigate]);

  // Simplified VIP businesses fetch
  useEffect(() => {
    const fetchVIPBusinesses = async () => {
      try {
        setBusinessesLoading(true);
        console.log("🔍 Fetching VIP businesses...");

        // Simplified query - only check for active businesses with VIP plan
        const { data, error } = await supabase
          .from("businesses")
          .select(
            `
            *,
            subscriptions!businesses_subscription_id_fkey(
              id,
              status,
              subscription_plans(
                id,
                name
              )
            )
          `
          )
          .eq("is_active", true)
          .eq("subscription_status", "active");

        if (error) {
          console.error("❌ Error fetching VIP businesses:", error);
          throw error;
        }

        console.log("Raw data:", data);

        // Simplified filtering - only check for active VIP subscription
        const vipBusinesses = (data || [])
          .filter(
            (business: any) =>
              business.subscriptions?.status === "active" &&
              business.subscriptions?.subscription_plans?.name === "VIP Plan"
          )
          .map((business: any) => ({
            id: business.id,
            name: business.name,
            tagline: business.tagline,
            description: business.description,
            category: business.category,
            is_verified: business.is_verified,
            is_featured: business.is_featured,
            city: business.city,
            state: business.state,
            zip_code: business.zip_code,
            country: business.country,
            image_url: business.image_url,
            migration_source: business.migration_source,
            created_at: business.created_at,
            subscriptions: business.subscriptions,
          }));

        console.log("👑 Found VIP businesses:", vipBusinesses.length);
        setVIPBusinesses(vipBusinesses);
        setTotalBusinesses(vipBusinesses.length);
      } catch (err) {
        console.error("💥 Error fetching VIP businesses:", err);
      } finally {
        setBusinessesLoading(false);
      }
    };

    fetchVIPBusinesses();
  }, []);

  // Pagination for VIP businesses
  const totalPages = Math.ceil(totalBusinesses / BUSINESSES_PER_PAGE);
  const startIndex = (currentPage - 1) * BUSINESSES_PER_PAGE;
  const endIndex = startIndex + BUSINESSES_PER_PAGE;
  const paginatedBusinesses = vipBusinesses.slice(startIndex, endIndex);

  const handleBecomeVIPClick = async () => {
    // Get VIP plan from config instead of hardcoded price
    const vipPlan = getPlanConfigByName("VIP Plan");
    if (!vipPlan) {
      console.error("VIP Plan not found in config");
      return;
    }

    if (!user) {
      // Store selected plan in session storage for after login
      sessionStorage.setItem(
        "selectedPlan",
        JSON.stringify({ planPrice: vipPlan.price, planName: "VIP Plan" })
      );
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await handlePayment({
        planName: "VIP Plan",
        planPrice: vipPlan.price,
        provider,
        showPaymentModal: true,
      });

      if (result && result.provider === "ecomPayments") {
        setIsPaymentModalOpen(true);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to VIP businesses section
    document
      .getElementById("vip-businesses")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper function to truncate description to 250 characters
  const truncateDescription = (
    description: string,
    maxLength: number = 250
  ) => {
    if (!description) return "";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + "...";
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Become a VIP CTA */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Become a VIP Member
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join an exclusive community of Black entrepreneurs shaping the
              future of business. Get exclusive benefits and help build a
              stronger economic foundation for our community.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              <div className="hidden bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Star className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Exclusive Access
                </h3>
                <p className="text-gray-300 text-sm">
                  Early access to new features and premium tools
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Shield className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Special Recognition
                </h3>
                <p className="text-gray-300 text-sm">
                  Stand out with VIP member recognition
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Users className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  BOD
                  <br />
                  Credits
                </h3>
                <p className="text-gray-300 text-sm">
                  Earn and use BOD credits for platform benefits
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Zap className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Priority Placement
                </h3>
                <p className="text-gray-300 text-sm">
                  Get priority placement in search results
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Eye className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Enhanced Visibility
                </h3>
                <p className="text-gray-300 text-sm">
                  Higher directory placement and category prioritization
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Camera className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Rich Media Profile
                </h3>
                <p className="text-gray-300 text-sm">
                  Showcase your business with an image gallery and promo video
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Share2 className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Social Connectivity
                </h3>
                <p className="text-gray-300 text-sm">
                  Link directly to your social media profiles
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <Gift className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Promotional Tools
                </h3>
                <p className="text-gray-300 text-sm">
                  Promote special offers and announcements
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Comprehensive Listing
                </h3>
                <p className="text-gray-300 text-sm">
                  Full public directory access with basic profile and analytics
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6 mb-8">
              <PlanPromotion
                planName="VIP Plan"
                regularPrice={getPlanConfigByName("VIP Plan")?.price || 99} // Use config price
                className="flex flex-col items-center"
              />
            </div>

            <button
              onClick={handleBecomeVIPClick}
              disabled={loading}
              className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed text-black rounded-lg transition-colors font-semibold"
            >
              {loading ? "Processing..." : "Become VIP"}
            </button>
          </div>
        </div>

        {/* Simplified VIP Members Section */}
        {(businessesLoading || vipBusinesses.length > 0) && (
          <div id="vip-businesses" className="mb-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Crown className="h-8 w-8 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">
                  Our VIP Members
                </h2>
                <Crown className="h-8 w-8 text-yellow-400" />
              </div>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Meet our VIP members who enjoy exclusive benefits and are
                building the future of Black business together.
              </p>
              {totalBusinesses > 0 && (
                <p className="text-gray-500 mt-4">
                  {totalBusinesses} VIP member{totalBusinesses !== 1 ? "s" : ""}{" "}
                  and growing
                </p>
              )}
            </div>

            {businessesLoading ? (
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-900 rounded-xl p-6 animate-pulse"
                  >
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
            ) : vipBusinesses.length > 0 ? (
              <>
                <div className="space-y-6 mb-8">
                  {paginatedBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className="bg-gray-900 rounded-xl p-6"
                    >
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
                              <Crown className="h-5 w-5 text-yellow-400" />
                            </div>
                            {business.category && (
                              <span className="text-sm text-gray-400">
                                {business.category}
                              </span>
                            )}
                          </div>
                          {business.tagline && (
                            <p className="text-gray-300 mb-2 font-medium">
                              {business.tagline}
                            </p>
                          )}
                          <p className="text-gray-300 mb-4">
                            {truncateDescription(
                              business.description || "",
                              250
                            )}
                          </p>
                          <div className="flex gap-4">
                            <button className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex gap-2">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-lg ${
                              currentPage === pageNum
                                ? "bg-white text-black"
                                : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Crown className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No VIP members found</p>
                <p className="text-gray-500 text-sm">
                  Be among the first to join our VIP member community!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal - same as PricingPage */}
        {isPaymentModalOpen && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            planName="VIP Plan"
            amount={getPlanConfigByName("VIP Plan")?.price || 99}
            description="VIP Plan - Annual Subscription"
            customerEmail={user?.email || ""}
            onSuccess={(paymentData: any) => {
              setIsPaymentModalOpen(false);
              navigate("/business/new", {
                state: {
                  planPrice: getPlanConfigByName("VIP Plan")?.price || 99,
                  planName: "VIP Plan",
                  paymentCompleted: true,
                  transactionId: paymentData.transactionId,
                },
              });
            }}
          />
        )}
      </div>

      {/* Add the CTA section */}
      <BusinessCTA className="mt-8" />
    </Layout>
  );
};

export default VIPPage;
