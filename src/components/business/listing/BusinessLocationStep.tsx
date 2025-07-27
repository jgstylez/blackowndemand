import React from "react";
import LocationFields from "../../common/LocationFields";

interface BusinessLocationStepProps {
  formData: any;
  setFormData: (data: any) => void;
  updateFormData?: (updates: any) => void;
  nextStep: () => void;
}

const BusinessLocationStep: React.FC<BusinessLocationStepProps> = ({
  formData,
  setFormData,
  updateFormData,
  nextStep,
}) => {
  const handleLocationChange = (field: string, value: string) => {
    if (updateFormData) {
      updateFormData({ [field]: value });
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* <h2 className="text-2xl font-bold text-white">Business Location</h2> */}
      <p className="text-gray-400">
        Where is your business located? This helps customers find you.
      </p>

      <LocationFields
        country={formData.country}
        state={formData.state}
        city={formData.city}
        postalCode={formData.postalCode || formData.zipCode}
        onChange={handleLocationChange}
      />
    </div>
  );
};

export default BusinessLocationStep;
