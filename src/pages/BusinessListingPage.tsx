import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import PaymentModal from "../components/payment/PaymentModal";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useBusinessListingForm } from "../hooks/useBusinessListingForm";
import DuplicateBusinessModal from "../components/business/DuplicateBusinessModal";
import DiscountCodeInput from "../components/payment/DiscountCodeInput";
import BusinessInfoStep from "../components/business/listing/BusinessInfoStep";
import BusinessLocationStep from "../components/business/listing/BusinessLocationStep";
import BusinessMediaStep from "../components/business/listing/BusinessMediaStep";
import BusinessPremiumStep from "../components/business/listing/BusinessPremiumStep";
import BusinessSummaryStep from "../components/business/listing/BusinessSummaryStep";
import { BusinessTagLabels } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { extractVideoSrc } from "../utils/videoUtils";
import { BusinessCategory } from "../types";
import {
  validateBusinessInfoStep,
  validateBusinessLocationStep,
  validateBusinessMediaStep,
  validateBusinessPremiumStep,
  validateBusinessSubmission,
} from "../utils/businessListingUtils";

const BusinessListingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Use the custom form hook for all business listing logic
  const {
    formData,
    setFormData,
    error,
    setError,
    currentStep,
    setCurrentStep,
    currentStepIndex,
    loading,
    showPaymentModal,
    setShowPaymentModal,
    showDuplicateModal,
    setShowDuplicateModal,
    similarBusinesses,
    discountInfo,
    discountedAmount,
    planName,
    planPrice,
    handleChange,
    handleSocialLinkChange,
    handleTagChange,
    availableTags,
    maxTagsAllowed,
    sortedCategories,
    isPremiumPlan,
    submitBusinessData,
    steps,

    businessIdToUpdate,
  } = useBusinessListingForm(location, navigate);

  // Add missing handlers that aren't in the hook yet
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create a temporary URL for preview
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imageUrl });
      console.log("Image uploaded:", file.name);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again." as any);
    }
  };

  const handlePaymentClick = () => {
    setShowPaymentModal(true);
  };

  const handleApplyDiscount = (discountInfo: any) => {
    if (discountInfo?.valid) {
      // Apply discount to the amount
      const discountedPrice =
        discountInfo.discountType === "percentage"
          ? planPrice * (1 - discountInfo.discountValue / 100)
          : planPrice - discountInfo.discountValue;

      // Update the discounted amount (you'll need to add this to your hook)
      console.log("Discount applied:", discountInfo);
      console.log("New price:", discountedPrice);
    } else {
      setError("Invalid discount code. Please try again." as any);
    }
  };

  const handleRemoveDiscount = () => {
    // Reset discount and amount to original price
    console.log("Discount removed");
    // Reset discounted amount to planPrice (you'll need to add this to your hook)
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log("🟢 PaymentModal onSuccess triggered with:", paymentData);

    // Close payment modal
    setShowPaymentModal(false);

    // Enhanced business creation/update logic
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Prepare business data (without subscription_plans)
      const businessData: any = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description || null,
        city: formData.city,
        state: formData.state,
        zip_code: formData.postalCode,
        country: formData.country,
        website_url: formData.website?.trim() || null, // FIX: Send null for empty website
        phone: formData.phone,
        email: formData.email,
        image_url: formData.imageUrl,
        tags:
          Array.isArray(formData.tags) && formData.tags.length > 0
            ? formData.tags
            : [],
        is_active: true,
        is_verified: true,
        owner_id: user.id,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
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

      console.log(" Final businessData to submit:", businessData);

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

        // Navigate to dashboard with success message
        navigate("/dashboard", {
          state: {
            businessUpdated: true,
            businessName: updatedBusiness.name,
          },
        });
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
    } catch (error) {
      console.error("❌ Error in payment success handler:", error);
      setError("Failed to create business listing. Please try again." as any);
    }
  };

  // Enhanced step-by-step validation with detailed error messages
  const validateCurrentStep = () => {
    switch (currentStep) {
      case "info":
        // Validate Business Info Step
        if (!formData.name?.trim()) {
          setError("Business name is required");
          return false;
        }
        if (!formData.description?.trim()) {
          setError("Business description is required");
          return false;
        }
        if (isPremiumPlan) {
          if (!formData.categories || formData.categories.length === 0) {
            setError("At least one category is required");
            return false;
          }
        } else {
          if (!formData.category) {
            setError("Category is required");
            return false;
          }
        }
        setError(null);
        return true;

      case "location":
        // Validate Location Step
        if (!formData.country?.trim()) {
          setError("Country is required");
          return false;
        }
        if (!formData.state?.trim()) {
          setError("State/Province/Region is required");
          return false;
        }
        if (!formData.city?.trim()) {
          setError("City is required");
          return false;
        }
        if (!formData.postalCode?.trim()) {
          setError("Postal/ZIP code is required");
          return false;
        }
        setError(null);
        return true;

      case "media":
        // Validate Media & Contact Step
        if (!formData.email?.trim()) {
          setError("Business email is required");
          return false;
        }
        if (!formData.phone?.trim()) {
          setError("Business phone is required");
          return false;
        }

        // Email validation
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
          setError("Please enter a valid email address");
          return false;
        }

        setError(null);
        return true;

      case "premium_features":
        // Premium features are optional, but validate if provided
        if (formData.promoVideoUrl && formData.promoVideoUrl.trim()) {
          if (
            !formData.promoVideoUrl.includes("theblacktube.com") &&
            !formData.promoVideoUrl.includes("youtube.com") &&
            !formData.promoVideoUrl.includes("vimeo.com")
          ) {
            setError(
              "Please provide a valid video URL from The BlackTube, YouTube, or Vimeo"
            );
            return false;
          }
        }
        setError(null);
        return true;

      case "summary":
        // Final validation before submission
        return validateCurrentStep(); // Re-validate all steps

      default:
        return true;
    }
  };

  // Enhanced Next Step Handler
  const handleNextStep = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      // Error is already set by validateCurrentStep
      return;
    }

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      setError(null); // Clear any previous errors
    }
  };

  // Add missing state setters
  const setNameCheckPerformed = (value: boolean) => {
    // This should be managed in your hook, but for now we'll just log it
    console.log("Name check performed:", value);
    // You can add this to your form state if needed
  };

  const renderStep = () => {
    switch (currentStep) {
      case "info":
        return (
          <BusinessInfoStep
            {...({
              formData,
              setFormData,
              error: error || "",
              setError: setError as any,
              maxTagsAllowed,
              availableTags: availableTags as any,
              handleTagChange,
              handleChange,
              sortedCategories,
              isPremiumPlan,
            } as any)}
          />
        );
      case "location":
        return (
          <BusinessLocationStep
            {...({
              formData,
              setFormData,
              countries: [],
              states: [],
              cities: [],
              loadingCountries: false,
              loadingStates: false,
              loadingCities: false,
              selectedCountry: formData.country,
              selectedState: formData.state,
              selectedCity: formData.city,
              handleCountryChange: (country: any) =>
                setFormData({ ...formData, country }),
              handleStateChange: (state: any) =>
                setFormData({ ...formData, state }),
              handleCityChange: (city: any) =>
                setFormData({ ...formData, city }),
              handleLocationInputChange: (field: any, value: any) =>
                setFormData({ ...formData, [field]: value }),
            } as any)}
          />
        );
      case "media":
        const defaultCountryIso = formData.country ? "US" : undefined; // Simple fallback
        return (
          <BusinessMediaStep
            formData={formData}
            setFormData={setFormData as any}
            error={error || ""}
            setError={setError as any}
            handleImageUpload={handleImageUpload}
            handleChange={handleChange}
            handleSocialLinkChange={handleSocialLinkChange}
            defaultCountryIso={defaultCountryIso}
          />
        );
      case "premium_features":
        return (
          <BusinessPremiumStep
            {...({
              formData,
              setFormData,
              handleChange,
              handleSocialLinkChange,
              planName,
            } as any)}
          />
        );
      case "summary":
        return (
          <BusinessSummaryStep
            {...({
              formData,
              planName,
              planPrice,
              maxTagsAllowed,
              BusinessTagLabels,
              handleSubmit: submitBusinessData,
              loading,
              error: error || "",
            } as any)}
          />
        );
      case "payment":
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Order Summary
              </h3>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Annual Subscription</span>
                <div className="text-right">
                  <span
                    className={`${
                      discountInfo && (discountInfo as any)?.valid
                        ? "line-through text-gray-500"
                        : "text-white"
                    }`}
                  >
                    ${planPrice}
                  </span>
                  <p className="text-sm text-gray-500">
                    (${(planPrice / 12).toFixed(2)} per month)
                  </p>
                </div>
              </div>

              {discountInfo && (discountInfo as any)?.valid && (
                <>
                  <div className="flex justify-between mb-4">
                    <span className="text-green-400">
                      {(discountInfo as any).discountType === "percentage"
                        ? `Discount (${(discountInfo as any).discountValue}%)`
                        : "Discount"}
                    </span>
                    <span className="text-green-400">
                      -${(planPrice - discountedAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white font-medium">
                        ${discountedAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Discount Code */}
            <DiscountCodeInput
              onApply={handleApplyDiscount}
              onRemove={handleRemoveDiscount}
              planName={planName}
            />

            <div>
              <button
                onClick={handlePaymentClick}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Complete Payment"}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout
      title="List Your Business | BlackOWNDemand"
      description="List your Black-owned business on our platform"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index < steps.length - 1 ? "flex-1" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStepIndex
                      ? "bg-white text-black"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? "bg-white" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span
                key={step}
                className={`text-xs ${
                  step === currentStep ? "text-white" : "text-gray-400"
                }`}
              >
                {step === "payment" && "Payment"}
                {step === "info" && "Info"}
                {step === "location" && "Location"}
                {step === "media" && "Media"}
                {step === "premium_features" && "Premium"}
                {step === "summary" && "Review"}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white mb-8">
            {currentStep === "payment" && "Complete Payment"}
            {currentStep === "info" && "Business Information"}
            {currentStep === "location" && "Business Location"}
            {currentStep === "media" && "Media & Contact"}
            {currentStep === "premium_features" && "Premium Features"}
            {currentStep === "summary" && "Review & Submit"}
          </h1>

          {/* Error message display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(steps[currentStepIndex - 1])}
              disabled={currentStepIndex === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Previous
            </button>
            {currentStep !== "payment" && (
              <button
                onClick={
                  currentStep === "summary"
                    ? submitBusinessData
                    : handleNextStep
                }
                disabled={loading}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Submitting..."
                  : currentStep === "summary"
                  ? "Submit"
                  : "Next"}
                {currentStep !== "summary" && (
                  <ArrowRight className="h-5 w-5 ml-2" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {/* Payment Modal: onSuccess is always set to handlePaymentSuccess, ensuring business creation logic runs for both $0 and paid flows */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(paymentData) => {
            console.log(
              "🟢 PaymentModal onSuccess triggered with:",
              paymentData
            );
            handlePaymentSuccess(paymentData);
          }}
          amount={discountedAmount}
          description={`Annual ${planName || "Business Listing"} subscription`}
          planName={planName || "Business Listing"}
          customerEmail={formData.email}
        />

        {/* Duplicate Business Modal */}
        <DuplicateBusinessModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          onContinue={() => {
            setShowDuplicateModal(false);
            setNameCheckPerformed(true);
          }}
          businesses={similarBusinesses}
        />
      </div>
    </Layout>
  );
};

export default BusinessListingPage;
