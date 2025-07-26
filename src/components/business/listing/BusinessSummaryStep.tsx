import React from "react";
import { Check } from "lucide-react";
import { BusinessFormData } from "../../../hooks/useBusinessListingForm";

interface BusinessSummaryStepProps {
  formData: BusinessFormData;
}

const BusinessSummaryStep: React.FC<BusinessSummaryStepProps> = ({
  formData,
}) => {
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
          <div>
            <span className="text-gray-400">Name:</span>{" "}
            <span className="text-white ml-2">{formData.name}</span>
          </div>
          <div>
            <span className="text-gray-400">Tagline:</span>{" "}
            <span className="text-white ml-2">{formData.tagline}</span>
          </div>
          <div>
            <span className="text-gray-400">Description:</span>{" "}
            <span className="text-white ml-2">{formData.description}</span>
          </div>
          <div>
            <span className="text-gray-400">Category:</span>{" "}
            <span className="text-white ml-2">{formData.category}</span>
          </div>
          <div>
            <span className="text-gray-400">Tags:</span>{" "}
            <span className="text-white ml-2">{formData.tags?.join(", ")}</span>
          </div>
          <div>
            <span className="text-gray-400">Email:</span>{" "}
            <span className="text-white ml-2">{formData.email}</span>
          </div>
          <div>
            <span className="text-gray-400">Phone:</span>{" "}
            <span className="text-white ml-2">{formData.phone}</span>
          </div>
          <div>
            <span className="text-gray-400">Website:</span>{" "}
            <span className="text-white ml-2">{formData.website}</span>
          </div>
          <div>
            <span className="text-gray-400">Country:</span>{" "}
            <span className="text-white ml-2">{formData.country}</span>
          </div>
          <div>
            <span className="text-gray-400">State:</span>{" "}
            <span className="text-white ml-2">{formData.state}</span>
          </div>
          <div>
            <span className="text-gray-400">City:</span>{" "}
            <span className="text-white ml-2">{formData.city}</span>
          </div>
          <div>
            <span className="text-gray-400">Postal Code:</span>{" "}
            <span className="text-white ml-2">{formData.postalCode}</span>
          </div>
          <div>
            <span className="text-gray-400">Image:</span>{" "}
            <span className="text-white ml-2">
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt="Business"
                  className="h-12 inline"
                />
              ) : (
                "N/A"
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Promo Video:</span>{" "}
            <span className="text-white ml-2">{formData.promoVideoUrl}</span>
          </div>
          <div>
            <span className="text-gray-400">Social Links:</span>
            <span className="text-white ml-2">
              {Object.entries(formData.socialLinks || {}).map(([key, value]) =>
                value ? (
                  <div key={key}>
                    {key}: {value}
                  </div>
                ) : null
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSummaryStep;
