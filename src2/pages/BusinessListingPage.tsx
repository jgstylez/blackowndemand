import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import PaymentModal from "../components/payment/PaymentModal";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Camera,
  Tags,
  Video,
  Link as LinkIcon,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Star,
  Tag,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  BusinessCategory,
  BusinessCategoryLabels,
  BusinessTag,
  BusinessTagLabels,
} from "../types";
import Select from "react-select";
import { debounce } from "lodash";
import DuplicateBusinessModal from "../components/business/DuplicateBusinessModal";
import DiscountCodeInput, {
  DiscountInfo,
} from "../components/payment/DiscountCodeInput";
import { extractVideoSrc } from "../utils/videoUtils";
import LocationFields from "../components/common/LocationFields";
import BusinessInfoStep from "../components/business/listing/BusinessInfoStep";
import BusinessLocationStep from "../components/business/listing/BusinessLocationStep";
import BusinessMediaStep from "../components/business/listing/BusinessMediaStep";
import BusinessPremiumStep from "../components/business/listing/BusinessPremiumStep";
import BusinessSummaryStep from "../components/business/listing/BusinessSummaryStep";

// CountriesNow API interfaces
interface Country {
  country: string;
  iso2: string;
  iso3: string;
}

interface State {
  name: string;
  state_code: string;
}

interface City {
  name: string;
}

interface CountriesResponse {
  error: boolean;
  msg: string;
  data: Country[];
}

interface StatesResponse {
  error: boolean;
  msg: string;
  data: {
    states: State[];
  };
}

interface CitiesResponse {
  error: boolean;
  msg: string;
  data: string[];
}

// Location option interfaces
interface LocationOption {
  value: string;
  label: string;
}

type Step =
  | "payment"
  | "info"
  | "location"
  | "media"
  | "premium_features"
  | "summary";

interface TagOption {
  value: BusinessTag;
  label: string;
}

interface Business {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  email?: string;
  migration_source?: string;
  claimed_at?: string | null;
}

const BusinessListingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract both planPrice and planName from location state
  const planPrice = location.state?.planPrice;
  const planName = location.state?.planName;
  const paymentCompleted = location.state?.paymentCompleted || false;

  // Use a state variable for businessIdToUpdate
  const [businessIdToUpdate, setBusinessIdToUpdate] = useState(() => {
    // Try to get from location.state first
    if (location.state?.businessIdToUpdate) {
      console.log(
        "🟢 Initializing businessIdToUpdate from location.state:",
        location.state.businessIdToUpdate
      );
      return location.state.businessIdToUpdate;
    }
    // Fallback to sessionStorage
    const sessionValue = sessionStorage.getItem("businessIdToUpdate");
    if (sessionValue) {
      console.log(
        "🟢 Initializing businessIdToUpdate from sessionStorage:",
        sessionValue
      );
      return sessionValue;
    }
    console.log("🟡 No initial businessIdToUpdate found");
    return null;
  });

  // Location API state
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<LocationOption | null>(
    null
  );
  const [selectedState, setSelectedState] = useState<LocationOption | null>(
    null
  );
  const [selectedCity, setSelectedCity] = useState<LocationOption | null>(null);

  console.log("Initial planPrice:", planPrice); // Log initial planPrice
  console.log("Payment completed:", paymentCompleted);
  console.log("Business ID to update:", businessIdToUpdate);

  // Determine if premium features should be shown based on plan name
  const isPremiumPlan = planName === "Enhanced" || planName === "VIP Plan";

  // Define steps array dynamically based on plan type and payment status
  const steps = useMemo<Step[]>(() => {
    const baseSteps: Step[] = [];

    // Add payment step first if payment is not completed
    if (!paymentCompleted) {
      baseSteps.push("payment");
    }

    // Add other steps after payment
    baseSteps.push("info", "location", "media");

    // Add premium_features step only for Enhanced and VIP plans
    if (isPremiumPlan) {
      baseSteps.push("premium_features");
    }

    // Add summary step before payment
    baseSteps.push("summary");

    return baseSteps;
  }, [isPremiumPlan, paymentCompleted]);

  // Set initial step based on payment status
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [nameCheckPerformed, setNameCheckPerformed] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number>(
    planPrice || 0
  );
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    category: "",
    tags: [] as BusinessTag[],
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    region: "",
    country: "",
    postalCode: "",
    imageUrl: "",
    promoVideoUrl: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      theBlackTube: "",
      fanbase: "",
    },
  });

  // CountriesNow API functions
  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries"
      );
      const data: CountriesResponse = await response.json();

      if (!data.error && data.data) {
        const countryOptions = data.data.map((country) => ({
          value: country.country,
          label: country.country,
        }));
        setCountries(countryOptions);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchStates = async (country: string) => {
    try {
      setLoadingStates(true);
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);

      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/states",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country }),
        }
      );

      const data: StatesResponse = await response.json();

      if (!data.error && data.data?.states) {
        const stateOptions = data.data.states.map((state) => ({
          value: state.name,
          label: state.name,
        }));
        setStates(stateOptions);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (country: string, state: string) => {
    try {
      setLoadingCities(true);
      setCities([]);
      setSelectedCity(null);

      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/state/cities",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country, state }),
        }
      );

      const data: CitiesResponse = await response.json();

      if (!data.error && data.data) {
        const cityOptions = data.data.map((city) => ({
          value: city,
          label: city,
        }));
        setCities(cityOptions);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoadingCities(false);
    }
  };

  // Load countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Handle country selection
  const handleCountryChange = (option: LocationOption | null) => {
    setSelectedCountry(option);
    setFormData((prev) => ({ ...prev, country: option?.value || "" }));

    if (option) {
      fetchStates(option.value);
    } else {
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    }
  };

  // Handle state selection
  const handleStateChange = (option: LocationOption | null) => {
    setSelectedState(option);
    setFormData((prev) => ({ ...prev, state: option?.value || "" }));

    if (option && selectedCountry) {
      fetchCities(selectedCountry.value, option.value);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  };

  // Handle city selection
  const handleCityChange = (option: LocationOption | null) => {
    setSelectedCity(option);
    setFormData((prev) => ({ ...prev, city: option?.value || "" }));
  };

  // Handle manual input for location fields
  const handleLocationInputChange = (
    field: "country" | "state" | "city",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear selections if user types manually
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

  // Determine max tags allowed based on plan
  const maxTagsAllowed = useMemo(() => {
    if (planName === "Enhanced" || planName === "VIP Plan") {
      return 20;
    }
    return 5;
  }, [planName]);

  // Check if we need to load an existing business
  useEffect(() => {
    if (businessIdToUpdate) {
      console.log(
        "🟢 useEffect: businessIdToUpdate changed, fetching business:",
        businessIdToUpdate
      );
      fetchBusinessToUpdate();
    }
  }, [businessIdToUpdate]);

  // Fetch business data if we're updating an existing business
  const fetchBusinessToUpdate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessIdToUpdate)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Populate form data with existing business data
        setFormData({
          name: data.name || "",
          tagline: data.tagline || "",
          description: data.description ?? "",
          category:
            data.category &&
            typeof data.category === "string" &&
            Object.values(BusinessCategory).includes(
              data.category as BusinessCategory
            )
              ? (data.category as BusinessCategory)
              : ("" as BusinessCategory),
          tags: Array.isArray(data.tags)
            ? (data.tags.filter((tag: any) =>
                Object.values(BusinessTag).includes(tag)
              ) as BusinessTag[])
            : [],
          email: data.email || "",
          phone: data.phone || "",
          website: data.website_url || "",
          city: data.city || "",
          state: data.state || "",
          region: "",
          country: data.country || "",
          postalCode: data.zip_code || "",
          imageUrl: data.image_url || "",
          promoVideoUrl: data.promo_video_url || "",
          socialLinks:
            typeof data.social_links === "object" &&
            data.social_links !== null &&
            !Array.isArray(data.social_links)
              ? {
                  facebook: (data.social_links as any).facebook || "",
                  instagram: (data.social_links as any).instagram || "",
                  twitter: (data.social_links as any).twitter || "",
                  linkedin: (data.social_links as any).linkedin || "",
                  theBlackTube: (data.social_links as any).theBlackTube || "",
                  fanbase: (data.social_links as any).fanbase || "",
                }
              : {
                  facebook: "",
                  instagram: "",
                  twitter: "",
                  linkedin: "",
                  theBlackTube: "",
                  fanbase: "",
                },
        });

        // Set location selections if data exists
        if (data.country) {
          const countryOption = countries.find((c) => c.value === data.country);
          if (countryOption) {
            setSelectedCountry(countryOption);
            fetchStates(data.country);
          }
        }
        if (data.state) {
          const stateOption = states.find((s) => s.value === data.state);
          if (stateOption) {
            setSelectedState(stateOption);
            if (data.country) {
              fetchCities(data.country, data.state);
            }
          }
        }
        if (data.city) {
          const cityOption = cities.find((c) => c.value === data.city);
          if (cityOption) {
            setSelectedCity(cityOption);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching business:", err);
      setError("Failed to load business data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // If this is the promo video URL field, extract the src from iframe if present
    if (name === "promoVideoUrl") {
      const extractedSrc = extractVideoSrc(value);
      setFormData((prev) => ({ ...prev, [name]: extractedSrc }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value,
      },
    }));

    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  // Get available tags based on selected category
  const availableTags = useMemo(() => {
    if (!formData.category) {
      // If no category selected, show all tags
      return Object.entries(BusinessTagLabels).map(([value, label]) => ({
        value: value as BusinessTag,
        label,
      }));
    }

    // Map categories to their related tags
    const categoryTagMap: Record<string, BusinessTag[]> = {
      "Arts, Crafts & Party Supplies": [
        BusinessTag.ART_SUPPLIES,
        BusinessTag.PARTY_SUPPLIES,
        BusinessTag.CUSTOM_INVITATIONS,
        BusinessTag.KIDS_CRAFTS,
        BusinessTag.SEASONAL_CRAFTS,
        BusinessTag.PAINT_BRUSHES,
        BusinessTag.CANVAS_BOARDS,
        BusinessTag.GLUE_GLITTER,
        BusinessTag.DIY_KITS,
        BusinessTag.CRAFT_CLASSES,
      ],
      "Auto, Tires & Industrial": [
        BusinessTag.CAR_PARTS,
        BusinessTag.AUTO_ACCESSORIES,
        BusinessTag.MOTOR_OIL,
        BusinessTag.TIRE_SERVICES,
        BusinessTag.CAR_AUDIO,
        BusinessTag.CAR_WASH_KITS,
        BusinessTag.GARAGE_EQUIPMENT,
        BusinessTag.REPAIR_TOOLS,
        BusinessTag.JUMP_STARTERS,
        BusinessTag.LED_HEADLIGHTS,
      ],
      Baby: [
        BusinessTag.BABY_CLOTHES,
        BusinessTag.STROLLERS_CAR_SEATS,
        BusinessTag.DIAPERS_WIPES,
        BusinessTag.NURSERY_DECOR,
        BusinessTag.BABY_MONITORS,
        BusinessTag.FEEDING_SETS,
        BusinessTag.TEETHING_TOYS,
        BusinessTag.CRIBS_BASSINETS,
        BusinessTag.MATERNITY_WEAR,
        BusinessTag.BABY_BOOKS,
      ],
      "Beauty & Cosmetics": [
        BusinessTag.SKINCARE_SETS,
        BusinessTag.LIPSTICKS,
        BusinessTag.FRAGRANCES_PERFUME,
        BusinessTag.HAIR_STYLING_TOOLS,
        BusinessTag.NAIL_POLISH,
        BusinessTag.FACIAL_MASKS,
        BusinessTag.MAKEUP_BRUSHES,
        BusinessTag.ORGANIC_BEAUTY,
        BusinessTag.BARBER_KITS,
        BusinessTag.EYEBROW_KITS,
      ],
      "Clothing, Shoes & Accessories": [
        BusinessTag.WOMENS_FASHION,
        BusinessTag.MENSWEAR,
        BusinessTag.SNEAKERS,
        BusinessTag.FASHION_ACCESSORIES,
        BusinessTag.DESIGNER_BAGS,
        BusinessTag.JEWELRY_SETS,
        BusinessTag.PLUS_SIZE_WEAR,
        BusinessTag.HATS_SCARVES,
        BusinessTag.DENIM_WEAR,
        BusinessTag.KIDS_FASHION,
      ],
      Electronics: [
        BusinessTag.LAPTOPS_COMPUTERS,
        BusinessTag.SMARTPHONES,
        BusinessTag.BLUETOOTH_SPEAKERS,
        BusinessTag.TV_MONITORS,
        BusinessTag.HOME_SECURITY_CAMS,
        BusinessTag.VIDEO_DOORBELLS,
        BusinessTag.GAMING_CONSOLES,
        BusinessTag.HEADPHONES,
        BusinessTag.CHARGING_STATIONS,
        BusinessTag.TECH_ACCESSORIES,
      ],
      "Exercise & Fitness": [
        BusinessTag.DUMBBELLS,
        BusinessTag.YOGA_MATS,
        BusinessTag.RESISTANCE_BANDS,
        BusinessTag.STATIONARY_BIKES,
        BusinessTag.PROTEIN_SHAKES,
        BusinessTag.FOAM_ROLLERS,
        BusinessTag.HOME_GYMS,
        BusinessTag.FITNESS_TIMERS,
        BusinessTag.GYM_CLOTHES,
        BusinessTag.BODYWEIGHT_BARS,
      ],
      "Food & Beverage": [
        BusinessTag.GOURMET_SNACKS,
        BusinessTag.MEAL_KITS,
        BusinessTag.ETHNIC_FOODS,
        BusinessTag.COFFEE_BLENDS,
        BusinessTag.VEGAN_TREATS,
        BusinessTag.COOKING_INGREDIENTS,
        BusinessTag.ARTISAN_BREAD,
        BusinessTag.SPICES_RUBS,
        BusinessTag.SHELF_STABLE_MEALS,
        BusinessTag.BEVERAGE_VARIETY,
      ],
      "Furniture & Appliances": [
        BusinessTag.SOFAS,
        BusinessTag.DINING_TABLES,
        BusinessTag.MICROWAVES,
        BusinessTag.REFRIGERATORS,
        BusinessTag.BED_FRAMES,
        BusinessTag.CLOSET_ORGANIZERS,
        BusinessTag.TV_STANDS,
        BusinessTag.WASHER_DRYER_SETS,
        BusinessTag.OTTOMANS,
        BusinessTag.FUTON_COUCHES,
      ],
      Grocery: [
        BusinessTag.ORGANIC_VEGGIES,
        BusinessTag.PANTRY_ITEMS,
        BusinessTag.FROZEN_GOODS,
        BusinessTag.DELI_ITEMS,
        BusinessTag.DAIRY_EGGS,
        BusinessTag.SNACK_PACKS,
        BusinessTag.BAKING_GOODS,
        BusinessTag.GROCERY_BUNDLES,
        BusinessTag.CEREAL_BOXES,
        BusinessTag.GRAINS_LEGUMES,
      ],
    };

    // Get tags for the selected category
    const categoryTags = categoryTagMap[formData.category] || [];

    return categoryTags.map((tag) => ({
      value: tag,
      label: BusinessTagLabels[tag],
    }));
  }, [formData.category]);

  const handleTagChange = (selectedOptions: readonly TagOption[]) => {
    // Use maxTagsAllowed instead of hardcoded 5
    const newTags = selectedOptions
      .slice(0, maxTagsAllowed)
      .map((option) => option.value);
    setFormData((prev) => ({ ...prev, tags: newTags }));

    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `business-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("business-images").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));

      // Clear error when user uploads an image
      if (error) {
        setError(null);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
    }
  };

  const handlePaymentClick = () => {
    console.log(
      "handlePaymentClick - discountedAmount before opening modal:",
      discountedAmount
    );
    setShowPaymentModal(true);
  };

  const handleApplyDiscount = (info: DiscountInfo) => {
    setDiscountInfo(info);

    // Calculate discounted amount
    if (info.valid && info.discountType && info.discountValue) {
      let newAmount = planPrice;

      if (info.discountType === "percentage") {
        // Apply percentage discount
        const discountAmount = (planPrice * info.discountValue) / 100;
        newAmount = planPrice - discountAmount;
      } else if (info.discountType === "fixed") {
        // Apply fixed discount
        newAmount = planPrice - info.discountValue;
      }

      // Ensure amount doesn't go below zero
      const finalAmount = Math.max(0, newAmount);
      console.log(
        "handleApplyDiscount - calculated newAmount:",
        newAmount,
        "finalAmount:",
        finalAmount
      );
      setDiscountedAmount(finalAmount);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountInfo(null);
    setDiscountedAmount(planPrice);
    console.log("handleRemoveDiscount - reset to planPrice:", planPrice);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log("🟢 handlePaymentSuccess invoked with:", paymentData);
    console.log(
      "🔵 handlePaymentSuccess called with paymentData:",
      paymentData
    );
    console.log(
      "🔵 Current state - planName:",
      planName,
      "planPrice:",
      planPrice,
      "discountedAmount:",
      discountedAmount
    );

    setLoading(true);
    try {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ User not authenticated");
        throw new Error("User not authenticated");
      }

      console.log("✅ User authenticated:", user.id);

      // Create a subscription record first
      console.log("🔵 Creating subscription for plan:", planName);
      const planId = await getPlanIdByName(planName);
      console.log("🔵 Plan ID resolved:", planId);

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .insert({
            plan_id: planId,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 year from now
            payment_status: "paid",
          })
          .select()
          .single();

      if (subscriptionError) {
        console.error("❌ Error creating subscription:", subscriptionError);
        throw subscriptionError;
      }

      console.log("✅ Subscription created successfully:", subscriptionData);

      // Create a minimal business record
      console.log("🔵 Creating initial business record");
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: "Pending Business Listing",
          owner_id: user.id,
          subscription_id: subscriptionData.id,
          is_active: false, // Initially inactive until details are filled
          is_verified: true, // Set is_verified to true by default for new businesses
        })
        .select()
        .single();

      if (businessError) {
        console.error("❌ Error creating business:", businessError);
        throw businessError;
      }

      console.log("✅ Initial business record created:", businessData);

      // Store the business ID for updating later
      let newBusinessId = businessData.id;
      console.log("✅ Business ID stored:", newBusinessId);
      setBusinessIdToUpdate(newBusinessId);
      sessionStorage.setItem("businessIdToUpdate", newBusinessId);

      // Fallback: If businessId is missing, try to fetch by user and subscription
      if (!newBusinessId) {
        console.warn(
          "⚠️ Business ID missing after insert. Attempting fallback fetch..."
        );
        const { data: fallbackBusiness, error: fallbackError } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .eq("subscription_id", subscriptionData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (fallbackError) {
          console.error("❌ Fallback fetch failed:", fallbackError);
        } else if (fallbackBusiness && fallbackBusiness.id) {
          newBusinessId = fallbackBusiness.id;
          setBusinessIdToUpdate(newBusinessId);
          sessionStorage.setItem("businessIdToUpdate", newBusinessId);
          console.log("✅ Fallback business ID found and set:", newBusinessId);
        } else {
          setError(
            "Failed to create or find your business record. Please contact support."
          );
          console.error("❌ Could not find business for user after payment.");
          return;
        }
      }

      // Close payment modal
      setShowPaymentModal(false);

      // Save payment info to session storage for persistence
      sessionStorage.setItem("paymentCompleted", "true");
      sessionStorage.setItem("planName", planName || "");
      sessionStorage.setItem("planPrice", planPrice?.toString() || "0");
      console.log(
        "🔵 Session storage updated with business ID:",
        newBusinessId
      );

      // Only navigate if not already on /business/new
      if (window.location.pathname !== "/business/new") {
        console.log("🔵 Navigating to /business/new with new state");
        navigate("/business/new", {
          state: {
            paymentCompleted: true,
            businessIdToUpdate: newBusinessId,
            planName,
            planPrice,
          },
          replace: true,
        });
      } else {
        console.log("🟢 Already on /business/new, updating state in place");
        setCurrentStep("info");
      }
      // Move to the info step
      // setCurrentStep("info"); // This line is now handled by the if/else block above
      console.log("✅ Payment success flow completed successfully");
    } catch (error) {
      console.error("❌ Error in payment success handler:", error);
      setError("Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get plan ID by name
  const getPlanIdByName = async (
    planName: string | undefined
  ): Promise<string> => {
    if (!planName) throw new Error("Plan name is required");

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("name", planName)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Plan not found: ${planName}`);

    return data.id;
  };

  // Debounced function to check for similar businesses
  const checkForSimilarBusinesses = useMemo(
    () =>
      debounce(async (businessName: string) => {
        if (!businessName || businessName.length < 3) return;

        try {
          const { data, error } = await supabase
            .from("businesses")
            .select(
              "id, name, description, email, image_url, migration_source, claimed_at"
            )
            .ilike("name", `%${businessName}%`)
            .limit(5);

          if (error) {
            console.error("Error checking for similar businesses:", error);
            return;
          }

          if (data && data.length > 0) {
            setSimilarBusinesses(
              data.map((b: any) => ({
                id: b.id,
                name: b.name,
                description: b.description ?? undefined,
                email: b.email ?? undefined,
                image_url: b.image_url ?? undefined,
                migration_source: b.migration_source ?? undefined,
                claimed_at: b.claimed_at ?? undefined,
              }))
            );
            setShowDuplicateModal(true);
          } else {
            setNameCheckPerformed(true);
          }
        } catch (err) {
          console.error("Error checking for similar businesses:", err);
        }
      }, 500),
    []
  );

  // Check for similar businesses when the name field loses focus
  const handleNameBlur = () => {
    if (formData.name && formData.name.length >= 3 && !nameCheckPerformed) {
      checkForSimilarBusinesses(formData.name);
    }
  };

  // Clear the debounce on unmount
  useEffect(() => {
    return () => {
      checkForSimilarBusinesses.cancel();
    };
  }, [checkForSimilarBusinesses]);

  // Check for saved data in session storage on component mount
  useEffect(() => {
    const savedPaymentCompleted =
      sessionStorage.getItem("paymentCompleted") === "true";
    const savedBusinessId = sessionStorage.getItem("businessIdToUpdate");
    const savedPlanName = sessionStorage.getItem("planName");
    const savedPlanPrice = sessionStorage.getItem("planPrice");

    // If we have saved data and no location state, restore from session storage
    if (savedPaymentCompleted && savedBusinessId && !location.state) {
      navigate("/business/new", {
        state: {
          paymentCompleted: true,
          businessIdToUpdate: savedBusinessId,
          planName: savedPlanName,
          planPrice: savedPlanPrice ? parseFloat(savedPlanPrice) : undefined,
        },
        replace: true,
      });
    }
  }, []);

  // Sort categories alphabetically by label
  const sortedCategories = Object.entries(BusinessCategoryLabels).sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  // Validation functions for each step
  const validateInfoStep = (): boolean => {
    if (!formData.name.trim()) {
      setError("Business name is required");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Business description is required");
      return false;
    }

    if (!formData.category) {
      setError("Please select a business category");
      return false;
    }

    return true;
  };

  const validateLocationStep = (): boolean => {
    if (!formData.country.trim()) {
      setError("Country is required");
      return false;
    }

    if (!formData.city.trim()) {
      setError("City is required");
      return false;
    }

    if (!formData.state.trim()) {
      setError("State/Province/Region is required");
      return false;
    }

    if (!formData.postalCode.trim()) {
      setError("Postal code is required");
      return false;
    }

    return true;
  };

  const validateMediaStep = (): boolean => {
    if (!formData.imageUrl) {
      setError("Business image is required");
      return false;
    }

    if (!formData.website.trim()) {
      setError("Website URL is required");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Business email is required");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("Business phone is required");
      return false;
    }

    // Basic URL validation
    if (
      !formData.website.startsWith("http://") &&
      !formData.website.startsWith("https://")
    ) {
      setError("Website URL must start with http:// or https://");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  // Function to submit the final business data
  const submitBusinessData = async () => {
    console.log(" submitBusinessData called");
    console.log(" businessIdToUpdate (state):", businessIdToUpdate);
    console.log("🔵 Location state:", location.state);
    console.log(
      "🔵 Session storage businessIdToUpdate:",
      sessionStorage.getItem("businessIdToUpdate")
    );

    if (!businessIdToUpdate) {
      console.error("❌ No business ID found. Available data:");
      console.error("  - businessIdToUpdate state:", businessIdToUpdate);
      console.error("  - location.state:", location.state);
      console.error(
        "  - sessionStorage businessIdToUpdate:",
        sessionStorage.getItem("businessIdToUpdate")
      );
      console.error(
        "  - sessionStorage paymentCompleted:",
        sessionStorage.getItem("paymentCompleted")
      );
      setError("No business ID found. Please restart the process.");
      return false;
    }

    try {
      setLoading(true);
      console.log(
        "🔵 Starting business data update for ID:",
        businessIdToUpdate
      );

      // Prepare business data with social links and promo video if applicable
      const businessData = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description ?? undefined,
        category: formData.category ? (formData.category as any) : undefined,
        city: formData.city,
        state: formData.state,
        zip_code: formData.postalCode,
        country: formData.country || "USA",
        website_url: formData.website,
        phone: formData.phone,
        email: formData.email,
        image_url: formData.imageUrl,
        tags:
          Array.isArray(formData.tags) && formData.tags.length > 0
            ? (formData.tags as any)
            : [],
        is_active: true, // Now activate the business
        // Only include premium features for Enhanced and VIP plans
        ...(isPremiumPlan && {
          promo_video_url: formData.promoVideoUrl,
          social_links:
            typeof formData.socialLinks === "object" &&
            formData.socialLinks !== null &&
            "facebook" in formData.socialLinks
              ? formData.socialLinks
              : {
                  facebook: "",
                  instagram: "",
                  twitter: "",
                  linkedin: "",
                  theBlackTube: "",
                  fanbase: "",
                },
        }),
      };

      console.log("🔵 Updating business data:", businessData);

      const { error: updateError } = await supabase
        .from("businesses")
        .update(businessData)
        .eq("id", businessIdToUpdate);

      if (updateError) {
        console.error("❌ Error updating business:", updateError);
        throw updateError;
      }

      console.log("✅ Business updated successfully");

      // Clear session storage
      sessionStorage.removeItem("paymentCompleted");
      sessionStorage.removeItem("businessIdToUpdate");
      sessionStorage.removeItem("planName");
      sessionStorage.removeItem("planPrice");

      // Redirect to dashboard
      navigate("/dashboard", {
        state: {
          newBusiness: true,
          businessId: businessIdToUpdate,
          businessName: formData.name,
        },
      });

      return true;
    } catch (error) {
      console.error("❌ Error updating business:", error);
      setError("Failed to update business. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle next button click with validation
  const handleNextStep = () => {
    // Get the current step index
    const currentStepIndex = steps.indexOf(currentStep);

    // Validate the current step
    let isValid = true;

    switch (currentStep) {
      case "info":
        isValid = validateInfoStep();
        break;
      case "location":
        isValid = validateLocationStep();
        break;
      case "media":
        isValid = validateMediaStep();
        break;
      case "summary":
        // For summary step, submit the business data
        submitBusinessData();
        return; // Return early as submitBusinessData handles navigation
      // No validation for premium_features or payment steps
      default:
        isValid = true;
    }

    // Only proceed if validation passes
    if (isValid) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "info":
        return (
          <BusinessInfoStep
            formData={formData}
            setFormData={setFormData}
            error={error || ""}
            setError={setError}
            maxTagsAllowed={maxTagsAllowed}
            availableTags={availableTags}
            handleTagChange={handleTagChange}
            handleChange={handleChange}
            handleNameBlur={handleNameBlur}
          />
        );

      case "location":
        return (
          <BusinessLocationStep
            formData={formData}
            setFormData={setFormData}
            error={error || ""}
            setError={setError}
          />
        );

      case "media":
        return (
          <BusinessMediaStep
            formData={formData}
            setFormData={setFormData}
            error={error || ""}
            setError={setError}
            handleImageUpload={handleImageUpload}
            handleChange={handleChange}
            handleSocialLinkChange={handleSocialLinkChange}
          />
        );

      case "premium_features":
        return (
          <BusinessPremiumStep
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleSocialLinkChange={handleSocialLinkChange}
          />
        );

      case "summary":
        return (
          <BusinessSummaryStep
            formData={formData}
            planName={planName}
            planPrice={planPrice}
            maxTagsAllowed={maxTagsAllowed}
            BusinessTagLabels={BusinessTagLabels}
            handleSubmit={handleNextStep}
            loading={loading}
            error={error || ""}
          />
        );

      case "payment":
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Order Summary
              </h3>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Annual Subscription</span>
                <div className="text-right">
                  <span
                    className={`${
                      discountInfo?.valid
                        ? "line-through text-gray-500"
                        : "text-white"
                    }`}
                  >
                    ${planPrice}
                  </span>
                  <p className="text-sm text-gray-500">
                    (${(planPrice / 12).toFixed(2)} per month)
                  </p>
                </div>
              </div>

              {discountInfo?.valid && (
                <>
                  <div className="flex justify-between mb-4">
                    <span className="text-green-400">
                      {discountInfo.discountType === "percentage"
                        ? `Discount (${discountInfo.discountValue}%)`
                        : "Discount"}
                    </span>
                    <span className="text-green-400">
                      -${(planPrice - discountedAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white font-medium">
                        ${discountedAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Discount Code */}
            <DiscountCodeInput
              onApply={handleApplyDiscount}
              onRemove={handleRemoveDiscount}
              planName={planName}
            />

            <div>
              <button
                onClick={handlePaymentClick}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Complete Payment"}
              </button>
            </div>
          </div>
        );
    }
  };

  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStepIndex ? "bg-white" : "bg-gray-700"
                  }`}
                />
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gray-700" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white mb-8">
            {currentStep === "payment" && "Complete Payment"}
            {currentStep === "info" && "Business Information"}
            {currentStep === "location" && "Business Location"}
            {currentStep === "media" && "Media & Contact"}
            {currentStep === "premium_features" && "Premium Features"}
            {currentStep === "summary" && "Review & Submit"}
          </h1>

          {/* Error message display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(steps[currentStepIndex - 1])}
              disabled={currentStepIndex === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Previous
            </button>
            {currentStep !== "payment" && (
              <button
                onClick={handleNextStep}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
              >
                {currentStep === "summary" ? "Submit" : "Next"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {/* Payment Modal: onSuccess is always set to handlePaymentSuccess, ensuring business creation logic runs for both $0 and paid flows */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(paymentData) => {
            console.log(
              "🟢 PaymentModal onSuccess triggered with:",
              paymentData
            );
            handlePaymentSuccess(paymentData);
          }}
          amount={discountedAmount}
          description={`Annual ${planName || "Business Listing"} subscription`}
          planName={planName || "Business Listing"}
          customerEmail={formData.email}
        />

        {/* Duplicate Business Modal */}
        <DuplicateBusinessModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          onContinue={() => {
            setShowDuplicateModal(false);
            setNameCheckPerformed(true);
          }}
          businesses={similarBusinesses}
        />
      </div>
    </Layout>
  );
};

export default BusinessListingPage;
