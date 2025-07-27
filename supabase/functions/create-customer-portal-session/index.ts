import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("Customer portal session request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log("Supabase client initialized");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token extracted, length:", token.length);

    // Verify user
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) {
      console.error("User authentication error:", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      console.error("User not authenticated or email not available");
      throw new Error("User not authenticated or email not available");
    }

    console.log("User authenticated:", user.email);

    // Parse request body
    const body = await req.json();
    const { returnUrl } = body;
    console.log("Return URL:", returnUrl);

    // Check Stripe configuration
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    console.log("Stripe secret key found, length:", stripeSecretKey.length);

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Find customer by email
    console.log("Searching for Stripe customer with email:", user.email);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      console.error("No Stripe customer found for email:", user.email);
      throw new Error(
        "No Stripe customer found for this user. Please contact support."
      );
    }

    const customer = customers.data[0];
    console.log("Found Stripe customer:", customer.id);

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url:
        returnUrl ||
        `${req.headers.get("origin") || "https://your-domain.com"}/dashboard`,
    });

    console.log("Customer portal session created:", session.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in customer portal function:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: "customer_portal_error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
