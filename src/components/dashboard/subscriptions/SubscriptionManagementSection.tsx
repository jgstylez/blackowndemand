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
import PaymentMethodUpdateModal from "./PaymentMethodUpdateModal";

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
  subscription_created_at?: string; // Add this field
}

// Update the PaymentMethod interface
interface PaymentMethod {
  cardNumber: string;
  expiryDate: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
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
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
    billingZip: "",
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState<string | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [
    selectedBusinessForPaymentUpdate,
    setSelectedBusinessForPaymentUpdate,
  ] = useState<{
    id: string;
    name: string;
  } | null>(null);

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

      // Use the function instead of the view
      const { data: viewData, error: viewError } = await supabase.rpc(
        "get_paid_subscriptions_overview"
      );

      if (viewError) {
        console.error("Function query error:", viewError);
      }

      console.log("Paid subscriptions overview data:", viewData);

      // Also check businesses table for businesses with subscription_status (including cancelled)
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, subscription_status, plan_name, subscription_id")
        .in(
          "id",
          businesses.map((b) => b.id)
        );

      if (businessError) {
        console.error("Business query error:", businessError);
      }

      console.log("Businesses with subscription status:", businessData);

      // Combine both data sources
      const allSubscriptions: Subscription[] = [];

      // Add subscriptions from the function
      if (viewData && Array.isArray(viewData)) {
        viewData.forEach((subscription: any) => {
          allSubscriptions.push({
            id: subscription.subscription_id || "",
            business_id: subscription.business_id || "",
            business_name: subscription.business_name || "",
            plan_name: subscription.plan_name || "Unknown Plan",
            status: subscription.subscription_status || "unknown",
            next_billing_date: subscription.current_period_end || "",
            last_payment_date: subscription.subscription_created_at || "",
            payment_method_last_four: "", // Not available in this view
            stripe_subscription_id: subscription.subscription_id || undefined,
            nmi_subscription_id: undefined, // Not available in this view
            plan_price: subscription.plan_price || 0,
            total_amount: subscription.plan_price || 0,
            provider: "ecomPayments" as const, // Default assumption
            subscription_created_at: subscription.subscription_created_at || "",
          });
        });
      }

      // Add businesses with subscription_status that aren't in the view (including cancelled)
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
              subscription_created_at: undefined,
            };
          });
        allSubscriptions.push(...businessSubscriptions);
      }

      console.log("Combined subscription data:", allSubscriptions);
      setSubscriptions(allSubscriptions);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setError("Failed to load subscription data");
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
    } else if (name === "cvv") {
      // Only allow numeric and max 4 digits
      const numeric = value.replace(/\D/g, "").slice(0, 4);
      setPaymentMethod((prev) => ({ ...prev, [name]: numeric }));
    } else {
      setPaymentMethod((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdatePaymentMethod = (
    businessId: string,
    businessName: string
  ) => {
    setSelectedBusinessForPaymentUpdate({ id: businessId, name: businessName });
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodUpdateSuccess = () => {
    // Refresh the subscriptions data
    fetchSubscriptions();
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
  const handleUpgradeSuccess = (customMessage?: string) => {
    fetchSubscriptions();
    onUpdate();
    setSuccess(customMessage || "Plan upgraded successfully!");
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

                {/* Next Billing Date - Always show a meaningful date */}
                <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                  <div className="mr-3 p-2 bg-gray-700 rounded-full">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">
                      {subscription.status.toLowerCase() === "cancelled"
                        ? "Active Until"
                        : "Next Payment"}
                    </p>
                    <p
                      className={`font-medium ${
                        subscription.status.toLowerCase() === "cancelled"
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      {(() => {
                        // If we have a next_billing_date and it's not empty, use it
                        if (
                          subscription.next_billing_date &&
                          subscription.next_billing_date.trim() !== ""
                        ) {
                          return new Date(
                            subscription.next_billing_date
                          ).toLocaleDateString();
                        }

                        // If we have subscription_created_at, calculate next billing date
                        if (subscription.subscription_created_at) {
                          const createdDate = new Date(
                            subscription.subscription_created_at
                          );
                          const nextBilling = new Date(createdDate);
                          nextBilling.setFullYear(
                            nextBilling.getFullYear() + 1
                          );
                          return nextBilling.toLocaleDateString();
                        }

                        // Fallback: calculate based on current date + 1 year
                        const nextYear = new Date();
                        nextYear.setFullYear(nextYear.getFullYear() + 1);
                        return nextYear.toLocaleDateString();
                      })()}
                    </p>
                  </div>
                </div>

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

              {/* Action Buttons - Updated UI */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800">
                {/* Left side - View Business */}
                <button
                  onClick={() =>
                    navigate(`/business/${subscription.business_id}`)
                  }
                  className="flex items-center justify-center px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 border border-gray-700 hover:border-gray-600"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Business
                </button>

                {/* Right side - Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  {/* Manage Plan button */}
                  <button
                    onClick={() => handlePlanUpgrade(subscription.business_id)}
                    className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Plan
                  </button>

                  {/* Stripe Portal button */}
                  {subscription.provider === "stripe" &&
                    subscription.stripe_subscription_id && (
                      <button
                        onClick={() =>
                          handleOpenStripePortal(subscription.business_id)
                        }
                        disabled={portalLoading === subscription.business_id}
                        className="flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {portalLoading === subscription.business_id
                          ? "Loading..."
                          : "Stripe Portal"}
                      </button>
                    )}

                  {/* Update Payment Method Button - EcomPayments only */}
                  {subscription.provider === "ecomPayments" && (
                    <button
                      onClick={() =>
                        handleUpdatePaymentMethod(
                          subscription.business_id,
                          subscription.business_name
                        )
                      }
                      className="flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment
                    </button>
                  )}
                </div>
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

      {/* Replace the inline form with the modal */}
      {showPaymentMethodModal && selectedBusinessForPaymentUpdate && (
        <PaymentMethodUpdateModal
          isOpen={showPaymentMethodModal}
          onClose={() => {
            setShowPaymentMethodModal(false);
            setSelectedBusinessForPaymentUpdate(null);
          }}
          businessId={selectedBusinessForPaymentUpdate.id}
          businessName={selectedBusinessForPaymentUpdate.name}
          onSuccess={handlePaymentMethodUpdateSuccess}
        />
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
          onSuccess={() => handleUpgradeSuccess()}
          onCancelSuccess={() =>
            handleUpgradeSuccess(
              "Subscription cancelled successfully. Your business listing will remain active until the end of your current billing period."
            )
          }
        />
      )}
    </div>
  );
};

export default SubscriptionManagementSection;
