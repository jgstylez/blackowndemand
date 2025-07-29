import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Edit2,
  ExternalLink,
  DollarSign,
  Shield,
  Crown,
  Building2,
  Eye,
  Zap,
  CreditCard as CreditCardIcon,
  Settings,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { callEdgeFunction } from "../../../lib/edgeFunctions";
import { usePaymentProvider } from "../../../hooks/usePaymentProvider";
import { getPlanConfigByName } from "../../../config/paymentConfig";
import { Business } from "../../../types";
import { useNavigate } from "react-router-dom";
import PlanUpgradeModal from "./PlanUpgradeModal";

interface SubscriptionManagementSectionProps {
  businesses: Business[];
  loading: boolean;
  onUpdate: () => void;
}

// Update the interface to match the actual Supabase view structure
interface PaidSubscriptionView {
  subscription_id: string | null;
  business_id: string | null;
  business_name: string | null;
  owner_email: string | null;
  owner_id: string | null;
  payment_status: string | null;
  plan_id: string | null;
  status: string | null;
  subscription_created_at: string | null;
  subscription_plans: {
    id: string;
    name: string;
    price: number;
  };
}

interface Subscription {
  id: string;
  business_id: string;
  business_name: string;
  plan_name: string;
  status: string;
  next_billing_date: string;
  last_payment_date: string;
  payment_method_last_four: string;
  stripe_subscription_id?: string;
  nmi_subscription_id?: string;
  plan_price?: number;
  total_amount?: number;
  provider: "stripe" | "ecomPayments" | "unknown";
}

interface PaymentMethod {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingZip: string;
}

const SubscriptionManagementSection: React.FC<
  SubscriptionManagementSectionProps
