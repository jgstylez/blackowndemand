import React from "react";
import { Clock } from "lucide-react";

interface BusinessHoursStepProps {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  error: string;
  setError: (err: string | null) => void;
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const HOURS_OPTIONS = [
  { value: "", label: "Select hours" },
  { value: "Closed", label: "Closed" },
  { value: "24 Hours", label: "24 Hours" },
  { value: "6:00 AM - 2:00 PM", label: "6:00 AM - 2:00 PM" },
  { value: "7:00 AM - 3:00 PM", label: "7:00 AM - 3:00 PM" },
  { value: "8:00 AM - 4:00 PM", label: "8:00 AM - 4:00 PM" },
  { value: "9:00 AM - 5:00 PM", label: "9:00 AM - 5:00 PM" },
  { value: "10:00 AM - 6:00 PM", label: "10:00 AM - 6:00 PM" },
  { value: "11:00 AM - 7:00 PM", label: "11:00 AM - 7:00 PM" },
  { value: "12:00 PM - 8:00 PM", label: "12:00 PM - 8:00 PM" },
  { value: "1:00 PM - 9:00 PM", label: "1:00 PM - 9:00 PM" },
  { value: "2:00 PM - 10:00 PM", label: "2:00 PM - 10:00 PM" },
  { value: "3:00 PM - 11:00 PM", label: "3:00 PM - 11:00 PM" },
  { value: "4:00 PM - 12:00 AM", label: "4:00 PM - 12:00 AM" },
  { value: "5:00 PM - 1:00 AM", label: "5:00 PM - 1:00 AM" },
  { value: "6:00 PM - 2:00 AM", label: "6:00 PM - 2:00 AM" },
  { value: "7:00 PM - 3:00 AM", label: "7:00 PM - 3:00 AM" },
  { value: "8:00 PM - 4:00 AM", label: "8:00 PM - 4:00 AM" },
  { value: "9:00 PM - 5:00 AM", label: "9:00 PM - 5:00 AM" },
  { value: "10:00 PM - 6:00 AM", label: "10:00 PM - 6:00 AM" },
  { value: "11:00 PM - 7:00 AM", label: "11:00 PM - 7:00 AM" },
  { value: "12:00 AM - 8:00 AM", label: "12:00 AM - 8:00 AM" },
];

const BusinessHoursStep: React.FC<BusinessHoursStepProps> = ({
  formData,
  setFormData,
  error,
  setError,
}) => {
  const handleHoursChange = (day: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      business_hours: {
        ...(prev.business_hours || {}),
        [day]: value,
      },
    }));
    setError(null);
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Business Hours</h3>
        <span className="text-sm text-gray-400">(Optional)</span>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <p className="text-gray-300 text-sm">
          Set your business operating hours to help customers know when you're
          available. You can leave this blank and add hours later from your
          dashboard.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day}>
            <label
              htmlFor={`hours_${day}`}
              className="block text-sm text-gray-300 mb-2"
            >
              {getDayLabel(day)}
            </label>
            <select
              id={`hours_${day}`}
              name={`business_hours.${day}`}
              value={(formData.business_hours || {})[day] || ""}
              onChange={(e) => handleHoursChange(day, e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              {HOURS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          💡 <strong>Tip:</strong> You can always update your business hours
          later from your dashboard.
        </p>
      </div>
    </div>
  );
};

export default BusinessHoursStep;
