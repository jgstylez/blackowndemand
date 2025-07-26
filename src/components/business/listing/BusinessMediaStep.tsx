import React, { useState } from "react";
import { Upload } from "lucide-react";

interface BusinessFormData {
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  email: string;
  phone: string;
  website: string;
  city: string;
  state: string;
  region: string;
  country: string;
  postalCode: string;
  imageUrl: string;
  promoVideoUrl: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    theBlackTube: string;
    fanbase: string;
  };
}

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface BusinessMediaStepProps {
  formData: BusinessFormData;
  setFormData: (data: BusinessFormData) => void;
  updateFormData?: (updates: Partial<BusinessFormData>) => void;
  // Add this prop:
  defaultCountryIso?: string;
  error?: string;
  setError?: (msg: string) => void;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleSocialLinkChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BusinessMediaStep: React.FC<BusinessMediaStepProps> = ({
  formData,
  setFormData,
  updateFormData,
  defaultCountryIso, // <-- new prop
  error,
  setError,
  handleImageUpload,
  handleChange,
  handleSocialLinkChange,
}) => {
  const [uploadingImage, setUploadingImage] = useState(false);

  // Rename the local function:
  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Image upload logic here
      console.log("Uploading image:", file.name);

      // Update form data with image URL
      const imageUrl = URL.createObjectURL(file);
      if (updateFormData) {
        updateFormData({ imageUrl });
      } else {
        setFormData({ ...formData, imageUrl });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  // Phone validation handler
  const handlePhoneChange = (value: string | undefined) => {
    setFormData({ ...formData, phone: value || "" });
    if (setError) {
      if (value && !isValidPhoneNumber(value)) {
        setError("Please enter a valid phone number");
      } else {
        setError("");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Business Media</h2>
        <p className="text-gray-400">
          Add photos and videos to showcase your business.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Business Image
          </label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload || onImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer text-white hover:text-gray-300"
            >
              {uploadingImage ? "Uploading..." : "Click to upload an image"}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Business Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
            placeholder="e.g. info@yourbusiness.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Business Website <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
            placeholder="e.g. https://yourbusiness.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Business Phone <span className="text-red-500">*</span>
          </label>
          <PhoneInput
            international
            defaultCountry={defaultCountryIso as any}
            value={formData.phone}
            onChange={handlePhoneChange}
            inputClassName="PhoneInputInput"
            placeholder="e.g. +1234567890"
            required
          />
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default BusinessMediaStep;
