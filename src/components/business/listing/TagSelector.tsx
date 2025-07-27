import React, { useState, useEffect } from "react";
import Select from "react-select";
import { supabase } from "../../../lib/supabase";
import { BusinessTag, BusinessTagLabels } from "../../../types";

interface TagSelectorProps {
  selectedTags: BusinessTag[];
  onTagsChange: (tags: BusinessTag[]) => void;
  maxTags?: number;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  maxTags = 10,
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: "",
    category: "",
    description: "",
  });
  const [requesting, setRequesting] = useState(false);

  // Convert enum to options for react-select
  const tagOptions = Object.entries(BusinessTagLabels).map(
    ([value, label]) => ({
      value: value as BusinessTag,
      label,
    })
  );

  // Group tags by category for better organization
  const tagCategories = {
    "Arts & Crafts": [
      BusinessTag.ART_SUPPLIES,
      BusinessTag.PARTY_SUPPLIES,
      BusinessTag.CUSTOM_INVITATIONS,
      BusinessTag.KIDS_CRAFTS,
      BusinessTag.SEASONAL_CRAFTS,
      BusinessTag.PAINT_BRUSHES,
      BusinessTag.CANVAS_BOARDS,
      BusinessTag.GLUE_GLITTER,
      BusinessTag.DIY_KITS,
      BusinessTag.CRAFT_CLASSES,
    ],
    "Food & Beverage": [
      BusinessTag.GOURMET_SNACKS,
      BusinessTag.MEAL_KITS,
      BusinessTag.ETHNIC_FOODS,
      BusinessTag.COFFEE_BLENDS,
      BusinessTag.VEGAN_TREATS,
      BusinessTag.COOKING_INGREDIENTS,
      BusinessTag.ARTISAN_BREAD,
      BusinessTag.SPICES_RUBS,
      BusinessTag.SHELF_STABLE_MEALS,
      BusinessTag.BEVERAGE_VARIETY,
    ],
    "Fashion & Beauty": [
      BusinessTag.WOMENS_FASHION,
      BusinessTag.MENSWEAR,
      BusinessTag.SNEAKERS,
      BusinessTag.FASHION_ACCESSORIES,
      BusinessTag.DESIGNER_BAGS,
      BusinessTag.JEWELRY_SETS,
      BusinessTag.PLUS_SIZE_WEAR,
      BusinessTag.HATS_SCARVES,
      BusinessTag.DENIM_WEAR,
      BusinessTag.KIDS_FASHION,
    ],
    Technology: [
      BusinessTag.LAPTOPS_COMPUTERS,
      BusinessTag.SMARTPHONES,
      BusinessTag.BLUETOOTH_SPEAKERS,
      BusinessTag.TV_MONITORS,
      BusinessTag.HOME_SECURITY_CAMS,
      BusinessTag.VIDEO_DOORBELLS,
      BusinessTag.GAMING_CONSOLES,
      BusinessTag.HEADPHONES,
      BusinessTag.CHARGING_STATIONS,
      BusinessTag.TECH_ACCESSORIES,
    ],
    "Health & Fitness": [
      BusinessTag.DUMBBELLS,
      BusinessTag.YOGA_MATS,
      BusinessTag.RESISTANCE_BANDS,
      BusinessTag.STATIONARY_BIKES,
      BusinessTag.PROTEIN_SHAKES,
      BusinessTag.FOAM_ROLLERS,
      BusinessTag.HOME_GYMS,
      BusinessTag.FITNESS_TIMERS,
      BusinessTag.GYM_CLOTHES,
      BusinessTag.BODYWEIGHT_BARS,
    ],
  };

  const handleTagRequest = async () => {
    if (!newTagData.name.trim()) return;

    setRequesting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("tag_requests").insert({
        name: newTagData.name.trim(),
        category: newTagData.category.trim() || null,
        description: newTagData.description.trim() || null,
        requested_by: user.id,
        status: "pending",
      });

      if (error) throw error;

      setShowRequestForm(false);
      setNewTagData({ name: "", category: "", description: "" });
      alert(
        "Tag request submitted! It will be reviewed by an admin and added to the available tags if approved."
      );
    } catch (error: any) {
      if (error.message.includes("already pending")) {
        alert(
          "This tag is already pending approval. Please wait for admin review."
        );
      } else {
        alert(`Error submitting request: ${error.message}`);
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tag Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Business Tags ({selectedTags.length}/{maxTags})
        </label>

        <Select
          isMulti
          value={selectedTags.map((tag) => ({
            value: tag,
            label: BusinessTagLabels[tag],
          }))}
          onChange={(selected) => {
            const newTags = selected
              ? selected.map((option) => option.value)
              : [];
            if (newTags.length <= maxTags) {
              onTagsChange(newTags);
            }
          }}
          options={tagOptions}
          placeholder="Select tags..."
          isOptionDisabled={() => selectedTags.length >= maxTags}
          classNames={{
            control: (state) =>
              `!bg-gray-800 !border-gray-700 !rounded-lg !text-white !min-h-[46px] ${
                state.isFocused ? "!ring-2 !ring-white !border-transparent" : ""
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

      {/* Tag Categories for Reference */}
      <div className="text-xs text-gray-500">
        <p className="mb-2">Available tag categories:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {Object.keys(tagCategories).map((category) => (
            <span key={category} className="text-gray-400">
              • {category}
            </span>
          ))}
        </div>
      </div>

      {/* Request New Tag */}
      <div>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Can't find the tag you need? Request a new one
        </button>

        {showRequestForm && (
          <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800">
            <h5 className="font-medium text-white mb-3">Request New Tag</h5>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tag name (e.g., 'Organic Skincare')"
                value={newTagData.name}
                onChange={(e) =>
                  setNewTagData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
              <select
                value={newTagData.category}
                onChange={(e) =>
                  setNewTagData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="">Select category (optional)</option>
                <option value="Arts & Crafts">Arts & Crafts</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Fashion & Beauty">Fashion & Beauty</option>
                <option value="Technology">Technology</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Sports & Outdoors">Sports & Outdoors</option>
                <option value="Education">Education</option>
                <option value="Professional Services">
                  Professional Services
                </option>
                <option value="Other">Other</option>
              </select>
              <textarea
                placeholder="Brief description of what this tag represents (optional)"
                value={newTagData.description}
                onChange={(e) =>
                  setNewTagData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleTagRequest}
                  disabled={!newTagData.name.trim() || requesting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {requesting ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
