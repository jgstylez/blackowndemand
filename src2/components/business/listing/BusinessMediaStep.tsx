import React from "react";
import { Camera, Globe, Mail, Phone } from "lucide-react";

interface BusinessMediaStepProps {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  error: string;
  setError: (err: string | null) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleSocialLinkChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BusinessMediaStep: React.FC<BusinessMediaStepProps> = ({
  formData,
  setFormData,
  error,
  setError,
  handleImageUpload,
  handleChange,
  handleSocialLinkChange,
}) => (
  <div className="space-y-6">
    <div>
      <label
        htmlFor="image"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Business Image <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          required={!formData.imageUrl}
        />
        <label
          htmlFor="image"
          className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-white transition-colors"
        >
          {formData.imageUrl ? (
            <img
              src={formData.imageUrl}
              alt="Business"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <span className="mt-2 block text-sm text-gray-400">
                Upload business image <span className="text-red-500">*</span>
              </span>
            </div>
          )}
        </label>
      </div>
    </div>

    <div>
      <label
        htmlFor="website"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Website URL <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          placeholder="https://example.com"
          required
        />
      </div>
    </div>

    <div>
      <label
        htmlFor="email"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Business Email <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          placeholder="business@example.com"
          required
        />
      </div>
    </div>

    <div>
      <label
        htmlFor="phone"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Business Phone <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          placeholder="International format: +1234567890"
          required
        />
      </div>
    </div>
  </div>
);

export default BusinessMediaStep;
