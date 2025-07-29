import { useState, useMemo, useCallback } from "react";
import { BusinessCategory, BusinessTag, BusinessTagLabels } from "../types";
import { supabase } from "../lib/supabase";
import {
  validateBusinessInfoStep,
  validateBusinessLocationStep,
  validateBusinessMediaStep,
  validateBusinessPremiumStep,
  validateBusinessSubmission,
} from "../utils/businessListingUtils";

export function useBusinessListingForm(location: any, navigate: any) {
  // Plan and payment state
  const planPrice = location.state?.planPrice;
  const planName = location.state?.planName;
  const paymentCompleted = location.state?.paymentCompleted || false;

  // Stepper logic
  const isPremiumPlan = planName === "Enhanced Plan" || planName === "VIP Plan";
  const steps = useMemo(() => {
    const baseSteps = [];
    if (!paymentCompleted) baseSteps.push("payment");
    baseSteps.push("info", "location", "media");
    if (isPremiumPlan) baseSteps.push("premium_features");
    baseSteps.push("summary");
    return baseSteps;
  }, [isPremiumPlan, paymentCompleted]);
  const [currentStep, setCurrentStep] = useState(steps[0]);
  const currentStepIndex = steps.indexOf(currentStep);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    category: "",
    categories: [] as string[], // Add this line
    tags: [] as BusinessTag[],
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    region: "",
    country: "",
    postalCode: "",
    imageUrl: "",
    galleryImages: [] as Array<{ id: string; url: string; file?: File }>, // Add this
    promoVideoUrl: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      theBlackTube: "",
      fanbase: "",
    },
  });

  // UI and modal state
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [similarBusinesses, setSimilarBusinesses] = useState([]);
  const [nameCheckPerformed, setNameCheckPerformed] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountedAmount, setDiscountedAmount] = useState(planPrice || 0);
  const [error, setError] = useState<string | null>(null);
  const [businessIdToUpdate, setBusinessIdToUpdate] = useState(() => {
    if (location.state?.businessIdToUpdate)
      return location.state.businessIdToUpdate;
    const sessionValue = sessionStorage.getItem("businessIdToUpdate");
    if (sessionValue) return sessionValue;
    return null;
  });

  // Tag/category logic
  const maxTagsAllowed = useMemo(() => (isPremiumPlan ? 20 : 5), [planName]);
  const availableTags = useMemo(() => {
    if (!formData.category) {
      return Object.entries(BusinessTagLabels).map(([value, label]) => ({
        value,
        label,
      }));
    }
    // ...categoryTagMap logic (copy from your page)...
    return [];
  }, [formData.category]);
  const sortedCategories = useMemo(
    () =>
      Object.entries(BusinessCategory).sort((a, b) => a[1].localeCompare(b[1])),
    []
  );

  // Handlers (implement as in your page, but inside the hook)
  const handleChange = useCallback(
    (e: any) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (error) setError(null);
    },
    [error]
  );

  const handleSocialLinkChange = useCallback(
    (e: any) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [name]: value },
      }));
      if (error) setError(null);
    },
    [error]
  );

  const handleTagChange = useCallback(
    (selectedOptions: any) => {
      const newTags = selectedOptions
        .slice(0, maxTagsAllowed)
        .map((option: any) => option.value);
      setFormData((prev) => ({ ...prev, tags: newTags }));
      if (error) setError(null);
    },
    [maxTagsAllowed, error]
  );

  // Submit business data - actual implementation
  const submitBusinessData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Submitting business data:", formData);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Check for existing business with same name
      const { data: existingBusiness, error: checkError } = await supabase
        .from("businesses")
        .select("id, name, subscription_status")
        .eq("owner_id", user.id)
        .eq("name", formData.name)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      let businessToUpdate = null;
      let isUpdate = false;

      // If business exists and we have a businessIdToUpdate, check if it's the same business
      if (existingBusiness && businessIdToUpdate) {
        if (existingBusiness.id === businessIdToUpdate) {
          // Same business, proceed with update
          businessToUpdate = existingBusiness;
          isUpdate = true;
          console.log("✅ Updating existing business:", existingBusiness.id);
        } else {
          // Different business with same name, throw error
          throw new Error(
            `A business with the name "${formData.name}" already exists. Please choose a different name.`
          );
        }
      } else if (existingBusiness && !businessIdToUpdate) {
        // Business exists but no update ID provided, throw error
        throw new Error(
          `A business with the name "${formData.name}" already exists. Please choose a different name.`
        );
      } else if (!existingBusiness && businessIdToUpdate) {
        // No business found but we have update ID, this shouldn't happen
        console.warn(
          "Business ID provided but no business found with that name"
        );
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

      // Handle category - UPDATED VERSION
      if (
        isPremiumPlan &&
        formData.categories &&
        formData.categories.length > 0
      ) {
        // For premium plans:
        // - First category is mandatory and goes to 'category' enum field
        // - All categories (including first) go to 'categories' array field
        businessData.category = formData.categories[0]; // Primary category (mandatory)
        businessData.categories = formData.categories; // All categories (1-3)
      } else if (formData.category) {
        // For basic plans: single category only
        businessData.category = formData.category;
        businessData.categories = [formData.category]; // Keep array consistent
      } else {
        // No category selected - this should be caught by validation
        throw new Error("At least one category is required");
      }

      // Only include premium features for Enhanced and VIP plans
      if (isPremiumPlan) {
        if (formData.promoVideoUrl) {
          businessData.promo_video_url = formData.promoVideoUrl;
        }
        if (formData.socialLinks) {
          // Sanitize social links to prevent regex errors
          const sanitizedSocialLinks: any = {};
          Object.entries(formData.socialLinks).forEach(([key, value]) => {
            if (value && typeof value === "string" && value.trim() !== "") {
              // Only include non-empty string values
              sanitizedSocialLinks[key] = value.trim();
            }
          });
          businessData.social_links =
            Object.keys(sanitizedSocialLinks).length > 0
              ? sanitizedSocialLinks
              : null;
        }
      }

      console.log("Final businessData to submit:", businessData);

      let newBusiness;

      if (isUpdate && businessToUpdate) {
        // Update existing business
        const { data: updatedBusiness, error: updateError } = await supabase
          .from("businesses")
          .update(businessData)
          .eq("id", businessToUpdate.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        newBusiness = updatedBusiness;
        console.log("✅ Business updated:", newBusiness);
      } else {
        // Create new business
        const { data: createdBusiness, error: insertError } = await supabase
          .from("businesses")
          .insert([businessData])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        newBusiness = createdBusiness;
        console.log("✅ Business created:", newBusiness);
      }

      // Handle subscription logic
      if (planName) {
        console.log("🔍 Creating subscription for paid plan:", planName);

        // Get the subscription plan ID
        const { data: subscriptionPlan, error: planError } = await supabase
          .from("subscription_plans")
          .select("id")
          .eq("name", planName)
          .single();

        if (planError) {
          console.error("❌ Could not find subscription plan:", planError);
          throw new Error(`Subscription plan '${planName}' not found`);
        }

        console.log("✅ Found subscription plan:", subscriptionPlan);

        // Check if subscription already exists for this business
        const { data: existingSubscription, error: subCheckError } =
          await supabase
            .from("subscriptions")
            .select("id, status")
            .eq("business_id", newBusiness.id)
            .single();

        if (subCheckError && subCheckError.code !== "PGRST116") {
          throw subCheckError;
        }

        if (existingSubscription) {
          // Update existing subscription
          const { error: subUpdateError } = await supabase
            .from("subscriptions")
            .update({
              plan_id: subscriptionPlan.id,
              status: "active",
              payment_status: "paid",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .eq("id", existingSubscription.id);

          if (subUpdateError) {
            console.error("❌ Could not update subscription:", subUpdateError);
            throw new Error(
              `Failed to update subscription: ${subUpdateError.message}`
            );
          }

          console.log("✅ Subscription updated:", existingSubscription.id);
        } else {
          // Create new subscription
          const subscriptionData = {
            business_id: newBusiness.id,
            plan_id: subscriptionPlan.id,
            status: "active",
            payment_status: "paid",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
          };

          const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .insert([subscriptionData])
            .select()
            .single();

          if (subError) {
            console.error("❌ Could not create subscription:", subError);
            throw new Error(
              `Failed to create subscription: ${subError.message}`
            );
          }

          console.log("✅ Subscription created:", subscription);

          // Update business with subscription_id
          if (subscription) {
            const { error: updateError } = await supabase
              .from("businesses")
              .update({
                subscription_id: subscription.id,
                subscription_status: "active",
                plan_name: planName, // Add this line to include the plan name
              })
              .eq("id", newBusiness.id);

            if (updateError) {
              console.error(
                "❌ Error updating business subscription:",
                updateError
              );
              throw new Error(
                `Failed to update business subscription: ${updateError.message}`
              );
            }
            console.log("✅ Business subscription updated successfully");
          }
        }
      } else {
        console.error("❌ No plan name provided for business creation");
        throw new Error("No subscription plan specified");
      }

      // Clear the businessIdToUpdate from session storage after successful submission
      if (isUpdate) {
        sessionStorage.removeItem("businessIdToUpdate");
        setBusinessIdToUpdate(null);
      }

      // Navigate to dashboard with success message
      navigate("/dashboard", {
        state: {
          newBusiness: !isUpdate,
          updatedBusiness: isUpdate,
          businessName: newBusiness.name,
        },
      });
    } catch (error: any) {
      console.error("Error submitting business:", error);
      setError(error.message || "Failed to submit business. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [formData, planName, navigate, isPremiumPlan, businessIdToUpdate]);

  // Enhanced step-by-step validation with detailed error messages
  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case "info":
        const infoResult = validateBusinessInfoStep(formData, isPremiumPlan);
        if (!infoResult.isValid) {
          setError(infoResult.error!);
          return false;
        }
        setError(null);
        return true;

      case "location":
        const locationResult = validateBusinessLocationStep(formData);
        if (!locationResult.isValid) {
          setError(locationResult.error!);
          return false;
        }
        setError(null);
        return true;

      case "media":
        const mediaResult = validateBusinessMediaStep(formData);
        if (!mediaResult.isValid) {
          setError(mediaResult.error!);
          return false;
        }
        setError(null);
        return true;

      case "premium_features":
        const premiumResult = validateBusinessPremiumStep(formData);
        if (!premiumResult.isValid) {
          setError(premiumResult.error!);
          return false;
        }
        setError(null);
        return true;

      case "summary":
        const submissionResult = validateBusinessSubmission(
          formData,
          isPremiumPlan
        );
        if (!submissionResult.isValid) {
          setError(submissionResult.error!);
          return false;
        }
        setError(null);
        return true;

      default:
        return true;
    }
  }, [currentStep, formData, isPremiumPlan, setError]);

  // Enhanced Next Step Handler
  const handleNextStep = useCallback(() => {
    if (validateCurrentStep()) {
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
        setError(null); // Clear any previous errors
      }
    }
  }, [validateCurrentStep, currentStep, steps, setCurrentStep, setError]);

  // Return all state and handlers needed by the page
  return {
    formData,
    setFormData,
    error,
    setError,
    currentStep,
    setCurrentStep,
    steps,
    currentStepIndex,
    loading,
    showPaymentModal,
    setShowPaymentModal,
    showDuplicateModal,
    setShowDuplicateModal,
    similarBusinesses,
    nameCheckPerformed,
    discountInfo,
    discountedAmount,
    planName,
    planPrice,
    paymentCompleted,
    handleChange,
    handleSocialLinkChange,
    handleTagChange,
    maxTagsAllowed,
    availableTags,
    sortedCategories,
    isPremiumPlan,
    submitBusinessData,
    isCurrentStepValid: validateCurrentStep, // Expose the validation function
    businessIdToUpdate,
    handleNextStep, // Expose the new handler
  };
}
