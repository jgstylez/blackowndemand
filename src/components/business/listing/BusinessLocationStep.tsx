import React from "react";
import LocationFields from "../../common/LocationFields";

interface BusinessLocationStepProps {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  error: string;
  setError: (err: string | null) => void;
}

const BusinessLocationStep: React.FC<BusinessLocationStepProps> = ({
  formData,
  setFormData,
  error,
  setError,
}) => (
  <LocationFields
    country={formData.country || ""}
    state={formData.state || ""}
    city={formData.city || ""}
    postalCode={formData.postalCode || ""}
    onChange={(field, value) =>
      setFormData((prev: any) => ({ ...prev, [field]: value }))
    }
    error={error || ""}
  />
);

export default BusinessLocationStep;
