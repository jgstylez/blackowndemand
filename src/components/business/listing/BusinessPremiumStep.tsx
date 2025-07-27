import React from "react";
import {
  Star,
  Video,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";

interface BusinessPremiumStepProps {
  formData: {
    promoVideoUrl: string;
    socialLinks: {
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
      theBlackTube: string;
      fanbase: string;
    };
  };
  setFormData: (data: any) => void;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSocialLinkChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  planName?: string;
}

const BusinessPremiumStep: React.FC<BusinessPremiumStepProps> = ({
  formData,
  setFormData,
  handleChange,
  handleSocialLinkChange,
  planName,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleChange) {
      handleChange(e);
    } else {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSocialInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleSocialLinkChange) {
      handleSocialLinkChange(e);
    } else {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        socialLinks: { ...formData.socialLinks, [name]: value },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          Premium Features
        </h3>
        <p className="text-gray-400 text-sm">
          Your {planName} includes these additional features to enhance your
          business listing. All fields below are optional.
        </p>
      </div>

      <div>
        <label
          htmlFor="promoVideoUrl"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Promo Video URL (Optional)
        </label>
        <div className="relative">
          <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            id="promoVideoUrl"
            name="promoVideoUrl"
            value={formData.promoVideoUrl}
            onChange={handleInputChange}
            className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            placeholder="https://theblacktube.com/embed/D1UMvOIf9Fzqjfj"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Only videos are supported via The BlackTube.{" "}
          <a
            href="https://theblacktube.com/register?invite=3555839516347fbdc231f85.93072946&fbclid=PAQ0xDSwK4hiRleHRuA2FlbQIxMAABp57tcvmPj_ekt1TJm6y8xbmiIs1tWlp5uCBU-OUgm9em-7UI3H7jUkxtYl8j_aem_xI4s2OvmZ5so0LsrQoAUBQ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            Create an account here
          </a>
          , upload your video, then copy and paste the embed code in the input
          field above.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Social Media Links (Optional)
        </label>

        <div className="space-y-4">
          {/* Facebook */}
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="url"
              name="facebook"
              value={formData.socialLinks.facebook}
              onChange={handleSocialInputChange}
              className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="https://facebook.com/yourbusiness"
            />
          </div>

          {/* Instagram */}
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="url"
              name="instagram"
              value={formData.socialLinks.instagram}
              onChange={handleSocialInputChange}
              className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="https://instagram.com/yourbusiness"
            />
          </div>

          {/* Twitter */}
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="url"
              name="twitter"
              value={formData.socialLinks.twitter}
              onChange={handleSocialInputChange}
              className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="https://twitter.com/yourbusiness"
            />
          </div>

          {/* LinkedIn */}
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="url"
              name="linkedin"
              value={formData.socialLinks.linkedin}
              onChange={handleSocialInputChange}
              className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="https://linkedin.com/company/yourbusiness"
            />
          </div>

          {/* The BlackTube */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M21.582 7.15c-.239-2.012-.978-3.707-2.889-3.889C16.375 3.017 13.692 3 12.001 3h-.002c-1.691 0-4.374.017-6.692.261-1.911.182-2.65 1.877-2.889 3.889C2.167 9.215 2 11.515 2 13.612v.776c0 2.097.167 4.397.418 6.462.239 2.012.978 3.707 2.889 3.889 2.318.244 5.001.261 6.692.261h.002c1.691 0 4.374-.017 6.692-.261 1.911-.182 2.65-1.877 2.889-3.889.251-2.065.418-4.365.418-6.462v-.776c0-2.097-.167-4.397-.418-6.462zM9.5 16.5v-9l7 4.5-7 4.5z" />
              </svg>
            </div>
            <input
              type="url"
              name="theBlackTube"
              value={formData.socialLinks.theBlackTube}
              onChange={handleSocialInputChange}
              className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="https://theblacktube.com/yourbusiness"
            />
          </div>

          {/* Fanbase */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                viewBox="0 0 512 512"
                className="h-5 w-5"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M199.7,62.7l-93.4,246.3h33.9l-58.8,147l155.2-196.6h-25l28.5-49.4H284l34.9-41.8h-53.7l25.7-39h78l61.9-66.4H199.7z"
                />
              </svg>
            </div>
            <input
              type="url"
              name="fanbase"
              value={formData.socialLinks.fanbase}
              onChange={handleSocialInputChange}
              className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="https://fanbase.app/yourbusiness"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPremiumStep;
