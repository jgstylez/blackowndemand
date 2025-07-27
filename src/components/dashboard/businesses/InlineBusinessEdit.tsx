import React, { useState, useEffect } from "react";
import {
  Mail,
  Globe,
  Phone,
  Building2,
  Video,
  Tags,
  X,
  Save,
  Upload,
  Image,
  Trash2,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import Select from "react-select";
import { supabase } from "../../../lib/supabase";
import { extractVideoSrc } from "../../../utils/videoUtils";
import {
  Business,
  BusinessCategoryLabels,
  BusinessTag,
  BusinessTagLabels,
} from "../../../types";

interface InlineBusinessEditProps {
  business: Business;
  onSave: (data: Partial<Business>) => Promise<void>;
  onCancel: () => void;
}

interface TagOption {
  value: BusinessTag;
  label: string;
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  theBlackTube?: string;
  fanbase?: string;
  [key: string]: string | undefined;
}

const InlineBusinessEdit: React.FC<InlineBusinessEditProps> = ({
  business,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Business>>({
    name: business.name,
    tagline: business.tagline,
    description: business.description,
    category: business.category || null, // Add fallback to empty string
    website_url: business.website_url,
    phone: business.phone,
    email: business.email,
    city: business.city,
    state: business.state,
    zip_code: business.zip_code,
    country: business.country,
    tags: business.tags || [],
    promo_video_url: business.promo_video_url,
    social_links: business.social_links || {},
    image_url: business.image_url,
    business_hours: business.business_hours || {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    business.image_url || null
  );

  const [businessImages, setBusinessImages] = useState<any[]>([]);
  const [imageLimit, setImageLimit] = useState(5);
  const [loadingImages, setLoadingImages] = useState(false);

  // Add debugging to see what category value is being passed
  console.log("🔍 Business prop received:", {
    businessName: business.name,
    businessCategory: business.category,
    businessCategoryType: typeof business.category,
  });

  // Add a useEffect to update form data when business prop changes
  useEffect(() => {
    console.log("🔍 Updating form data from business prop:", {
      name: business.name,
      category: business.category,
      categoryType: typeof business.category,
    });

    setFormData({
      name: business.name,
      tagline: business.tagline,
      description: business.description,
      category: business.category || null, // Add fallback to empty string
      website_url: business.website_url,
      phone: business.phone,
      email: business.email,
      city: business.city,
      state: business.state,
      zip_code: business.zip_code,
      country: business.country,
      tags: business.tags || [],
      promo_video_url: business.promo_video_url,
      social_links: business.social_links || {},
      image_url: business.image_url,
      business_hours: business.business_hours || {},
    });
  }, [business]);

  useEffect(() => {
    const fetchSubscriptionAndImages = async () => {
      try {
        // Fetch subscription plan details
        if (business.subscription_id) {
          const { data: subscriptionData, error: subscriptionError } =
            await supabase
              .from("subscriptions")
              .select(
                `
            id,
            plan_id,
            subscription_plans(
              name,
              image_limit,
              category_limit,
              features
            )
          `
              )
              .eq("id", business.subscription_id)
              .single();

          if (subscriptionError) throw subscriptionError;

          if (subscriptionData?.subscription_plans) {
            const plan = subscriptionData.subscription_plans;
            setImageLimit(plan.image_limit || 5);
          }
        }

        // Fetch existing business images
        const { data: imagesData, error: imagesError } = await supabase
          .from("business_images")
          .select("*")
          .eq("business_id", business.id)
          .order("created_at", { ascending: true });

        if (imagesError) throw imagesError;
        setBusinessImages(imagesData || []);
      } catch (err) {
        console.error("Error fetching subscription and images:", err);
        setError("Failed to load subscription details");
      }
    };

    fetchSubscriptionAndImages();
  }, [business.id, business.subscription_id]);

  // Update the handleChange function to add specific debugging for category
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "promo_video_url") {
      const extractedSrc = extractVideoSrc(value);
      console.log("🔍 Promo video URL change:", {
        original: value,
        extracted: extractedSrc,
        fieldName: name,
      });
      setFormData((prev) => ({ ...prev, [name]: extractedSrc }));
    } else if (name === "category") {
      // Add specific debugging for category changes
      console.log("🔍 Category change:", {
        name,
        value,
        previousCategory: formData.category,
      });
      setFormData((prev) => ({ ...prev, [name]: value as any }));
    } else {
      console.log("🔍 Field change:", { name, value });
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...((prev.social_links as SocialLinks) || {}),
        [name]: value,
      },
    }));
    setError(null);
  };

  const handleTagChange = (selectedOptions: readonly TagOption[]) => {
    const newTags = selectedOptions.map((option) => option.value);
    setFormData((prev) => ({ ...prev, tags: newTags }));
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size must be less than 5MB");
      return;
    }

    try {
      setImageUploading(true);
      setError(null);

      // Create preview immediately for better UX
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${business.id}-${Date.now()}.${fileExt}`;
      const filePath = `business-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("business-images").getPublicUrl(filePath);

      // Update form data with the new image URL
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
      // Revert to original image if upload fails
      setImagePreview(business.image_url || null);
    } finally {
      setImageUploading(false);
    }
  };

  const handleGalleryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check image limit
    if (businessImages.length >= imageLimit) {
      setError(
        `You can only upload up to ${imageLimit} images with your current plan`
      );
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size must be less than 5MB");
      return;
    }

    try {
      setLoadingImages(true);
      setError(null);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${business.id}-gallery-${Date.now()}.${fileExt}`;
      const filePath = `business-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("business-images").getPublicUrl(filePath);

      // Save to business_images table
      const { error: insertError } = await supabase
        .from("business_images")
        .insert({
          business_id: business.id,
          url: publicUrl,
        });

      if (insertError) throw insertError;

      // Refresh images list
      const { data: newImagesData } = await supabase
        .from("business_images")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: true });

      setBusinessImages(newImagesData || []);
    } catch (err) {
      console.error("Error uploading gallery image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    try {
      setLoadingImages(true);
      setError(null);

      // Get image URL before deletion
      const imageToDelete = businessImages.find((img) => img.id === imageId);
      if (!imageToDelete) return;

      // Delete from business_images table
      const { error: deleteError } = await supabase
        .from("business_images")
        .delete()
        .eq("id", imageId);

      if (deleteError) throw deleteError;

      // Delete from storage (optional - you might want to keep storage files)
      // const fileName = imageToDelete.url.split('/').pop();
      // if (fileName) {
      //   await supabase.storage
      //     .from("business-images")
      //     .remove([fileName]);
      // }

      // Update local state
      setBusinessImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error("Error deleting image:", err);
      setError("Failed to delete image. Please try again.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Add debugging
    console.log("🔍 Form submission data:", formData);

    if (!formData.name?.trim()) {
      setError("Business name is required");
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Category is required");
      setLoading(false);
      return;
    }

    if (!formData.email?.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 Calling onSave with data:", formData);
      await onSave(formData);
    } catch (err) {
      console.error("🔍 Error in handleSubmit:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update business"
      );
    } finally {
      setLoading(false);
    }
  };

  const tagOptions = Object.entries(BusinessTagLabels).map(
    ([value, label]) => ({
      value: value as BusinessTag,
      label,
    })
  );

  const sortedCategories = Object.entries(BusinessCategoryLabels).sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  // Location options
  const countries = [
    { value: "United States", label: "United States" },
    { value: "Canada", label: "Canada" },
    // Add more countries as needed
  ];

  const states = [
    { value: "Georgia", label: "Georgia" },
    { value: "California", label: "California" },
    { value: "New York", label: "New York" },
    { value: "Texas", label: "Texas" },
    { value: "Florida", label: "Florida" },
    // Add more states as needed
  ];

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">
          Edit Business Details
        </h3>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Business Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tagline"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Tagline
            </label>
            <input
              type="text"
              id="tagline"
              name="tagline"
              value={formData.tagline || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {sortedCategories.map(([value, label]) => {
                const isSelected = value === formData.category;
                console.log("🔍 Category option:", {
                  value,
                  label,
                  isSelected,
                  formDataCategory: formData.category,
                  comparison: `${value} === ${formData.category} = ${isSelected}`,
                });
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="relative">
              <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <Select
                isMulti
                value={(formData.tags || []).map((tag) => ({
                  value: tag,
                  label: BusinessTagLabels[tag],
                }))}
                onChange={handleTagChange}
                options={tagOptions}
                placeholder="Select tags"
                classNames={{
                  control: (state) =>
                    `!bg-gray-800 !border-gray-700 !rounded-lg !text-white !pl-10 !min-h-[46px] ${
                      state.isFocused
                        ? "!ring-2 !ring-white !border-transparent"
                        : ""
                    }`,
                  menu: () =>
                    "!bg-gray-800 !border !border-gray-700 !rounded-lg !mt-1",
                  menuList: () => "!p-1",
                  option: (state) =>
                    `!px-3 !py-2 !rounded-md ${
                      state.isFocused
                        ? "!bg-gray-700 !text-white"
                        : "!bg-gray-800 !text-gray-300"
                    }`,
                  multiValue: () => "!bg-gray-700 !rounded-md !my-1",
                  multiValueLabel: () => "!text-white !px-2 !py-1",
                  multiValueRemove: () =>
                    "!text-gray-300 hover:!text-white hover:!bg-gray-600 !rounded-r-md !px-2",
                  placeholder: () => "!text-gray-400",
                  input: () => "!text-white",
                  indicatorsContainer: () => "!text-gray-400",
                  clearIndicator: () => "hover:!text-white !cursor-pointer",
                  dropdownIndicator: () => "hover:!text-white !cursor-pointer",
                }}
              />
            </div>
          </div>
        </div>

        {/* Business Image Upload - Enhanced with current image preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Business Image
          </label>
          <div className="flex items-start gap-4">
            {/* Current/Preview Image */}
            <div className="flex-shrink-0">
              {imagePreview ? (
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                  <img
                    src={imagePreview}
                    alt="Business image"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Image className="h-8 w-8 text-gray-600" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Upload className="h-4 w-4 mr-2" />
                  {imageUploading ? "Uploading..." : "Upload New Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={imageUploading}
                  />
                </label>

                {imagePreview && imagePreview !== business.image_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(business.image_url || null);
                      setFormData((prev) => ({
                        ...prev,
                        image_url: business.image_url || null,
                      }));
                    }}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p>JPG, PNG, GIF up to 5MB</p>
                {imagePreview && imagePreview !== business.image_url && (
                  <p className="text-yellow-400 mt-1">
                    ✓ New image ready to save
                  </p>
                )}
                {imageUploading && (
                  <p className="text-blue-400 mt-1">⏳ Uploading image...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-300">
              Image Gallery ({businessImages.length}/{imageLimit})
            </label>
            {businessImages.length < imageLimit && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImageUpload}
                  className="hidden"
                  disabled={loadingImages}
                />
                <div className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Image
                </div>
              </label>
            )}
          </div>

          {businessImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {businessImages.map((image) => (
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
                    onClick={() => handleDeleteGalleryImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
              <ImageIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                No gallery images yet. Add up to {imageLimit} images.
              </p>
            </div>
          )}

          {businessImages.length >= imageLimit && (
            <p className="text-xs text-yellow-500 mt-2">
              You've reached the maximum number of images ({imageLimit}) for
              your current plan.
            </p>
          )}

          {loadingImages && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <p className="text-gray-500 text-sm mt-2">Uploading...</p>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="website_url"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url || ""}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Fields - Compact 4-column layout */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="country"
                className="block text-xs text-gray-400 mb-1"
              >
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-xs text-gray-400 mb-1"
              >
                State/Province
              </label>
              <select
                id="state"
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-xs text-gray-400 mb-1"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Enter city"
                required
              />
            </div>

            <div>
              <label
                htmlFor="zip_code"
                className="block text-xs text-gray-400 mb-1"
              >
                Postal Code
              </label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Enter postal code"
                required
              />
            </div>
          </div>
        </div>

        {/* Premium Features - Always Show */}
        <div className="border-t border-gray-700 pt-6 mt-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Premium Features
          </h3>

          <div>
            <label
              htmlFor="promo_video_url"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Promo Video URL
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                id="promo_video_url"
                name="promo_video_url"
                value={formData.promo_video_url || ""}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="https://theblacktube.com/embed/D1UMvOIf9Fzqjfj"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add a promo video URL from The BlackTube or other video platforms
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Social Media Links
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="facebook"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Facebook
                </label>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={(formData.social_links as SocialLinks)?.facebook || ""}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://facebook.com/yourbusiness"
                />
              </div>

              <div>
                <label
                  htmlFor="instagram"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Instagram
                </label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={
                    (formData.social_links as SocialLinks)?.instagram || ""
                  }
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://instagram.com/yourbusiness"
                />
              </div>

              <div>
                <label
                  htmlFor="twitter"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Twitter
                </label>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  value={(formData.social_links as SocialLinks)?.twitter || ""}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://twitter.com/yourbusiness"
                />
              </div>

              <div>
                <label
                  htmlFor="linkedin"
                  className="block text-xs text-gray-400 mb-1"
                >
                  LinkedIn
                </label>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  value={(formData.social_links as SocialLinks)?.linkedin || ""}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://linkedin.com/company/yourbusiness"
                />
              </div>

              <div>
                <label
                  htmlFor="theBlackTube"
                  className="block text-xs text-gray-400 mb-1"
                >
                  The BlackTube
                </label>
                <input
                  type="url"
                  id="theBlackTube"
                  name="theBlackTube"
                  value={
                    (formData.social_links as SocialLinks)?.theBlackTube || ""
                  }
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://theblacktube.com/yourbusiness"
                />
              </div>

              <div>
                <label
                  htmlFor="fanbase"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Fanbase
                </label>
                <input
                  type="url"
                  id="fanbase"
                  name="fanbase"
                  value={(formData.social_links as SocialLinks)?.fanbase || ""}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://fanbase.app/yourbusiness"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Hours Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Business Hours (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ].map((day) => (
              <div key={day}>
                <label
                  htmlFor={`hours_${day}`}
                  className="block text-xs text-gray-400 mb-1"
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
                <select
                  id={`hours_${day}`}
                  name={`business_hours.${day}`}
                  value={(formData.business_hours as any)?.[day] || ""}
                  onChange={(e) => {
                    const { value } = e.target;
                    console.log(`🔍 Setting ${day} hours to:`, value);
                    setFormData((prev) => ({
                      ...prev,
                      business_hours: {
                        ...(prev.business_hours as any),
                        [day]: value,
                      },
                    }));
                  }}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="">Select hours</option>
                  <option value="Closed">Closed</option>
                  <option value="24 Hours">24 Hours</option>
                  <option value="6:00 AM - 2:00 PM">6:00 AM - 2:00 PM</option>
                  <option value="7:00 AM - 3:00 PM">7:00 AM - 3:00 PM</option>
                  <option value="8:00 AM - 4:00 PM">8:00 AM - 4:00 PM</option>
                  <option value="9:00 AM - 5:00 PM">9:00 AM - 5:00 PM</option>
                  <option value="10:00 AM - 6:00 PM">10:00 AM - 6:00 PM</option>
                  <option value="11:00 AM - 7:00 PM">11:00 AM - 7:00 PM</option>
                  <option value="12:00 PM - 8:00 PM">12:00 PM - 8:00 PM</option>
                  <option value="1:00 PM - 9:00 PM">1:00 PM - 9:00 PM</option>
                  <option value="2:00 PM - 10:00 PM">2:00 PM - 10:00 PM</option>
                  <option value="3:00 PM - 11:00 PM">3:00 PM - 11:00 PM</option>
                  <option value="4:00 PM - 12:00 AM">4:00 PM - 12:00 AM</option>
                  <option value="5:00 PM - 1:00 AM">5:00 PM - 1:00 AM</option>
                  <option value="6:00 PM - 2:00 AM">6:00 PM - 2:00 AM</option>
                  <option value="7:00 PM - 3:00 AM">7:00 PM - 3:00 AM</option>
                  <option value="8:00 PM - 4:00 AM">8:00 PM - 4:00 AM</option>
                  <option value="9:00 PM - 5:00 AM">9:00 PM - 5:00 AM</option>
                  <option value="10:00 PM - 6:00 AM">10:00 PM - 6:00 AM</option>
                  <option value="11:00 PM - 7:00 AM">11:00 PM - 7:00 AM</option>
                  <option value="12:00 AM - 8:00 AM">12:00 AM - 8:00 AM</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || imageUploading}
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InlineBusinessEdit;
