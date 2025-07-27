import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { Check, X, Star, Users, TrendingUp, Shield, Crown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePaymentProvider } from "../hooks/usePaymentProvider";
import { useUnifiedPayment } from "../hooks/useUnifiedPayment";
import PaymentModal from "../components/payment/PaymentModal";
import PlanPromotion from "../components/pricing/PlanPromotion";
// Add this import
import { PAYMENT_CONFIG, getAllPlans } from "../config/paymentConfig";

type PlanName = "Starter Plan" | "Enhanced Plan" | "VIP Plan";

const PricingPage = () => {
  const { user } = useAuth();
  const { provider } = usePaymentProvider();
  const navigate = useNavigate();
  const location = useLocation();
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
    service: "",
  });
  const [contactFormLoading, setContactFormLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    planPrice: number;
    planName: PlanName;
  } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Get plans from config
  const plans = getAllPlans();

  // Check for Stripe checkout results
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
      setLocalError("Payment was canceled. Please try again.");
      setTimeout(() => setLocalError(null), 5000);
    }
  }, [location, navigate]);

  const { handlePayment } = useUnifiedPayment({
    onSuccess: (result) => {
      console.log("Payment successful:", result);
    },
    onError: (error) => {
      console.error("Payment failed:", error.userFriendlyMessage);
    },
  });

  // Handle payment success
  function handlePaymentSuccess(result: any) {
    setIsPaymentModalOpen(false);

    if (selectedPlan) {
      navigate("/business/new", {
        state: {
          planPrice: selectedPlan.planPrice,
          planName: selectedPlan.planName,
          paymentCompleted: true,
          transactionId: result.transactionId,
        },
      });
    }
  }

  const handlePlanSelect = async (planName: PlanName) => {
    // Get plan from config instead of hardcoded price
    const plan = plans.find((p) => p.name === planName);
    if (!plan) {
      console.error(`Plan ${planName} not found in config`);
      return;
    }

    if (!user) {
      // Store selected plan in session storage for after login
      sessionStorage.setItem(
        "selectedPlan",
        JSON.stringify({ planPrice: plan.price, planName })
      );
      navigate("/login");
      return;
    }

    setSelectedPlan({ planPrice: plan.price, planName });
    setLocalError(null);

    try {
      const result = await handlePayment({
        planName,
        planPrice: plan.price, // Use plan.price from config
        provider,
        showPaymentModal: true,
      });

      if (result && result.provider === "ecomPayments") {
        setIsPaymentModalOpen(true);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      setLocalError("Failed to initiate payment. Please try again.");
    }
  };

  const handlePaymentModalSuccess = async (paymentData: any) => {
    // This will be called when PaymentModal completes successfully
    handlePaymentSuccess(paymentData);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormLoading(true); // Updated

    try {
      // Send email using Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(contactForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      setSuccess(true);
      setTimeout(() => {
        setShowContactForm(false);
        setSuccess(false);
        setContactForm({
          name: "",
          email: "",
          message: "",
          service: "",
        });
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setContactFormLoading(false); // Updated
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Pricing Plans</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Exclusive pricing plans for business owners looking to showcase
            their businesses and connect with customers on our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Starter Plan */}
          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="mb-8">
              <span className="text-sm text-gray-400">Basic Listing</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3">
                {plans[0].name}
              </h2>
              <p className="text-gray-400 text-sm">{plans[0].description}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">
                  ${(plans[0].price / 12).toFixed(0)}
                </span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                (billed annually at ${plans[0].price})
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {plans[0].features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <Check className="h-5 w-5 text-white mr-3" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanSelect(plans[0].name as PlanName)}
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
            >
              Select Plan
            </button>
          </div>

          {/* Enhanced Plan */}
          <div className="bg-gray-900 rounded-2xl p-8 ring-2 ring-white relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-white text-black px-3 py-1 rounded-full text-sm">
                Most Popular
              </span>
            </div>

            <div className="mb-8">
              <span className="text-sm text-gray-400">More Benefits</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3">
                {plans[1].name}
              </h2>
              <p className="text-gray-400 text-sm">{plans[1].description}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">
                  ${(plans[1].price / 12).toFixed(0)}
                </span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                (billed annually at ${plans[1].price})
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {plans[1].features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <Check className="h-5 w-5 text-white mr-3" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanSelect(plans[1].name as PlanName)}
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
            >
              Select Plan
            </button>
          </div>

          {/* VIP Plan */}
          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="mb-8">
              <span className="text-sm text-gray-400">Exclusive Access</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3 flex items-center gap-2">
                {plans[2].name}
                <Crown className="h-6 w-6 text-yellow-400" />
              </h2>
              <p className="text-gray-400 text-sm">{plans[2].description}</p>
            </div>

            <div className="mb-8 pt-0">
              <PlanPromotion
                planName={plans[2].name}
                regularPrice={plans[2].price}
              />
            </div>

            <ul className="space-y-4 mb-8">
              {plans[2].features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <Check className="h-5 w-5 text-white mr-3" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanSelect(plans[2].name as PlanName)}
              className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg transition-colors font-semibold"
            >
              Become VIP
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Global Reach
            </h3>
            <p className="text-gray-400">
              Connect with customers worldwide looking specifically for
              Black-owned businesses.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Verified Status
            </h3>
            <p className="text-gray-400">
              Build trust with customers through our business verification
              system.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Premium Features
            </h3>
            <p className="text-gray-400">
              Access professional tools and features to showcase your business
              effectively.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Growth Tools
            </h3>
            <p className="text-gray-400">
              Get insights and analytics to help your business thrive in the
              digital economy.
            </p>
          </div>
        </div>

        {/* Contact Sales Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Contact Sales Team
                </h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">Message Sent!</p>
                  <p className="text-gray-400">
                    Our sales team will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Interested Service
                    </label>
                    <select
                      required
                      value={contactForm.service}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          service: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    >
                      <option value="">Select a service</option>
                      <option value="featured">Featured Listings</option>
                      <option value="category">Category Sponsorships</option>
                      <option value="advertising">Sitewide Advertising</option>
                      <option value="bundle">Cross-Promotion Bundles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                      placeholder="Tell us about your needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactFormLoading} // Updated
                    className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {contactFormLoading ? "Sending..." : "Send Message"}{" "}
                    {/* Updated */}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Payment Modal for Ecom Payments */}
        {isPaymentModalOpen && selectedPlan && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={handlePaymentModalSuccess}
            amount={selectedPlan.planPrice}
            description={`${selectedPlan.planName} - Annual Subscription`}
            planName={selectedPlan.planName}
            customerEmail={user?.email}
          />
        )}

        {/* Error Display */}
        {localError && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {localError}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PricingPage;
