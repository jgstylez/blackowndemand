
import { useState } from 'react';

export interface BusinessFormData {
  name: string;
  tagline: string;
  description: string;
  category: string;
  city: string;
  state: string;
  zipCode: string;
  postalCode: string;
  country: string;
  websiteUrl: string;
  website: string;
  phone: string;
  email: string;
  imageUrl: string;
  promoVideoUrl: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    theBlackTube?: string;
    fanbase?: string;
  };
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  amenities: string[];
  paymentMethods: string[];
  categories: string[];
  tags: string[];
}

const defaultFormData: BusinessFormData = {
  name: '',
  tagline: '',
  description: '',
  category: '',
  city: '',
  state: '',
  zipCode: '',
  postalCode: '',
  country: 'USA',
  websiteUrl: '',
  website: '',
  phone: '',
  email: '',
  imageUrl: '',
  promoVideoUrl: '',
  socialLinks: {},
  businessHours: {},
  amenities: [],
  paymentMethods: [],
  categories: [],
  tags: []
};

export const useBusinessListingForm = () => {
  const [formData, setFormData] = useState<BusinessFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (updates: Partial<BusinessFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setError(null);
  };

  return {
    formData,
    setFormData,
    updateFormData,
    loading,
    setLoading,
    error,
    setError,
    resetForm
  };
};
