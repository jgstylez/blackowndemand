export const validateEnvironmentVariables = () => {
  const requiredVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:", missingVars);
    console.error("Please create a .env file with the required variables.");
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  console.log("✅ All required environment variables are set");
};
