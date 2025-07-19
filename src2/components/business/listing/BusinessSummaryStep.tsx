import React from "react";

interface BusinessSummaryStepProps {
  formData: any;
  planName: string;
  planPrice: number;
  maxTagsAllowed: number;
  BusinessTagLabels: Record<string, string>;
  handleSubmit: () => void;
  loading: boolean;
  error: string;
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
}) => (
  <div className="space-y-6">
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-white font-medium mb-2">Business Summary</h3>
      <p className="text-gray-400 text-sm mb-4">
        Please review your business information before submitting.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Business Details</h4>
        <div className="space-y-2">
          <div>
            <span className="text-gray-400 text-sm">Name:</span>
            <p className="text-white">{formData.name}</p>
          </div>
          {formData.tagline && (
            <div>
              <span className="text-gray-400 text-sm">Tagline:</span>
              <p className="text-white">{formData.tagline}</p>
            </div>
          )}
          {formData.category && (
            <div>
              <span className="text-gray-400 text-sm">Category:</span>
              <p className="text-white">{formData.category}</p>
            </div>
          )}
          {formData.tags.length > 0 && (
            <div>
              <span className="text-gray-400 text-sm">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-800 rounded-full text-xs text-white"
                  >
                    {BusinessTagLabels[tag]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Contact Information</h4>
        <div className="space-y-2">
          {formData.email && (
            <div>
              <span className="text-gray-400 text-sm">Email:</span>
              <p className="text-white">{formData.email}</p>
            </div>
          )}
          {formData.phone && (
            <div>
              <span className="text-gray-400 text-sm">Phone:</span>
              <p className="text-white">{formData.phone}</p>
            </div>
          )}
          {formData.website && (
            <div>
              <span className="text-gray-400 text-sm">Website:</span>
              <p className="text-white">{formData.website}</p>
            </div>
          )}
          {formData.city && formData.state && (
            <div>
              <span className="text-gray-400 text-sm">Location:</span>
              <p className="text-white">
                {formData.city}, {formData.state} {formData.postalCode}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Subscription Plan Summary */}
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">Subscription Plan</h3>
      <div className="flex justify-between mb-4">
        <span className="text-gray-400">Annual Subscription - {planName}</span>
        <div className="text-right">
          <span className="text-white">${planPrice}</span>
          <p className="text-sm text-gray-500">
            (${(planPrice / 12).toFixed(2)} per month)
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-2 border-t border-gray-700 pt-2">
        <span className="text-gray-400">Payment Status</span>
        <span className="text-green-400 font-medium">Paid</span>
      </div>
    </div>

    {error && (
      <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
        {error}
      </div>
    )}

    <div className="flex justify-end mt-8">
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  </div>
);

export default BusinessSummaryStep;
