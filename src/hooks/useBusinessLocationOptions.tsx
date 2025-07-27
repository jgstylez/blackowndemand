import { useState, useEffect } from "react";
import {
  fetchCountries,
  fetchStates,
  fetchCities,
} from "../api/businessListingApi";

export interface LocationOption {
  value: string;
  label: string;
}

export const useBusinessLocationOptions = (
  initialCountry = "",
  initialState = "",
  initialCity = ""
) => {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<LocationOption | null>(
    initialCountry ? { value: initialCountry, label: initialCountry } : null
  );
  const [selectedState, setSelectedState] = useState<LocationOption | null>(
    initialState ? { value: initialState, label: initialState } : null
  );
  const [selectedCity, setSelectedCity] = useState<LocationOption | null>(
    initialCity ? { value: initialCity, label: initialCity } : null
  );

  // Fetch countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const data = await fetchCountries();
        if (!data.error && data.data) {
          setCountries(
            data.data.map((country: any) => ({
              value: country.country,
              label: country.country,
            }))
          );
        }
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Fetch states when country changes
  const handleCountryChange = async (option: LocationOption | null) => {
    setSelectedCountry(option);
    setSelectedState(null);
    setSelectedCity(null);
    setStates([]);
    setCities([]);
    if (option) {
      setLoadingStates(true);
      try {
        const data = await fetchStates(option.value);
        if (!data.error && data.data?.states) {
          setStates(
            data.data.states.map((state: any) => ({
              value: state.name,
              label: state.name,
            }))
          );
        }
      } finally {
        setLoadingStates(false);
      }
    }
  };

  // Fetch cities when state changes
  const handleStateChange = async (option: LocationOption | null) => {
    setSelectedState(option);
    setSelectedCity(null);
    setCities([]);
    if (option && selectedCountry) {
      setLoadingCities(true);
      try {
        const data = await fetchCities(selectedCountry.value, option.value);
        if (!data.error && data.data) {
          setCities(
            data.data.map((city: string) => ({
              value: city,
              label: city,
            }))
          );
        }
      } finally {
        setLoadingCities(false);
      }
    }
  };

  const handleCityChange = (option: LocationOption | null) => {
    setSelectedCity(option);
  };

  // Manual input handler for country/state/city fields
  const handleLocationInputChange = (
    field: "country" | "state" | "city",
    value: string
  ) => {
    if (field === "country") {
      setSelectedCountry(null);
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    } else if (field === "state") {
      setSelectedState(null);
      setCities([]);
      setSelectedCity(null);
    } else if (field === "city") {
      setSelectedCity(null);
    }
  };

  return {
    countries,
    states,
    cities,
    loadingCountries,
    loadingStates,
    loadingCities,
    selectedCountry,
    selectedState,
    selectedCity,
    handleCountryChange,
    handleStateChange,
    handleCityChange,
    handleLocationInputChange,
    setCountries,
    setStates,
    setCities,
    setSelectedCountry,
    setSelectedState,
    setSelectedCity,
  };
};
