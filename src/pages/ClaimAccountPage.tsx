import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Building2, Search, Crown } from "lucide-react";
import Layout from "../components/layout/Layout";
import { supabase, getBusinessImageUrl } from "../lib/supabase";

interface MigratedBusiness {
  id: string;
  name: string;
  description: string;
  email: string;
  image_url: string;
  migration_source: string;
  claimed_at: string | null;
}

const ClaimAccountPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get("business");

  const [step, setStep] = useState<"search" | "verify" | "create">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MigratedBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] =
    useState<MigratedBusiness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migratedPlanId, setMigratedPlanId] = useState<string | null>(null);

  const [accountData, setAccountData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessEmail: "",
    subscribeToNewsletter: true,
  });

  // Fetch the Migrated plan ID when component mounts
  useEffect(() => {
    const fetchMigratedPlan = async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("id")
          .eq("name", "Migrated")
          .single();

        if (error) {
          console.error("Error fetching Migrated plan:", error);
          return;
        }

        if (data) {
          setMigratedPlanId(data.id);
          console.log("Migrated plan ID found:", data.id);
        }
      } catch (err) {
        console.error("Failed to fetch Migrated plan:", err);
      }
    };

    fetchMigratedPlan();
  }, []);

  // If business ID is provided in URL, try to load that business
  useEffect(() => {
    if (businessId) {
      loadBusinessById(businessId);
    }
  }, [businessId]);

  const loadBusinessById = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .not("migration_source", "is", null)
        .is("claimed_at", null)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedBusiness(data);
        setAccountData((prev) => ({
          ...prev,
          businessEmail: data.email || "",
        }));
        setStep("verify");
      }
    } catch (err) {
      setError("Business not found or already claimed");
    } finally {
      setLoading(false);
    }
  };

  const searchBusinesses = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .not("migration_source", "is", null)
        .is("claimed_at", null)
        .or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
        .limit(10);

      if (error) throw error;

      // Transform the data to match MigratedBusiness interface
      const migratedBusinesses: MigratedBusiness[] = (data || []).map(
        (business) => ({
          id: business.id,
          name: business.name,
          description: business.description || "",
          email: business.email || "",
          image_url: business.image_url || "",
          migration_source: business.migration_source || "",
          claimed_at: business.claimed_at || null,
        })
      );

      setSearchResults(migratedBusinesses);
    } catch (err) {
      setError("Error searching businesses");
    } finally {
      setLoading(false);
    }
  };

  const selectBusiness = (business: MigratedBusiness) => {
    setSelectedBusiness(business);
    setAccountData((prev) => ({
      ...prev,
      businessEmail: business.email || "",
    }));
    setStep("verify");
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAccountData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const subscribeToEmailList = async (userEmail: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: userEmail }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        console.warn("Newsletter subscription failed:", data.error);
        // Don't throw error - newsletter subscription failure shouldn't block account creation
      }
    } catch (error) {
      console.warn("Newsletter subscription error:", error);
      // Don't throw error - newsletter subscription failure shouldn't block account creation
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    setError(null);

    // Validate passwords match
    if (accountData.password !== accountData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate business email matches (if provided)
    if (
      selectedBusiness.email &&
      accountData.businessEmail !== selectedBusiness.email
    ) {
      setError("Business email does not match our records");
      return;
    }

    // Check if we have the Migrated plan ID
    if (!migratedPlanId) {
      setError("Unable to process claim. Please try again.");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
      });

      if (authError) {
        // Check if user already exists
        if (
          authError.message.includes("User already registered") ||
          authError.message.includes("user_already_exists")
        ) {
          setError(
            "An account with this email already exists. Please sign in instead or use a different email address."
          );
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // Subscribe to newsletter if user opted in
        if (accountData.subscribeToNewsletter) {
          await subscribeToEmailList(accountData.email);
        }

        // First, claim the business (this will set the owner_id)
        const { error: claimError } = await supabase.rpc("claim_business", {
          business_id: selectedBusiness.id,
          user_id: authData.user.id,
          new_subscription_id: null, // We'll create this after claiming
        });

        if (claimError) {
          console.error("Business claim error:", claimError);
          throw claimError;
        }

        // Now create a subscription for the Migrated plan (user now owns the business)
        const { data: subscriptionData, error: subscriptionError } =
          await supabase
            .from("subscriptions")
            .insert({
              business_id: selectedBusiness.id,
              plan_id: migratedPlanId,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ).toISOString(), // 1 year from now
              payment_status: "paid",
            })
            .select("id")
            .single();

        if (subscriptionError) {
          console.error("Subscription creation error:", subscriptionError);
          throw subscriptionError;
        }

        // Update the business with the subscription ID
        const { error: updateError } = await supabase
          .from("businesses")
          .update({
            subscription_id: subscriptionData.id,
            subscription_status: "active",
          })
          .eq("id", selectedBusiness.id);

        if (updateError) {
          console.error("Business update error:", updateError);
          throw updateError;
        }

        // Redirect to dashboard
        navigate("/dashboard?claimed=true");
      }
    } catch (err) {
      console.error("Account creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const renderSearchStep = () => (
    <div className="max-w-2xl w-full space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crown className="h-8 w-8 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white">Claim Your Business</h2>
        </div>
        <p className="text-gray-400">
          Search for your business in our directory to claim ownership and
          create your account.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Search for your business
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchBusinesses()}
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="Enter business name, email, or description"
            />
          </div>
        </div>

        <button
          onClick={searchBusinesses}
          disabled={loading || !searchTerm.trim()}
          className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Searching..." : "Search Businesses"}
        </button>

        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Search Results</h3>
            {searchResults.map((business) => (
              <div
                key={business.id}
                onClick={() => selectBusiness(business)}
                className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getBusinessImageUrl(business.image_url)}
                      alt={business.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">
                        {business.name}
                      </h4>
                      <Crown className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      {business.description}
                    </p>
                    {business.email && (
                      <p className="text-gray-500 text-xs">{business.email}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-gray-400 text-sm">
          Don't see your business?{" "}
          <Link to="/contact" className="text-white hover:text-gray-300">
            Contact us for help
          </Link>
        </p>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          Verify Business Ownership
        </h2>
        <p className="mt-2 text-gray-400">
          Confirm this is your business to proceed with account creation.
        </p>
      </div>

      {selectedBusiness && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={getBusinessImageUrl(selectedBusiness.image_url)}
                alt={selectedBusiness.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                }}
              />
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">
                  {selectedBusiness.name}
                </h3>
                <Crown className="h-5 w-5 text-yellow-400" />
              </div>
              <p className="text-gray-400 text-sm">
                {selectedBusiness.description}
              </p>
            </div>
          </div>

          {selectedBusiness.email && (
            <div>
              <label
                htmlFor="businessEmail"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Verify business email
              </label>
              <input
                id="businessEmail"
                name="businessEmail"
                type="email"
                value={accountData.businessEmail}
                onChange={handleAccountChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Enter your business email"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This should match the email associated with your business
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setStep("search")}
          className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Search
        </button>
        <button
          onClick={() => setStep("create")}
          className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderCreateStep = () => (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
        <p className="mt-2 text-gray-400">
          Set up your account to manage your business listing.
        </p>
      </div>

      <form onSubmit={handleCreateAccount} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Your Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={accountData.email}
              onChange={handleAccountChange}
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={accountData.password}
              onChange={handleAccountChange}
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="Create a strong password"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={accountData.confirmPassword}
              onChange={handleAccountChange}
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>
        </div>

        {/* Newsletter subscription checkbox */}
        <div className="flex items-center">
          <input
            id="subscribeToNewsletter"
            name="subscribeToNewsletter"
            type="checkbox"
            checked={accountData.subscribeToNewsletter}
            onChange={handleAccountChange}
            className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-white focus:ring-white focus:ring-offset-gray-900"
          />
          <label
            htmlFor="subscribeToNewsletter"
            className="ml-2 block text-sm text-gray-400"
          >
            Subscribe to our newsletter for updates on Black businesses and
            community news
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep("verify")}
            className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Creating Account..." : "Claim Business"}
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-400 text-center">
        By creating an account, you agree to our{" "}
        <a
          href="https://www.blackdollarnetwork.com/terms-of-use"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-white"
        >
          Terms of Use
        </a>
        {" and "}
        <a
          href="https://www.blackdollarnetwork.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-white"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="fixed top-4 right-4 bg-red-500/10 text-red-500 p-4 rounded-lg text-sm max-w-md z-50">
            {error}
            {error.includes("already exists") && (
              <div className="mt-2">
                <Link
                  to="/login"
                  className="text-red-400 hover:text-red-300 underline"
                >
                  Sign in instead
                </Link>
              </div>
            )}
          </div>
        )}

        {step === "search" && renderSearchStep()}
        {step === "verify" && renderVerifyStep()}
        {step === "create" && renderCreateStep()}

        <div className="absolute bottom-8 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-white hover:text-gray-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ClaimAccountPage;
