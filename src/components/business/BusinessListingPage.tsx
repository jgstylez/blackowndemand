import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "../layout/Layout";
import { Business, BusinessCategory } from "../../types";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { extractVideoSrc } from "../../utils/videoUtils";
import { useBusinessListingForm } from "../../hooks/useBusinessListingForm";
import BusinessInfoStep from "./listing/BusinessInfoStep";
import BusinessLocationStep from "./listing/BusinessLocationStep";
import BusinessMediaStep from "./listing/BusinessMediaStep";
import BusinessPremiumStep from "./listing/BusinessPremiumStep";
import BusinessSummaryStep from "./listing/BusinessSummaryStep";
import { useUnifiedPayment } from "../../hooks/useUnifiedPayment";

interface Step {
  id: number;
  label: string;
  isValid: (formData: any) => boolean;
  component: React.ComponentType<any>;
}

const steps: Step[] = [
  {
    id: 1,
    label: "Business Info",
    isValid: (formData) => !!formData.name && !!formData.email,
    component: BusinessInfoStep,
  },
  {
    id: 2,
    label: "Location",
    isValid: (formData) =>
      !!formData.country && !!formData.state && !!formData.city,
    component: BusinessLocationStep,
  },
  {
    id: 3,
    label: "Media",
    isValid: (formData) => !!formData.imageUrl,
    component: BusinessMediaStep,
  },
  {
    id: 4,
    label: "Premium",
    isValid: () => true,
    component: BusinessPremiumStep,
  },
  {
    id: 5,
    label: "Summary",
    isValid: () => true,
    component: BusinessSummaryStep,
  },
];

const BusinessListingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateBusinesses, setDuplicateBusinesses] = useState<Business[]>(
    []
  );

  const [planName, setPlanName] = useState<string | null>(null);
  const [planPrice, setPlanPrice] = useState<number | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number | null>(null);
  const [appliedDiscountCode] = useState<string | null>(null);
  const [businessIdToUpdate, setBusinessIdToUpdate] = useState<string | null>(
    null
  );

  const { formData, setFormData } = useBusinessListingForm(location, navigate);

  // Use unified payment hook
  const { handlePayment } = useUnifiedPayment({
    onSuccess: async () => {
      // Handle post-payment business creation/update
      await handlePaymentSuccess();
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    },
  });

  useEffect(() => {
    // Check if payment was completed (from location state)
    if (location.state?.paymentCompleted) {
      setPlanName(location.state.planName || "Basic Plan");
      setPlanPrice(location.state.planPrice || 0);
      setDiscountedAmount(location.state.planPrice || 0);
      setBusinessIdToUpdate(location.state.businessIdToUpdate || null);
    }

    // Check if businessIdToUpdate is passed as search parameter
    const businessId = searchParams.get("businessId");
    if (businessId) {
      setBusinessIdToUpdate(businessId);
    }
  }, [location.state, searchParams]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startPayment = async (
    selectedPlanName: string,
    selectedPlanPrice: number
  ) => {
    setPlanName(selectedPlanName);
    setPlanPrice(selectedPlanPrice);
    setDiscountedAmount(selectedPlanPrice);

    // Use unified payment hook instead of showing modal
    await handlePayment({
      planName: selectedPlanName,
      planPrice: selectedPlanPrice,
      successUrl: `${
        window.location.origin
      }/business/new?success=true&plan=${encodeURIComponent(selectedPlanName)}`,
      cancelUrl: `${window.location.origin}/business/new?canceled=true`,
    });
  };

  const handlePaymentSuccess = async () => {
    console.log("🟢 handlePaymentSuccess invoked");
    console.log(
      "🔵 Current state - planName:",
      planName,
      "discountedAmount:",
      discountedAmount,
      "businessIdToUpdate:",
      businessIdToUpdate
    );

    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error("User not authenticated");
      }

      const subscriptionData = {
        plan_name: planName,
        plan_price: planPrice,
        discounted_amount: discountedAmount,
        discount_code: appliedDiscountCode,
        user_id: user.id,
      };

      console.log("🔵 Subscription Data:", subscriptionData);

      const businessData: any = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description || null,
        city: formData.city,
        state: formData.state,
        zip_code: formData.postalCode,
        country: formData.country,
        website_url: formData.website,
        phone: formData.phone,
        email: formData.email,
        image_url: formData.imageUrl,
        tags:
          Array.isArray(formData.tags) && formData.tags.length > 0
            ? formData.tags
            : [],
        is_active: true,
        is_verified: true,
      };

      // Handle category
      if (
        formData.category &&
        Object.values(BusinessCategory).includes(
          formData.category as BusinessCategory
        )
      ) {
        businessData.category = formData.category;
      }

      // Only include premium features for Enhanced and VIP plans
      if (planName === "Enhanced Plan" || planName === "VIP Plan") {
        if (formData.promoVideoUrl) {
          businessData.promo_video_url = extractVideoSrc(
            formData.promoVideoUrl
          );
        }
        if (formData.socialLinks) {
          businessData.social_links = formData.socialLinks;
        }
      }

      console.log("🔵 Final businessData to submit:", businessData);

      if (businessIdToUpdate) {
        // Update existing business
        const { data: updatedBusiness, error: updateError } = await supabase
          .from("businesses")
          .update(businessData)
          .eq("id", businessIdToUpdate)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        console.log("✅ Business updated:", updatedBusiness);
      } else {
        // Create new business
        businessData.owner_id = user.id;
        businessData.subscription_plans = planName;
        businessData.is_claimed = true;
        businessData.claimed_at = new Date().toISOString();

        const { data: newBusiness, error: insertError } = await supabase
          .from("businesses")
          .insert([businessData])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        console.log("✅ Business created:", newBusiness);

        // Navigate to dashboard with success message
        navigate("/dashboard", {
          state: {
            newBusiness: true,
            businessName: newBusiness.name,
          },
        });
      }

      // Payment successful
    } catch (error) {
      console.error("❌ Error in payment success handler:", error);
      setError("Failed to create business listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const StepComponent = steps[currentStep - 1].component;
    return (
      <StepComponent
        formData={formData}
        setFormData={setFormData}
        nextStep={nextStep}
        startPayment={startPayment}
        checkDuplicateBusiness={checkDuplicateBusiness}
        duplicateBusinesses={duplicateBusinesses}
        setDuplicateBusinesses={setDuplicateBusinesses}
      />
    );
  };

  const checkDuplicateBusiness = async (name: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, description, email, image_url, migration_source, claimed_at"
        )
        .or(`name.ilike.%${name}%, email.eq.${email}`)
        .limit(10);

      if (error) throw error;

      setDuplicateBusinesses((data as Business[]) || []);
      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking for duplicate businesses:", error);
      return false;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-20">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold text-white mb-8">
            List Your Business
          </h1>

          {error && (
            <div className="bg-red-500/20 text-red-500 rounded-md p-4 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 text-green-500 rounded-md p-4 mb-4">
              <Check className="inline-block mr-2" />
              {success}
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between text-gray-400">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center py-2 ${
                    step.id === currentStep ? "text-white font-semibold" : ""
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>
            <div className="bg-gray-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-white h-1 rounded-full"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {renderStepContent()}

          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="inline-block mr-2" />
              Previous
            </button>
            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                disabled={loading}
                className="bg-white text-black py-2 px-4 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="inline-block ml-2" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BusinessListingPage;
