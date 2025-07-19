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
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleSocialLinkChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BusinessPremiumStep: React.FC<BusinessPremiumStepProps> = ({
  formData,
  setFormData,
  handleChange,
  handleSocialLinkChange,
}) => (
  <div className="space-y-6">
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-400" />
        Premium Features
      </h3>
      <p className="text-gray-400 text-sm">
        Your plan includes these additional features to enhance your business
        listing. All fields below are optional.
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
          onChange={handleChange}
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
            onChange={handleSocialLinkChange}
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
            onChange={handleSocialLinkChange}
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
            onChange={handleSocialLinkChange}
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
            onChange={handleSocialLinkChange}
            className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            placeholder="https://linkedin.com/company/yourbusiness"
          />
        </div>
      </div>
    </div>
  </div>
);

export default BusinessPremiumStep;
