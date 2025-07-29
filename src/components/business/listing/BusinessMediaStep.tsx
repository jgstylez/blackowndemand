import React, { useState, useEffect } from "react";
import { Upload, Plus, Trash2, Image } from "lucide-react";
import { supabase } from "../../../lib/supabase";

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
  galleryImages: Array<{ id: string; url: string; file?: File }>; // Add this
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
  planName?: string; // Add this to check image limits
}

const BusinessMediaStep: React.FC<BusinessMediaStepProps> = ({
  formData,
  setFormData,
  updateFormData,
  defaultCountryIso,
  error,
  setError,
  handleImageUpload,
  handleChange,
  handleSocialLinkChange,
  planName,
}) => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

  // Determine image limit based on plan
  const getImageLimit = () => {
    switch (planName) {
      case "VIP Plan":
        return 20;
      case "Enhanced Plan":
        return 10;
      default:
        return 5;
    }
  };

  const imageLimit = getImageLimit();

  // Use the handleImageUpload prop if provided, otherwise use local function
  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleImageUpload) {
      handleImageUpload(e);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      console.log("Uploading image:", file.name);
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

  // Gallery image upload handler
  const handleGalleryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check image limit
    if (formData.galleryImages.length >= imageLimit) {
      setError?.(
        `You can only upload up to ${imageLimit} images with your current plan`
      );
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError?.("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError?.("Image file size must be less than 5MB");
      return;
    }

    try {
      setUploadingGalleryImage(true);
      setError?.("");

      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      const tempId = `temp-${Date.now()}`;

      const newGalleryImage = {
        id: tempId,
        url: imageUrl,
        file: file,
      };

      setFormData({
        ...formData,
        galleryImages: [...formData.galleryImages, newGalleryImage],
      });
    } catch (err) {
      console.error("Error preparing gallery image:", err);
      setError?.("Failed to prepare image. Please try again.");
    } finally {
      setUploadingGalleryImage(false);
    }
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (imageId: string) => {
    setFormData({
      ...formData,
      galleryImages: formData.galleryImages.filter((img) => img.id !== imageId),
    });
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
        <p className="text-gray-400">
          Add photos and videos to showcase your business.
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Business Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Business Image <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
            {formData.imageUrl ? (
              <div className="mb-4">
                <img
                  src={formData.imageUrl}
                  alt="Business preview"
                  className="h-32 w-32 object-cover rounded-lg mx-auto"
                />
                <p className="text-green-400 text-sm mt-2">
                  Image uploaded successfully!
                </p>
              </div>
            ) : (
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer text-white hover:text-gray-300"
            >
              {uploadingImage
                ? "Uploading..."
                : formData.imageUrl
                ? "Change Image"
                : "Click to upload an image"}
            </label>
          </div>
        </div>

        {/* Image Gallery Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-300">
              Image Gallery ({formData.galleryImages.length}/{imageLimit})
            </label>
            {formData.galleryImages.length < imageLimit && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImageUpload}
                  className="hidden"
                  disabled={uploadingGalleryImage}
                />
                <div className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Image
                </div>
              </label>
            )}
          </div>

          {formData.galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.galleryImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                    <img
                      src={image.url}
                      alt="Gallery image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
              <Image className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                No gallery images yet. Add up to {imageLimit} images.
              </p>
            </div>
          )}

          {formData.galleryImages.length >= imageLimit && (
            <p className="text-xs text-yellow-500 mt-2">
              You've reached the maximum number of images ({imageLimit}) for
              your current plan.
            </p>
          )}

          {uploadingGalleryImage && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <p className="text-gray-500 text-sm mt-2">Preparing image...</p>
            </div>
          )}
        </div>

        {/* Contact Information */}
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
            Business Website
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
            placeholder="e.g. https://yourbusiness.com (optional)"
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
            inputclassname="PhoneInputInput"
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
