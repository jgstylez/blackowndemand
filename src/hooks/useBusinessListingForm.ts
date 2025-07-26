import { useState, useMemo, useCallback } from "react";
import { BusinessCategory, BusinessTag, BusinessTagLabels } from "../types";
import { supabase } from "../lib/supabase";

export function useBusinessListingForm(location, navigate) {
  // Plan and payment state
  const planPrice = location.state?.planPrice;
  const planName = location.state?.planName;
  const paymentCompleted = location.state?.paymentCompleted || false;

  // Stepper logic
  const isPremiumPlan = planName === "Enhanced" || planName === "VIP Plan";
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
      Object.entries(BusinessCategory).sort((a, b) => a[1].localeCompare(b[1])),
    []
  );

  // Handlers (implement as in your page, but inside the hook)
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (error) setError(null);
    },
    [error]
  );

  const handleSocialLinkChange = useCallback(
    (e) => {
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
    (selectedOptions) => {
      const newTags = selectedOptions
        .slice(0, maxTagsAllowed)
        .map((option) => option.value);
      setFormData((prev) => ({ ...prev, tags: newTags }));
      if (error) setError(null);
    },
    [maxTagsAllowed, error]
  );

  // Submit business data placeholder - implement actual submission logic
  const submitBusinessData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Submitting business data:", formData);

      // TODO: Implement actual submission logic here
      // This should handle both creating new business and updating existing one

      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Business submitted successfully!");

      // Navigate to success page
      navigate("/business/success", {
        state: {
          businessName: formData.name,
          planName: planName,
        },
      });
    } catch (error: any) {
      console.error("Error submitting business:", error);
      setError(error.message || "Failed to submit business. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [formData, planName, navigate]);

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
