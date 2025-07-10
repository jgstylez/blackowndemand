import React, { useEffect, useState } from "react";
import Select from "react-select";
import { MapPin, Loader2 } from "lucide-react";

// Types for location
interface LocationOption {
  value: string;
  label: string;
}

interface LocationFieldsProps {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  onChange: (
    field: "country" | "state" | "city" | "postalCode",
    value: string
  ) => void;
  error?: string;
}

const LocationFields: React.FC<LocationFieldsProps> = ({
  country,
  state,
  city,
  postalCode,
  onChange,
  error,
}) => {
  // Local state for dropdowns
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<LocationOption | null>(
    country ? { value: country, label: country } : null
  );
  const [selectedState, setSelectedState] = useState<LocationOption | null>(
    state ? { value: state, label: state } : null
  );
  const [selectedCity, setSelectedCity] = useState<LocationOption | null>(
    city ? { value: city, label: city } : null
  );

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries"
        );
        const data = await response.json();
        if (!data.error && data.data) {
          const countryOptions = data.data.map((c: any) => ({
            value: c.country,
            label: c.country,
          }));
          setCountries(countryOptions);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (!selectedCountry) return;
    const fetchStates = async () => {
      setLoadingStates(true);
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry.value }),
          }
        );
        const data = await response.json();
        if (!data.error && data.data?.states) {
          const stateOptions = data.data.states.map((s: any) => ({
            value: s.name,
            label: s.name,
          }));
          setStates(stateOptions);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!selectedCountry || !selectedState) return;
    const fetchCities = async () => {
      setLoadingCities(true);
      setCities([]);
      setSelectedCity(null);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/state/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              country: selectedCountry.value,
              state: selectedState.value,
            }),
          }
        );
        const data = await response.json();
        if (!data.error && data.data) {
          const cityOptions = data.data.map((c: string) => ({
            value: c,
            label: c,
          }));
          setCities(cityOptions);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedCountry, selectedState]);

  // Sync props to local selection
  useEffect(() => {
    if (country && (!selectedCountry || selectedCountry.value !== country)) {
      setSelectedCountry({ value: country, label: country });
    }
  }, [country]);
  useEffect(() => {
    if (state && (!selectedState || selectedState.value !== state)) {
      setSelectedState({ value: state, label: state });
    }
  }, [state]);
  useEffect(() => {
    if (city && (!selectedCity || selectedCity.value !== city)) {
      setSelectedCity({ value: city, label: city });
    }
  }, [city]);

  return (
    <div className="space-y-6">
      {/* Country */}
      <div>
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Country <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10 pointer-events-none" />
          {loadingCountries ? (
            <div className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading countries...
            </div>
          ) : (
            <Select
              value={selectedCountry}
              onChange={(option) => {
                setSelectedCountry(option);
                onChange("country", option?.value || "");
              }}
              options={countries}
              placeholder="Start typing to search or enter manually"
              isClearable
              isSearchable
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 1050 }),
                menu: (base) => ({ ...base, zIndex: 1050 }),
              }}
              classNames={{
                control: (state) =>
                  `!bg-gray-900 !border-gray-700 !rounded-lg !text-white !pl-10 !min-h-[46px] ${
                    state.isFocused
                      ? "!ring-2 !ring-white !border-transparent"
                      : ""
                  }`,
                menu: () =>
                  "!bg-gray-900 !border !border-gray-700 !rounded-lg !mt-1",
                menuList: () => "!p-1",
                option: (state) =>
                  `!px-3 !py-2 !rounded-md ${
                    state.isFocused
                      ? "!bg-gray-800 !text-white"
                      : "!bg-gray-900 !text-gray-300"
                  }`,
                singleValue: () => "!text-white",
                placeholder: () => "!text-gray-400",
                input: () => "!text-white",
                indicatorsContainer: () => "!text-gray-400",
                clearIndicator: () => "hover:!text-white !cursor-pointer",
                dropdownIndicator: () => "hover:!text-white !cursor-pointer",
              }}
              noOptionsMessage={() => "No countries found"}
              onInputChange={(input) => {
                if (!input) return;
                // Allow free text fallback
                onChange("country", input);
              }}
            />
          )}
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Start typing to search or enter it manually if not listed
        </p>
      </div>
      {/* State */}
      <div>
        <label
          htmlFor="state"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          State/Province/Region <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-20 pointer-events-none" />
          {loadingStates ? (
            <div className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading states...
            </div>
          ) : (
            <Select
              value={selectedState}
              onChange={(option) => {
                setSelectedState(option);
                onChange("state", option?.value || "");
              }}
              options={states}
              placeholder="Start typing to search or enter manually"
              isClearable
              isSearchable
              isDisabled={!selectedCountry}
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 1050 }),
                menu: (base) => ({ ...base, zIndex: 1050 }),
              }}
              classNames={{
                control: (state) =>
                  `!bg-gray-900 !border-gray-700 !rounded-lg !text-white !pl-10 !min-h-[46px] ${
                    state.isFocused
                      ? "!ring-2 !ring-white !border-transparent"
                      : ""
                  } ${!selectedCountry ? "!opacity-50" : ""}`,
                menu: () =>
                  "!bg-gray-900 !border !border-gray-700 !rounded-lg !mt-1",
                menuList: () => "!p-1",
                option: (state) =>
                  `!px-3 !py-2 !rounded-md ${
                    state.isFocused
                      ? "!bg-gray-800 !text-white"
                      : "!bg-gray-900 !text-gray-300"
                  }`,
                singleValue: () => "!text-white",
                placeholder: () => "!text-gray-400",
                input: () => "!text-white",
                indicatorsContainer: () => "!text-gray-400",
                clearIndicator: () => "hover:!text-white !cursor-pointer",
                dropdownIndicator: () => "hover:!text-white !cursor-pointer",
              }}
              noOptionsMessage={() =>
                !selectedCountry
                  ? "Please select a country first"
                  : "No states found"
              }
              onInputChange={(input) => {
                if (!input) return;
                onChange("state", input);
              }}
            />
          )}
        </div>
        <p className="mt-2 text-sm text-gray-400">
          {!selectedCountry
            ? "Select a country first"
            : "Start typing to search or enter it manually if not listed"}
        </p>
      </div>
      {/* City */}
      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          City <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-20 pointer-events-none" />
          {loadingCities ? (
            <div className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading cities...
            </div>
          ) : (
            <Select
              value={selectedCity}
              onChange={(option) => {
                setSelectedCity(option);
                onChange("city", option?.value || "");
              }}
              options={cities}
              placeholder="Start typing to search or enter manually"
              isClearable
              isSearchable
              isDisabled={!selectedState}
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 1050 }),
                menu: (base) => ({ ...base, zIndex: 1050 }),
              }}
              classNames={{
                control: (state) =>
                  `!bg-gray-900 !border-gray-700 !rounded-lg !text-white !pl-10 !min-h-[46px] ${
                    state.isFocused
                      ? "!ring-2 !ring-white !border-transparent"
                      : ""
                  } ${!selectedState ? "!opacity-50" : ""}`,
                menu: () =>
                  "!bg-gray-900 !border !border-gray-700 !rounded-lg !mt-1",
                menuList: () => "!p-1",
                option: (state) =>
                  `!px-3 !py-2 !rounded-md ${
                    state.isFocused
                      ? "!bg-gray-800 !text-white"
                      : "!bg-gray-900 !text-gray-300"
                  }`,
                singleValue: () => "!text-white",
                placeholder: () => "!text-gray-400",
                input: () => "!text-white",
                indicatorsContainer: () => "!text-gray-400",
                clearIndicator: () => "hover:!text-white !cursor-pointer",
                dropdownIndicator: () => "hover:!text-white !cursor-pointer",
              }}
              noOptionsMessage={() =>
                !selectedState
                  ? "Please select a state first"
                  : "No cities found"
              }
              onInputChange={(input) => {
                if (!input) return;
                onChange("city", input);
              }}
            />
          )}
        </div>
        <p className="mt-2 text-sm text-gray-400">
          {!selectedState
            ? "Select a state first"
            : "Start typing to search or enter it manually if not listed"}
        </p>
      </div>
      {/* Postal Code */}
      <div>
        <label
          htmlFor="postalCode"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Postal Code <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-20 pointer-events-none" />
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            placeholder="Postal/ZIP Code"
            required
          />
        </div>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default LocationFields;
