import React from "react";
import { Check } from "lucide-react";

interface BusinessSummaryStepProps {
  formData: any;
  planName?: string;
  planPrice?: number;
  maxTagsAllowed?: number;
  BusinessTagLabels?: any;
  handleSubmit?: () => void;
  loading?: boolean;
  error?: string;
}

const BusinessSummaryStep: React.FC<BusinessSummaryStepProps> = ({
  formData,
  planName,
  planPrice,
  maxTagsAllowed,
  BusinessTagLabels,
  handleSubmit,
  loading,
  error,
}) => {
  // Helper function to check if a value is empty
  const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  };

  // Helper function to render a field only if it has a value
  const renderField = (
    label: string,
    value: any,
    renderValue?: (val: any) => React.ReactNode
  ) => {
    if (isEmpty(value)) return null;

    return (
      <div>
        <span className="text-gray-400">{label}:</span>{" "}
        <span className="text-white ml-2">
          {renderValue ? renderValue(value) : value}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        {/* <h2 className="text-2xl font-bold text-white mb-4">
          Review Your Business
        </h2> */}
        <p className="text-gray-400">
          Please review your business information before submitting.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Check className="h-5 w-5 text-green-500" />
          <span className="text-white font-medium">
            Business Information Complete
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {renderField("Name", formData.name)}
          {renderField("Tagline", formData.tagline)}
          {renderField("Description", formData.description)}
          {renderField("Category", formData.category)}
          {renderField("Tags", formData.tags, (tags) => tags.join(", "))}
          {renderField("Email", formData.email)}
          {renderField("Phone", formData.phone)}
          {renderField("Website", formData.website)}
          {renderField("Country", formData.country)}
          {renderField("State", formData.state)}
          {renderField("City", formData.city)}
          {renderField("Postal Code", formData.postalCode)}
          {renderField("Image", formData.imageUrl, (imageUrl) => (
            <img src={imageUrl} alt="Business" className="h-12 inline" />
          ))}
          {renderField("Gallery Images", formData.galleryImages, (images) => (
            <div className="flex flex-wrap gap-2">
              {images.map(
                (image: { id: string; url: string }, index: number) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`Gallery ${index + 1}`}
                    className="h-12 w-12 object-cover rounded"
                  />
                )
              )}
              <span className="text-gray-400">({images.length} images)</span>
            </div>
          ))}
          {renderField("Promo Video", formData.promoVideoUrl)}
          {renderField("Social Links", formData.socialLinks, (socialLinks) => (
            <div>
              {Object.entries(socialLinks)
                .filter(([key, value]) => value)
                .map(([key, value]) => (
                  <div key={key}>
                    {key}: {String(value)}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 text-red-500 rounded-md p-4">{error}</div>
      )}
    </div>
  );
};

export default BusinessSummaryStep;
