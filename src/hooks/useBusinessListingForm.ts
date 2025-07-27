import { useState, useMemo, useCallback } from "react";
import { BusinessCategory, BusinessTag, BusinessTagLabels } from "../types";
import { supabase } from "../lib/supabase";
import { isValidEmail } from "../utils/emailUtils";

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
  const [error, setError] = useState(null);
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
      Object.entries(BusinessCategory)
        .map(([key, value]) => [value, value]) // Use value for both key and display
        .sort((a, b) => a[0].localeCompare(b[0])),
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

      // Validate email format
      if (formData.email && !isValidEmail(formData.email)) {
        throw new Error("Invalid email format");
      }

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
        .select("id, name")
        .eq("owner_id", user.id)
        .eq("name", formData.name)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingBusiness) {
        throw new Error(
          `A business with the name "${formData.name}" already exists. Please choose a different name.`
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
        owner_id: user.id,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
      };

      // Handle category
      if (formData.category) {
        businessData.category = formData.category;
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

      // Create new business
      const { data: newBusiness, error: insertError } = await supabase
        .from("businesses")
        .insert([businessData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log("✅ Business created:", newBusiness);

      // Update the subscription creation logic
      // All new businesses (after payment) are paid plans: Starter, Enhanced, or VIP
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
        } else {
          console.log("✅ Found subscription plan:", subscriptionPlan);

          // Create subscription record
          const subscriptionData = {
            business_id: newBusiness.id,
            plan_id: subscriptionPlan.id,
            status: "active",
            payment_status: "paid",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 year from now
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
          } else {
            console.log("✅ Subscription created:", subscription);

            // Update business with subscription_id AND subscription_status
            if (subscription) {
              const { error: updateError } = await supabase
                .from("businesses")
                .update({
                  subscription_id: subscription.id,
                  subscription_status: planName, // Will be "Starter Plan", "Enhanced Plan", or "VIP Plan"
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
              } else {
                console.log("✅ Business subscription updated successfully");
              }
            }
          }
        }
      } else {
        console.error("❌ No plan name provided for business creation");
        throw new Error("No subscription plan specified");
      }

      // Navigate to dashboard with success message
      navigate("/dashboard", {
        state: {
          newBusiness: true,
          businessName: newBusiness.name,
        },
      });
    } catch (error: any) {
      console.error("Error submitting business:", error);
      setError(error.message || "Failed to submit business. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [formData, planName, navigate, isPremiumPlan]);

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
  };
}
