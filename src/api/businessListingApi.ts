// API functions for Business Listing Page
// Move fetchCountries, fetchStates, fetchCities, business CRUD, etc. here.

import { supabase } from "../lib/supabase";

export const fetchCountries = async () => {
  const response = await fetch("https://countriesnow.space/api/v0.1/countries");
  return response.json();
};

export const fetchStates = async (country: string) => {
  const response = await fetch(
    "https://countriesnow.space/api/v0.1/countries/states",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    }
  );
  return response.json();
};

export const fetchCities = async (country: string, state: string) => {
  const response = await fetch(
    "https://countriesnow.space/api/v0.1/countries/state/cities",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state }),
    }
  );
  return response.json();
};

// Add business CRUD and other API functions as needed
