
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating Stripe checkout session...");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Parse request body
    const { 
      planPrice, 
      planName, 
      successUrl, 
      cancelUrl, 
      discountCode, 
      discountedAmount 
    } = await req.json();
    
    console.log("Request data:", { 
      planPrice, 
      planName, 
      successUrl, 
      cancelUrl, 
      userEmail: user.email,
      discountCode,
      discountedAmount
    });

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    }

    // For Stripe native discount codes, we ignore the pre-calculated discount amount
    // and let Stripe handle discount validation and application natively
    const sessionData: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${planName}`,
              description: `Annual subscription to ${planName} - renews automatically every 365 days`,
              metadata: {
                plan_name: planName,
                original_price: planPrice.toString(),
              }
            },
            unit_amount: Math.round(planPrice * 100), // Use original price for Stripe
            recurring: {
              interval: "year", // Annual billing
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription", // Subscription mode
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan_name: planName,
        user_id: user.id,
        original_price: planPrice.toString(),
      },
      subscription_data: {
        metadata: {
          plan_name: planName,
          user_id: user.id,
        },
      },
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      // ENABLE NATIVE STRIPE DISCOUNT CODES
      allow_promotion_codes: true,
    };

    // Add nonrefundable notice to checkout
    sessionData.custom_text = {
      submit: {
        message: "⚠️ All payments are nonrefundable. Your subscription will renew automatically every 365 days.",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("Checkout session created successfully:", session.id);
    console.log("Native discount codes enabled - users can enter codes at Stripe checkout");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: "checkout_session_error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
