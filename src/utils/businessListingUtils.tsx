// Unified business validation functions
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateBusinessInfoStep = (
  formData: any,
  isPremiumPlan: boolean = false
): ValidationResult => {
  if (!formData.name?.trim()) {
    return { isValid: false, error: "Business name is required" };
  }
  if (!formData.description?.trim()) {
    return { isValid: false, error: "Business description is required" };
  }

  if (isPremiumPlan) {
    if (!formData.categories || formData.categories.length === 0) {
      return { isValid: false, error: "At least one category is required" };
    }
  } else {
    if (!formData.category) {
      return { isValid: false, error: "Category is required" };
    }
  }

  return { isValid: true };
};

export const validateBusinessLocationStep = (
  formData: any
): ValidationResult => {
  if (!formData.country?.trim()) {
    return { isValid: false, error: "Country is required" };
  }
  if (!formData.state?.trim()) {
    return { isValid: false, error: "State/Province/Region is required" };
  }
  if (!formData.city?.trim()) {
    return { isValid: false, error: "City is required" };
  }
  if (!formData.postalCode?.trim()) {
    return { isValid: false, error: "Postal/ZIP code is required" };
  }

  return { isValid: true };
};

export const validateBusinessMediaStep = (formData: any): ValidationResult => {
  if (!formData.email?.trim()) {
    return { isValid: false, error: "Business email is required" };
  }
  if (!formData.phone?.trim()) {
    return { isValid: false, error: "Business phone is required" };
  }

  // Email validation
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(formData.email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  // Website validation (optional but validate format if provided)
  const websiteValue = formData.website?.trim();
  if (websiteValue && websiteValue.length > 0) {
    if (
      !websiteValue.startsWith("http://") &&
      !websiteValue.startsWith("https://")
    ) {
      return {
        isValid: false,
        error: "Website URL must start with http:// or https://",
      };
    }
  }

  return { isValid: true };
};

export const validateBusinessPremiumStep = (
  formData: any
): ValidationResult => {
  // Premium features are optional, but validate if provided
  if (formData.promoVideoUrl && formData.promoVideoUrl.trim()) {
    if (
      !formData.promoVideoUrl.includes("theblacktube.com") &&
      !formData.promoVideoUrl.includes("youtube.com") &&
      !formData.promoVideoUrl.includes("vimeo.com")
    ) {
      return {
        isValid: false,
        error:
          "Please provide a valid video URL from The BlackTube, YouTube, or Vimeo",
      };
    }
  }

  return { isValid: true };
};

export const validateBusinessSubmission = (
  formData: any,
  isPremiumPlan: boolean = false
): ValidationResult => {
  // Validate all required steps
  const infoValidation = validateBusinessInfoStep(formData, isPremiumPlan);
  if (!infoValidation.isValid) return infoValidation;

  const locationValidation = validateBusinessLocationStep(formData);
  if (!locationValidation.isValid) return locationValidation;

  const mediaValidation = validateBusinessMediaStep(formData);
  if (!mediaValidation.isValid) return mediaValidation;

  const premiumValidation = validateBusinessPremiumStep(formData);
  if (!premiumValidation.isValid) return premiumValidation;

  // Business hours are optional, so no validation needed
  // They will be included in the submission if provided

  return { isValid: true };
};

// Legacy functions for backward compatibility (deprecated)
export const validateInfoStep = (
  formData: any,
  setError: (msg: string) => void
): boolean => {
  const result = validateBusinessInfoStep(formData);
  if (!result.isValid) {
    setError(result.error!);
  }
  return result.isValid;
};

export const validateLocationStep = (
  formData: any,
  setError: (msg: string) => void
): boolean => {
  const result = validateBusinessLocationStep(formData);
  if (!result.isValid) {
    setError(result.error!);
  }
  return result.isValid;
};

export const validateMediaStep = (
  formData: any,
  setError: (msg: string) => void
): boolean => {
  const result = validateBusinessMediaStep(formData);
  if (!result.isValid) {
    setError(result.error!);
  }
  return result.isValid;
};