> = ({ businesses, loading, onUpdate }) => {
  const { provider } = usePaymentProvider();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(
    null
  );
  const [portalLoading, setPortalLoading] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    billingZip: "",
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState<string | null>(null);

  useEffect(() => {
    if (businesses.length > 0) {
      fetchSubscriptions();
    } else {
      setLoadingSubscriptions(false);
      setSubscriptions([]);
    }
  }, [businesses]);

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      setError(null);

      console.log("Current user businesses:", businesses);
      console.log(
        "Business IDs:",
        businesses.map((b) => b.id)
      );

      // First, get subscriptions from the paid_subscriptions_overview view
      const { data: viewData, error: viewError } = await supabase
        .from("paid_subscriptions_overview")
        .select(
          `
          *,
          subscription_plans!inner(
            id,
            name,
            price
          )
        `
        )
        .in(
          "business_id",
          businesses.map((b) => b.id)
        )
        .order("current_period_start", { ascending: false });

      if (viewError) {
        console.error("View query error:", viewError);
      }

      console.log("Paid subscriptions overview data:", viewData);

      // Also check businesses table for businesses with active subscription_status
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, subscription_status, plan_name, subscription_id")
        .in(
          "id",
          businesses.map((b) => b.id)
        )
        .eq("subscription_status", "active");

      if (businessError) {
        console.error("Business query error:", businessError);
      }

      console.log("Businesses with active subscription:", businessData);

      // Combine both data sources
      const allSubscriptions: Subscription[] = [];

      // Add subscriptions from the view
      if (viewData && viewData.length > 0) {
        const typedViewData = viewData as PaidSubscriptionView[];
        const viewSubscriptions = typedViewData.map((subscription) => {
          let providerType: "stripe" | "ecomPayments" | "unknown" =
            "ecomPayments";
          if (
            subscription.subscription_id &&
            subscription.subscription_id.startsWith("sub_")
          ) {
            providerType = "stripe";
          }

          return {
            id: subscription.subscription_id || subscription.business_id || "",
            business_id: subscription.business_id || "",
            business_name: subscription.business_name || "",
            plan_name: subscription.subscription_plans?.name || "Unknown Plan",
            status: subscription.status || "unknown",
            next_billing_date: subscription.subscription_created_at || "",
            last_payment_date: subscription.subscription_created_at || "",
            payment_method_last_four: "",
            stripe_subscription_id:
              providerType === "stripe"
                ? subscription.subscription_id || undefined
                : undefined,
            nmi_subscription_id:
              providerType === "ecomPayments"
                ? subscription.subscription_id || undefined
                : undefined,
            plan_price: subscription.subscription_plans?.price || 0,
            total_amount: subscription.subscription_plans?.price || 0,
            provider: providerType,
          };
        });
        allSubscriptions.push(...viewSubscriptions);
      }

      // Add businesses with active subscription_status that aren't in the view
      if (businessData && businessData.length > 0) {
        const businessSubscriptions = businessData
          .filter(
            (business) =>
              !allSubscriptions.some((sub) => sub.business_id === business.id)
          )
          .map((business) => {
            // Get the actual plan price from the configuration
            const planConfig = getPlanConfigByName(business.plan_name || "");
            const planPrice = planConfig?.price || 0;

            return {
              id: business.subscription_id || business.id,
              business_id: business.id,
              business_name: business.name,
              plan_name: business.plan_name || "Unknown Plan",
              status: business.subscription_status || "active",
              next_billing_date: "",
              last_payment_date: "",
              payment_method_last_four: "",
              stripe_subscription_id: undefined,
              nmi_subscription_id: business.subscription_id || undefined,
              plan_price: planPrice,
              total_amount: planPrice,
              provider: "ecomPayments" as const,
            };
          });
        allSubscriptions.push(...businessSubscriptions);
      }

      console.log("Combined subscription data:", allSubscriptions);
      setSubscriptions(allSubscriptions);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim();
      setPaymentMethod((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === "expiryDate") {
      const cleaned = value.replace(/\D/g, "");
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      }
      setPaymentMethod((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setPaymentMethod((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdatePaymentMethod = async (
    e: React.FormEvent,
    businessId: string
  ) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (
        !paymentMethod.cardNumber ||
        !paymentMethod.expiryDate ||
        !paymentMethod.cvv
      ) {
        throw new Error("Please fill out all required fields");
      }

      const result = await callEdgeFunction<{
        success: boolean;
        message: string;
        last4: string;
      }>({
        functionName: "update-payment-method",
        payload: {
          business_id: businessId,
          payment_method: {
            card_number: paymentMethod.cardNumber,
            expiry_date: paymentMethod.expiryDate,
            cvv: paymentMethod.cvv,
            billing_zip: paymentMethod.billingZip,
          },
        },
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to update payment method");
      }

      setSuccess("Payment method updated successfully");
      setShowUpdateForm(null);

      setPaymentMethod({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        billingZip: "",
      });

      fetchSubscriptions();
      onUpdate();
    } catch (err) {
      console.error("Error updating payment method:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update payment method"
      );
    }
  };

  const handleCancelSubscription = async (businessId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const result = await callEdgeFunction<{
        success: boolean;
        message: string;
      }>({
        functionName: "cancel-subscription",
        payload: {
          business_id: businessId,
        },
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to cancel subscription");
      }

      setSuccess("Subscription cancelled successfully");
      setShowCancelConfirm(null);

      fetchSubscriptions();
      onUpdate();
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    }
  };

  const handleOpenStripePortal = async (businessId: string) => {
    setPortalLoading(businessId);
    setError(null);

    try {
      const result = await callEdgeFunction<{
        success: boolean;
        url?: string;
        error?: string;
      }>({
        functionName: "create-customer-portal",
        payload: {
          businessId,
          returnUrl: `${window.location.origin}/dashboard?tab=subscriptions`,
        },
      });

      if (!result.success || !result.url) {
        throw new Error(
          result.error || "Failed to create customer portal session"
        );
      }

      window.open(result.url, "_blank");
    } catch (err) {
      console.error("Error opening Stripe portal:", err);
      setError(
        err instanceof Error ? err.message : "Failed to open customer portal"
      );
    } finally {
      setPortalLoading(null);
    }
  };

  // Add this function to handle plan upgrade
  const handlePlanUpgrade = (businessId: string) => {
    setShowUpgradeModal(businessId);
  };

  // Add this function to handle upgrade success
  const handleUpgradeSuccess = () => {
    fetchSubscriptions();
    onUpdate();
    setSuccess("Plan upgraded successfully!");
    setTimeout(() => setSuccess(null), 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-500";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "cancelled":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "vip plan":
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case "enhanced plan":
        return <Shield className="h-5 w-5 text-blue-400" />;
      default:
        return <CreditCard className="h-5 w-5 text-white" />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "stripe":
        return <Zap className="h-4 w-4 text-purple-400" />;
      case "ecomPayments":
        return <CreditCardIcon className="h-4 w-4 text-blue-400" />;
      default:
        return <CreditCardIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading || loadingSubscriptions) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">
          Subscriptions & Billing
        </h2>
        <p className="text-gray-400 mt-1">
          Manage your business subscriptions and payment methods
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length > 0 ? (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getPlanIcon(subscription.plan_name)}
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      {subscription.business_name}
                    </h3>
                    <p className="text-gray-400">{subscription.plan_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      subscription.status
                    )}`}
                  >
                    {subscription.status === "active"
                      ? "Active"
                      : subscription.status.charAt(0).toUpperCase() +
                        subscription.status.slice(1)}
                  </span>
                  {getProviderIcon(subscription.provider)}
                </div>
              </div>

              {/* Subscription Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                  <div className="mr-3 p-2 bg-gray-700 rounded-full">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total</p>
                    <p className="text-white font-medium">
                      $
                      {subscription.total_amount ||
                        subscription.plan_price ||
                        0}
                      /year
                    </p>
                  </div>
                </div>

                {subscription.next_billing_date && (
                  <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                    <div className="mr-3 p-2 bg-gray-700 rounded-full">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Next Payment</p>
                      <p className="text-white font-medium">
                        {new Date(
                          subscription.next_billing_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {subscription.payment_method_last_four && (
                  <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                    <div className="mr-3 p-2 bg-gray-700 rounded-full">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Payment Method</p>
                      <p className="text-white font-medium">
                        •••• {subscription.payment_method_last_four}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                  <div className="mr-3 p-2 bg-gray-700 rounded-full">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Provider</p>
                    <p className="text-white font-medium capitalize">
                      {subscription.provider}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Streamlined */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    navigate(`/business/${subscription.business_id}`)
                  }
                  className="flex items-center px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Business
                </button>

                {/* Manage Plan button - now includes cancel functionality */}
                <button
                  onClick={() => handlePlanUpgrade(subscription.business_id)}
                  className="flex items-center px-3 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Plan
                </button>

                {subscription.provider === "stripe" &&
                  subscription.stripe_subscription_id && (
                    <button
                      onClick={() =>
                        handleOpenStripePortal(subscription.business_id)
                      }
                      disabled={portalLoading === subscription.business_id}
                      className="flex items-center px-3 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {portalLoading === subscription.business_id
                        ? "Loading..."
                        : "Manage in Stripe Portal"}
                    </button>
                  )}

                {subscription.provider === "ecomPayments" && (
                  <button
                    onClick={() => setShowUpdateForm(subscription.business_id)}
                    className="flex items-center px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Update Payment Method
                  </button>
                )}

                {/* Remove the separate Cancel Subscription button */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Active Subscriptions
          </h3>
          <p className="text-gray-400 mb-6">
            You don't have any active subscriptions. Add a business listing to
            get started.
          </p>
          <button
            onClick={() => navigate("/pricing")}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
          >
            <Building2 className="h-5 w-5 mr-2" />
            Add Business Listing
          </button>
        </div>
      )}

      {/* Update Payment Method Form */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Update Payment Method
              </h3>
              <button
                onClick={() => setShowUpdateForm(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => handleUpdatePaymentMethod(e, showUpdateForm)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentMethod.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={paymentMethod.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={paymentMethod.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Billing ZIP Code
                </label>
                <input
                  type="text"
                  name="billingZip"
                  value={paymentMethod.billingZip}
                  onChange={handleInputChange}
                  placeholder="12345"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUpdateForm(null)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Update Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove the Cancel Subscription Confirmation modal since it's now in PlanUpgradeModal */}

      {/* Plan Upgrade Modal */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          isOpen={!!showUpgradeModal}
          onClose={() => setShowUpgradeModal(null)}
          currentPlan={
            subscriptions.find((s) => s.business_id === showUpgradeModal)
              ?.plan_name || ""
          }
          businessId={showUpgradeModal}
          businessName={
            subscriptions.find((s) => s.business_id === showUpgradeModal)
              ?.business_name || ""
          }
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
};

export default SubscriptionManagementSection;
