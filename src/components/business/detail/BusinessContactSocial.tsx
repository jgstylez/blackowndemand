import React from "react";
import { MapPin, Globe, Phone, Mail } from "lucide-react";
import {
  trackWebsiteClick,
  trackPhoneClick,
  trackEmailClick,
  trackSocialClick,
} from "../../../utils/analyticsUtils";

interface BusinessContactSocialProps {
  business: any;
}

const BusinessContactSocial: React.FC<BusinessContactSocialProps> = ({
  business,
}) => {
  if (!business) return null;

  // Add debugging to see what data is being received
  console.log("🔍 BusinessContactSocial received business data:", {
    id: business.id,
    name: business.name,
    city: business.city,
    state: business.state,
    zip_code: business.zip_code,
    website_url: business.website_url,
    phone: business.phone,
    email: business.email,
    social_links: business.social_links,
  });

  const handleWebsiteClick = async (e: React.MouseEvent) => {
    try {
      await trackWebsiteClick(business.id, business.website_url);
    } catch (error) {
      console.error("Error tracking website click:", error);
    }
    // Continue with normal link behavior
  };

  const handlePhoneClick = async (e: React.MouseEvent) => {
    try {
      await trackPhoneClick(business.id, business.phone);
    } catch (error) {
      console.error("Error tracking phone click:", error);
    }
    // Continue with normal link behavior
  };

  const handleEmailClick = async (e: React.MouseEvent) => {
    try {
      await trackEmailClick(business.id, business.email);
    } catch (error) {
      console.error("Error tracking email click:", error);
    }
    // Continue with normal link behavior
  };

  const handleSocialClick = async (platform: string, url: string) => {
    try {
      await trackSocialClick(business.id, platform, url);
    } catch (error) {
      console.error("Error tracking social click:", error);
    }
    // Continue with normal link behavior
  };

  // Check if we have any contact information to display
  const hasContactInfo =
    business.city || business.website_url || business.phone || business.email;

  console.log("🔍 BusinessContactSocial hasContactInfo:", hasContactInfo);

  if (!hasContactInfo) {
    console.log("🔍 BusinessContactSocial: No contact info to display");
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">
        Contact Information
      </h2>
      <div className="space-y-4">
        {/* Location - Show if we have any location info */}
        {(business.city || business.state || business.zip_code) && (
          <div className="flex items-center text-gray-400">
            <MapPin className="h-5 w-5 mr-3" />
            <span>
              {[business.city, business.state, business.zip_code]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}

        {business.website_url && (
          <div className="flex items-center text-gray-400">
            <Globe className="h-5 w-5 mr-3" />
            <a
              href={business.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300"
              onClick={handleWebsiteClick}
            >
              Visit website
            </a>
          </div>
        )}

        {business.phone && (
          <div className="flex items-center text-gray-400">
            <Phone className="h-5 w-5 mr-3" />
            <a
              href={`tel:${business.phone}`}
              className="text-white hover:text-gray-300"
              onClick={handlePhoneClick}
            >
              {business.phone}
            </a>
          </div>
        )}

        {business.email && (
          <div className="flex items-center text-gray-400">
            <Mail className="h-5 w-5 mr-3" />
            <a
              href={`mailto:${business.email}`}
              className="text-white hover:text-gray-300"
              onClick={handleEmailClick}
            >
              Email business owner
            </a>
          </div>
        )}
      </div>

      {/* Social Media Links */}
      {business.social_links &&
        Object.keys(business.social_links).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Social Media
            </h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(business.social_links)
                .filter(([_, url]) => url && url !== "") // Only show non-empty social links
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-gray-300"
                    onClick={() => handleSocialClick(platform, url as string)}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default BusinessContactSocial;
