import React, { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Building2,
  Mail,
  MapPin,
  Image,
  Share2,
  Video,
} from "lucide-react";

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

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  icon,
  children,
  isExpanded = true,
  onToggle,
}) => {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="text-white font-medium">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-800">
          <div className="pt-4 space-y-3">{children}</div>
        </div>
      )}
    </div>
  );
};

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
  // State for accordion sections (all expanded by default)
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    contact: true,
    location: true,
    media: true,
    social: true,
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-800 last:border-b-0">
        <span className="text-gray-400 text-sm font-medium mb-1 sm:mb-0">
          {label}
        </span>
        <div className="text-white text-sm">
          {renderValue ? renderValue(value) : value}
        </div>
      </div>
    );
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Check className="h-6 w-6 text-green-500" />
          <span className="text-white font-medium text-lg">
            Business Information Complete
          </span>
        </div>
        <p className="text-gray-400">
          Please review your business information before submitting.
        </p>
      </div>

      <div className="space-y-4">
        {/* Business Overview Section */}
        <AccordionSection
          title="Business Overview"
          icon={<Building2 className="h-5 w-5 text-blue-400" />}
          isExpanded={expandedSections.overview}
          onToggle={() => toggleSection("overview")}
        >
          {renderField("Business Name", formData.name)}
          {renderField("Tagline", formData.tagline)}
          {renderField("Description", formData.description)}
          {renderField("Category", formData.category)}
          {renderField("Tags", formData.tags, (tags) => (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ))}
        </AccordionSection>

        {/* Contact Information Section */}
        <AccordionSection
          title="Contact Information"
          icon={<Mail className="h-5 w-5 text-green-400" />}
          isExpanded={expandedSections.contact}
          onToggle={() => toggleSection("contact")}
        >
          {renderField("Email Address", formData.email)}
          {renderField("Phone Number", formData.phone)}
          {renderField("Website", formData.website, (website) => (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {website}
            </a>
          ))}
        </AccordionSection>

        {/* Location Details Section */}
        <AccordionSection
          title="Location Details"
          icon={<MapPin className="h-5 w-5 text-red-400" />}
          isExpanded={expandedSections.location}
          onToggle={() => toggleSection("location")}
        >
          {renderField("Country", formData.country)}
          {renderField("State/Province", formData.state)}
          {renderField("City", formData.city)}
          {renderField("Postal Code", formData.postalCode)}
        </AccordionSection>

        {/* Media & Content Section */}
        <AccordionSection
          title="Media & Content"
          icon={<Image className="h-5 w-5 text-purple-400" />}
          isExpanded={expandedSections.media}
          onToggle={() => toggleSection("media")}
        >
          {renderField("Main Image", formData.imageUrl, (imageUrl) => (
            <div className="flex items-center space-x-3">
              <img
                src={imageUrl}
                alt="Business"
                className="h-16 w-16 object-cover rounded-lg border border-gray-700"
              />
              <span className="text-gray-400 text-xs">Main business image</span>
            </div>
          ))}
          {renderField("Gallery Images", formData.galleryImages, (images) => (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {images.map(
                  (image: { id: string; url: string }, index: number) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={`Gallery ${index + 1}`}
                      className="h-12 w-12 object-cover rounded border border-gray-700"
                    />
                  )
                )}
              </div>
              <span className="text-gray-400 text-xs">
                {images.length} gallery image{images.length !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
          {renderField(
            "Promotional Video",
            formData.promoVideoUrl,
            (videoUrl) => (
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4 text-red-400" />
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                  View Video
                </a>
              </div>
            )
          )}
        </AccordionSection>

        {/* Social Media Section */}
        <AccordionSection
          title="Social Media"
          icon={<Share2 className="h-5 w-5 text-pink-400" />}
          isExpanded={expandedSections.social}
          onToggle={() => toggleSection("social")}
        >
          {renderField("Social Links", formData.socialLinks, (socialLinks) => (
            <div className="space-y-2">
              {Object.entries(socialLinks)
                .filter(([key, value]) => value)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-gray-400 text-sm capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <a
                      href={String(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      View Profile
                    </a>
                  </div>
                ))}
            </div>
          ))}
        </AccordionSection>
      </div>

      {/* Plan Information */}
      {planName && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Selected Plan</h3>
              <p className="text-blue-300 text-sm">{planName}</p>
            </div>
            {planPrice && (
              <div className="text-right">
                <span className="text-white font-medium">${planPrice}</span>
                <p className="text-blue-300 text-xs">per year</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-800 text-red-500 rounded-lg p-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default BusinessSummaryStep;
