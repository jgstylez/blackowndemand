import React from "react";
import { Building2, Tags } from "lucide-react";
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
      // Multi-select for premium plans (up to 3 categories)
      const categories = selectedOptions
        ? selectedOptions.map((option: any) => option.value)
        : [];
      setFormData((prev: any) => ({ ...prev, categories }));
    } else {
      // Single select for basic plans
      const category = selectedOptions ? selectedOptions.value : "";
      setFormData((prev: any) => ({ ...prev, category }));
    }

    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  // Prepare category options for react-select
  const categoryOptions = sortedCategories.map(([value, label]) => ({
    value: value as BusinessCategory,
    label,
  }));

  // Get selected categories for display
  const getSelectedCategories = () => {
    if (isPremiumPlan) {
      return formData.categories
        ? formData.categories.map((cat: string) => ({
            value: cat,
            label:
              sortedCategories.find(([value]) => value === cat)?.[1] || cat,
          }))
        : [];
    } else {
      return formData.category
        ? {
            value: formData.category,
            label:
              sortedCategories.find(
                ([value]) => value === formData.category
              )?.[1] || formData.category,
          }
        : null;
    }
  };

  return (
    <div className="space-y-6">
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

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {isPremiumPlan ? "Categories" : "Category"}{" "}
          <span className="text-red-500">*</span>
          {isPremiumPlan && (
            <span className="text-sm text-gray-400 ml-2">
              (Select up to 3 categories)
            </span>
          )}
        </label>
        <Select
          isMulti={isPremiumPlan}
          value={getSelectedCategories()}
          onChange={handleCategoryChange}
          options={categoryOptions}
          placeholder={
            isPremiumPlan ? "Select up to 3 categories" : "Select a category"
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
            selected
          </p>
        )}
      </div>

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
    </div>
  );
};

export default BusinessInfoStep;
