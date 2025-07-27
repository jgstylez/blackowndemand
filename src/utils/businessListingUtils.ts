// Utility functions for Business Listing Page
// Move validation, tag/category mapping, and other pure functions here.

export const validateInfoStep = (
  formData: any,
  setError: (msg: string) => void
): boolean => {
  if (!formData.name.trim()) {
    setError("Business name is required");
    return false;
  }
  if (!formData.description.trim()) {
    setError("Business description is required");
    return false;
  }
  if (!formData.category) {
    setError("Please select a business category");
    return false;
  }
  return true;
};

export const validateLocationStep = (
  formData: any,
  setError: (msg: string) => void
): boolean => {
  if (!formData.country.trim()) {
    setError("Country is required");
    return false;
  }
  if (!formData.city.trim()) {
    setError("City is required");
    return false;
  }
  if (!formData.state.trim()) {
    setError("State/Province/Region is required");
    return false;
  }
  if (!formData.postalCode.trim()) {
    setError("Postal code is required");
    return false;
  }
  return true;
};

export const validateMediaStep = (
  formData: any,
  setError: (msg: string) => void
): boolean => {
  if (!formData.imageUrl) {
    setError("Business image is required");
    return false;
  }
  if (!formData.website.trim()) {
    setError("Website URL is required");
    return false;
  }
  if (!formData.email.trim()) {
    setError("Business email is required");
    return false;
  }
  if (!formData.phone.trim()) {
    setError("Business phone is required");
    return false;
  }
  if (
    !formData.website.startsWith("http://") &&
    !formData.website.startsWith("https://")
  ) {
    setError("Website URL must start with http:// or https://");
    return false;
  }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(formData.email)) {
    setError("Please enter a valid email address");
    return false;
  }
  return true;
};

// Add more utilities as needed
