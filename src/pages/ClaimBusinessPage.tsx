import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Shield, CheckCircle, ArrowRight } from "lucide-react";
import Layout from "../components/layout/Layout";
import BusinessSearchModal from "../components/verification/BusinessSearchModal";
import EmailVerificationModal from "../components/verification/EmailVerificationModal";
import EmailConfirmationModal from "../components/verification/EmailConfirmationModal";
import PromotionOfferModal from "../components/verification/PromotionOfferModal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { getPlanConfigByName } from "../config/paymentConfig";

interface Business {
  id: string;
  name: string;
  description: string;
  email: string;
  city: string;
  state: string;
  category: string;
  image_url: string;
  migration_source: string;
  claimed_at: string | null;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  originalPlanId: string;
  originalPlanName: string;
  originalPrice: number;
  promotionalPrice: number;
  startDate: string;
  endDate: string | null;
}

const ClaimBusinessPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] =
    useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [finalEmail, setFinalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migratedPlanId, setMigratedPlanId] = useState<string | null>(null);
  const [vipPlanId, setVipPlanId] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  // Fetch plan IDs and promotion when component mounts
  useEffect(() => {
    fetchPlansAndPromotion();
  }, []);

  const fetchPlansAndPromotion = async () => {
    try {
      // Fetch the Migrated plan ID
      const { data: migratedPlan, error: migratedError } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("name", "Migrated")
        .single();

      if (migratedError) {
        console.error("Error fetching Migrated plan:", migratedError);
      } else if (migratedPlan) {
        setMigratedPlanId(migratedPlan.id);
      }

      // Get VIP plan from config instead of database
      const vipPlan = getPlanConfigByName("VIP Plan");
      const starterPlan = getPlanConfigByName("Starter Plan");

      if (vipPlan && starterPlan) {
        // Create a mock promotion using config prices
        const mockPromotion: Promotion = {
          id: "promo-vip-special",
          name: "VIP Special Offer",
          description:
            "Get our premium VIP plan at the price of our Starter plan",
          originalPlanId: "vip-plan-id", // You might need to get this from DB
          originalPlanName: "VIP Plan",
          originalPrice: vipPlan.price, // Use config price
          promotionalPrice: starterPlan.price, // Use config price instead of hardcoded 12
          startDate: new Date().toISOString(),
          endDate: null,
        };

        setPromotion(mockPromotion);
      }
    } catch (err) {
      console.error("Failed to fetch plans and promotion:", err);
    }
  };

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    setShowSearchModal(false);
    setShowVerificationModal(true);
  };

  const handleVerificationSuccess = (email: string) => {
    setVerifiedEmail(email);
    setShowVerificationModal(false);
    setShowEmailConfirmationModal(true);
  };

  const handleEmailConfirmation = (email: string) => {
    setFinalEmail(email);
    setShowEmailConfirmationModal(false);

    // If we have a promotion, show the promotion modal
    if (promotion) {
      setShowPromotionModal(true);
    } else {
      // Otherwise, proceed with claiming using the default Migrated plan
      handleClaimBusiness(migratedPlanId);
    }
  };

  const handleAcceptPromotion = (promotionId: string) => {
    // In a real app, you would record that the user accepted this promotion
    console.log(`User accepted promotion: ${promotionId}`);

    // Claim the business with the VIP plan
    handleClaimBusiness(vipPlanId);
  };

  const handleDeclinePromotion = () => {
    // Claim the business with the default Migrated plan
    handleClaimBusiness(migratedPlanId);
  };

  const handleClaimBusiness = async (planId: string | null) => {
    if (!selectedBusiness || !user || !planId) {
      setError("Missing required information to claim business");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a subscription for the selected plan
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .insert({
            business_id: selectedBusiness.id,
            plan_id: planId,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 year from now
            payment_status: "paid",
          })
          .select()
          .single();

      if (subscriptionError) {
        console.error("Subscription creation error:", subscriptionError);
        throw subscriptionError;
      }

      // Update the business email if it was changed
      if (finalEmail !== selectedBusiness.email) {
        const { error: updateError } = await supabase
          .from("businesses")
          .update({ email: finalEmail })
          .eq("id", selectedBusiness.id);

        if (updateError) {
          console.error("Error updating business email:", updateError);
          // Continue with the claim process even if email update fails
        }
      }

      // Claim the business with the subscription ID
      const { error: claimError } = await supabase.rpc("claim_business", {
        business_id: selectedBusiness.id,
        user_id: user.id,
        new_subscription_id: subscriptionData.id,
      });

      if (claimError) {
        console.error("Business claim error:", claimError);
        throw claimError;
      }

      // Redirect to dashboard
      navigate("/dashboard?claimed=true");
    } catch (err) {
      console.error("Error claiming business:", err);
      setError(err instanceof Error ? err.message : "Failed to claim business");
    } finally {
      setLoading(false);
      setShowPromotionModal(false);
    }
  };

  const handleStartClaim = () => {
    if (!user) {
      // Store the intended action and redirect to login
      sessionStorage.setItem("pendingAction", "claim-business");
      navigate("/login");
      return;
    }

    setShowSearchModal(true);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-12 w-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">
              Claim Your Business
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            As a BDN Legacy Member, you automatically gain visibility on this
            platform. Now you can take control of your business listing and
            unlock powerful tools to grow your presence in our directory at a
            special discounted price.
          </p>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-12">
          <div className="text-center">
            <button
              onClick={handleStartClaim}
              disabled={loading}
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Start Claiming Your Business"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>

            <p className="text-gray-500 text-sm mt-4">
              Don't see your business?{" "}
              <a href="/contact" className="text-white hover:text-gray-300">
                Contact us
              </a>{" "}
              for assistance.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-green-500/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Verified Status
            </h3>
            <p className="text-gray-400">
              Get a verified badge that builds trust with customers and shows
              authenticity.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-blue-500/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Business Dashboard
            </h3>
            <p className="text-gray-400">
              Access a easy to use dashboard to manage your listing, view
              analytics, and update information.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-purple-500/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Enhanced Features
            </h3>
            <p className="text-gray-400">
              Unlock additional features like enhanced listings, promotional
              tools, and priority placement.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="hidden bg-gray-900 rounded-2xl p-8 lg:p-12 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Search & Find
              </h3>
              <p className="text-gray-400">
                Search for your business using your business name, email, or
                description.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Verify Ownership
              </h3>
              <p className="text-gray-400">
                Verify your ownership by confirming your business email address
                with a verification code.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Access Dashboard
              </h3>
              <p className="text-gray-400">
                Get instant access to your business dashboard and start managing
                your listing.
              </p>
            </div>
          </div>
        </div>

        {/* Modals */}
        <BusinessSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onBusinessSelect={handleBusinessSelect}
        />

        {selectedBusiness && (
          <EmailVerificationModal
            isOpen={showVerificationModal}
            onClose={() => setShowVerificationModal(false)}
            business={selectedBusiness}
            onVerificationSuccess={handleVerificationSuccess}
          />
        )}

        {selectedBusiness && (
          <EmailConfirmationModal
            isOpen={showEmailConfirmationModal}
            onClose={() => setShowEmailConfirmationModal(false)}
            business={selectedBusiness}
            verifiedEmail={verifiedEmail}
            onSubmit={handleEmailConfirmation}
          />
        )}

        {promotion && (
          <PromotionOfferModal
            isOpen={showPromotionModal}
            onClose={() => setShowPromotionModal(false)}
            promotion={promotion}
            onAccept={handleAcceptPromotion}
            onDecline={handleDeclinePromotion}
          />
        )}
      </div>
    </Layout>
  );
};

export default ClaimBusinessPage;
