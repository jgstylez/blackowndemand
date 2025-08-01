import React from "react";
import { Building2, Tags, Clock } from "lucide-react";
import Select from "react-select";
import {
  BusinessTag,
  BusinessTagLabels,
  BusinessCategory,
} from "../../../types";

interface BusinessInfoStepProps {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  error: string;
  setError: (err: string | null) => void;
  maxTagsAllowed: number;
  availableTags: { value: BusinessTag; label: string }[];
  handleTagChange: (selectedOptions: readonly any[]) => void;
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleNameBlur: () => void;
  sortedCategories: [string, string][];
  isPremiumPlan: boolean;
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const HOURS_OPTIONS = [
  { value: "", label: "Select hours" },
  { value: "Closed", label: "Closed" },
  { value: "24 Hours", label: "24 Hours" },
  { value: "6:00 AM - 2:00 PM", label: "6:00 AM - 2:00 PM" },
  { value: "7:00 AM - 3:00 PM", label: "7:00 AM - 3:00 PM" },
  { value: "8:00 AM - 4:00 PM", label: "8:00 AM - 4:00 PM" },
  { value: "9:00 AM - 5:00 PM", label: "9:00 AM - 5:00 PM" },
  { value: "10:00 AM - 6:00 PM", label: "10:00 AM - 6:00 PM" },
  { value: "11:00 AM - 7:00 PM", label: "11:00 AM - 7:00 PM" },
  { value: "12:00 PM - 8:00 PM", label: "12:00 PM - 8:00 PM" },
  { value: "1:00 PM - 9:00 PM", label: "1:00 PM - 9:00 PM" },
  { value: "2:00 PM - 10:00 PM", label: "2:00 PM - 10:00 PM" },
  { value: "3:00 PM - 11:00 PM", label: "3:00 PM - 11:00 PM" },
  { value: "4:00 PM - 12:00 AM", label: "4:00 PM - 12:00 AM" },
  { value: "5:00 PM - 1:00 AM", label: "5:00 PM - 1:00 AM" },
  { value: "6:00 PM - 2:00 AM", label: "6:00 PM - 2:00 AM" },
  { value: "7:00 PM - 3:00 AM", label: "7:00 PM - 3:00 AM" },
  { value: "8:00 PM - 4:00 AM", label: "8:00 PM - 4:00 AM" },
  { value: "9:00 PM - 5:00 AM", label: "9:00 PM - 5:00 AM" },
  { value: "10:00 PM - 6:00 AM", label: "10:00 PM - 6:00 AM" },
  { value: "11:00 PM - 7:00 AM", label: "11:00 PM - 7:00 AM" },
  { value: "12:00 AM - 8:00 AM", label: "12:00 AM - 8:00 AM" },
];

const BusinessInfoStep: React.FC<BusinessInfoStepProps> = ({
  formData,
  setFormData,
  error,
  setError,
  maxTagsAllowed,
  availableTags,
  handleTagChange,
  handleChange,
  handleNameBlur,
  sortedCategories,
  isPremiumPlan,
}) => {
  // Handle category change for both single and multi-select
  const handleCategoryChange = (selectedOptions: any) => {
    if (isPremiumPlan) {
      const categories = selectedOptions
        ? selectedOptions.map((option: any) => option.value)
        : [];

      // Real-time validation
      if (categories.length === 0) {
        setError("At least one category is required");
        return;
      }

      setFormData((prev: any) => ({ ...prev, categories }));
    } else {
      const category = selectedOptions ? selectedOptions.value : "";

      if (!category) {
        setError("Category is required");
        return;
      }

      setFormData((prev: any) => ({ ...prev, category }));
    }

    // Clear error when valid selection is made
    setError(null);
  };

  // Handle business hours change
  const handleHoursChange = (day: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      business_hours: {
        ...(prev.business_hours || {}),
        [day]: value,
      },
    }));
    setError(null);
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Prepare category options for react-select
  const categoryOptions = sortedCategories.map(([key, value]) => ({
    value: value as BusinessCategory, // Use the enum VALUE (like "Nonprofit")
    label: value, // Use the enum VALUE as the label
  }));

  // Get selected categories for display
  const getSelectedCategories = () => {
    if (isPremiumPlan) {
      return formData.categories
        ? formData.categories.map((cat: string) => ({
            value: cat,
            label:
              sortedCategories.find(([key, value]) => value === cat)?.[1] ||
              cat,
          }))
        : [];
    } else {
      return formData.category
        ? {
            value: formData.category,
            label:
              sortedCategories.find(
                ([key, value]) => value === formData.category
              )?.[1] || formData.category,
          }
        : null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Name */}
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
            value={formData.name}
            onChange={handleChange}
            onBlur={handleNameBlur}
            className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            placeholder="Your business name"
            required
          />
        </div>
      </div>

      {/* Tagline */}
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
          value={formData.tagline}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          placeholder="A short, catchy description"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          placeholder="Tell us about your business"
          required
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {isPremiumPlan ? "Categories" : "Category"}{" "}
          <span className="text-red-500">*</span>
          {isPremiumPlan && (
            <span className="text-sm text-gray-400 ml-2">
              (Select up to 3 categories, at least one is required)
            </span>
          )}
        </label>
        <Select
          isMulti={isPremiumPlan}
          value={getSelectedCategories()}
          onChange={handleCategoryChange}
          options={categoryOptions}
          placeholder={
            isPremiumPlan
              ? "Select primary category (required) + up to 2 more"
              : "Select a category"
          }
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 1050 }),
            menu: (base) => ({ ...base, zIndex: 1050 }),
          }}
          classNames={{
            control: (state) =>
              `!bg-gray-900 !border-gray-700 !rounded-lg !text-white !min-h-[46px] ${
                state.isFocused ? "!ring-2 !ring-white !border-transparent" : ""
              }`,
            menu: () =>
              "!bg-gray-900 !border !border-gray-700 !rounded-lg !mt-1",
            menuList: () => "!p-1",
            option: (state) =>
              `!px-3 !py-2 !rounded-md ${
                state.isFocused
                  ? "!bg-gray-800 !text-white"
                  : "!bg-gray-900 !text-gray-300"
              }`,
            multiValue: () => "!bg-gray-800 !rounded-md !my-1",
            multiValueLabel: () => "!text-white !px-2 !py-1",
            multiValueRemove: () =>
              "!text-gray-300 hover:!text-white hover:!bg-gray-600 !rounded-r-md !px-2",
            placeholder: () => "!text-gray-400",
            input: () => "!text-white",
            indicatorsContainer: () => "!text-gray-400",
            clearIndicator: () => "hover:!text-white !cursor-pointer",
            dropdownIndicator: () => "hover:!text-white !cursor-pointer",
            singleValue: () => "!text-white",
          }}
          isDisabled={
            isPremiumPlan &&
            formData.categories &&
            formData.categories.length >= 3
          }
          noOptionsMessage={() => "No categories available"}
        />
        {isPremiumPlan && (
          <p className="mt-2 text-sm text-gray-400">
            {formData.categories ? formData.categories.length : 0}/3 categories
            {formData.categories && formData.categories.length > 0 && (
              <span className="text-green-400 ml-2">
                ✓ Primary: {formData.categories[0]}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags (max {maxTagsAllowed})
        </label>
        <div className="relative">
          <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-20 pointer-events-none" />
          <Select
            isMulti
            value={formData.tags.map((tag: BusinessTag) => ({
              value: tag,
              label: BusinessTagLabels[tag],
            }))}
            onChange={handleTagChange}
            options={availableTags}
            placeholder={`Select up to ${maxTagsAllowed} tags`}
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 1050 }),
              menu: (base) => ({ ...base, zIndex: 1050 }),
            }}
            classNames={{
              control: (state) =>
                `!bg-gray-900 !border-gray-700 !rounded-lg !text-white !pl-10 !min-h-[46px] ${
                  state.isFocused
                    ? "!ring-2 !ring-white !border-transparent"
                    : ""
                }`,
              menu: () =>
                "!bg-gray-900 !border !border-gray-700 !rounded-lg !mt-1",
              menuList: () => "!p-1",
              option: (state) =>
                `!px-3 !py-2 !rounded-md ${
                  state.isFocused
                    ? "!bg-gray-800 !text-white"
                    : "!bg-gray-900 !text-gray-300"
                }`,
              multiValue: () => "!bg-gray-800 !rounded-md !my-1",
              multiValueLabel: () => "!text-white !px-2 !py-1",
              multiValueRemove: () =>
                "!text-gray-300 hover:!text-white hover:!bg-gray-600 !rounded-r-md !px-2",
              placeholder: () => "!text-gray-400",
              input: () => "!text-white",
              indicatorsContainer: () => "!text-gray-400",
              clearIndicator: () => "hover:!text-white !cursor-pointer",
              dropdownIndicator: () => "hover:!text-white !cursor-pointer",
            }}
            isDisabled={formData.tags.length >= maxTagsAllowed}
            noOptionsMessage={() =>
              (
                isPremiumPlan
                  ? formData.categories && formData.categories.length > 0
                  : formData.category
              )
                ? "No tags available for selected categories"
                : "Please select a category first"
            }
          />
        </div>
        <p className="mt-2 text-sm text-gray-400">
          {formData.tags.length}/{maxTagsAllowed} tags selected
          {!(isPremiumPlan
            ? formData.categories && formData.categories.length > 0
            : formData.category) && (
            <span className="block text-yellow-400 text-sm mt-1">
              Select {isPremiumPlan ? "categories" : "a category"} to see
              relevant tags
            </span>
          )}
        </p>
      </div>

      {/* Business Hours Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Business Hours</h3>
          <span className="text-sm text-gray-400">(Optional)</span>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-sm">
            Set your business operating hours to help customers know when you're
            available. You can leave this blank and add hours later from your
            dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day}>
              <label
                htmlFor={`hours_${day}`}
                className="block text-sm text-gray-300 mb-2"
              >
                {getDayLabel(day)}
              </label>
              <select
                id={`hours_${day}`}
                name={`business_hours.${day}`}
                value={(formData.business_hours || {})[day] || ""}
                onChange={(e) => handleHoursChange(day, e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              >
                {HOURS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            💡 <strong>Tip:</strong> You can always update your business hours
            later from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoStep;
