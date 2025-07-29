// This is a Supabase Edge Function for canceling subscriptions

import { createClient } from "npm:@supabase/supabase-js";

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Payment gateway configuration
const ECOM_LIVE_SECURITY_KEY = Deno.env.get("ECOM_LIVE_SECURITY_KEY") ?? "";
const ECOM_TEST_SECURITY_KEY = Deno.env.get("ECOM_TEST_SECURITY_KEY") ?? "";
const NODE_ENV = Deno.env.get("NODE_ENV") ?? "development";

// Select the appropriate security key based on environment
const SECURITY_KEY =
  NODE_ENV === "production" ? ECOM_LIVE_SECURITY_KEY : ECOM_TEST_SECURITY_KEY;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Parse NMI response text into an object
function parseNMIResponse(responseText: string) {
  const params = new URLSearchParams(responseText);
  const response: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    response[key] = value;
  }

  return {
    success: response.response === "1",
    responseCode: response.response_code,
    responseText: response.responsetext,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));

    const { business_id } = requestBody;

    // Add this simple test log
    console.log("About to validate business_id:", business_id);

    // Validate required fields
    if (!business_id) {
      console.log("Business ID is missing");
      return new Response(JSON.stringify({ error: "Missing business ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Business ID validation passed");

    // Get the business and subscription details
    console.log("Looking up business with ID:", business_id);

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(
        "id, nmi_subscription_id, subscription_id, subscription_status, stripe_subscription_id, plan_name"
      )
      .eq("id", business_id)
      .single();

    console.log("Business lookup result:", { business, businessError });

    if (businessError) {
      console.error("Error fetching business:", businessError);
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if business has an active subscription
    // The dashboard shows businesses with subscription_status = 'active' and plan_name
    const isActive = business.subscription_status === "active";
    const hasPlan = business.plan_name;

    console.log("Subscription check:", {
      isActive,
      hasPlan,
      subscription_id: business.subscription_id,
      nmi_subscription_id: business.nmi_subscription_id,
      stripe_subscription_id: business.stripe_subscription_id,
      subscription_status: business.subscription_status,
      plan_name: business.plan_name,
    });

    // If business has an active subscription status and a plan, allow cancellation
    if (!isActive || !hasPlan) {
      console.log("Business does not have active subscription");
      return new Response(
        JSON.stringify({
          error: "No active subscription found for this business",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If business has a subscription_id, check the subscriptions table
    if (business.subscription_id) {
      console.log(
        "Checking subscriptions table for subscription:",
        business.subscription_id
      );

      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("id, status, stripe_subscription_id")
        .eq("id", business.subscription_id)
        .single();

      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError);
        // Continue with business-level cancellation even if subscription table lookup fails
      } else {
        console.log("Subscription found:", subscription);

        // Update subscription status to cancelled
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", business.subscription_id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        }
      }
    }

    // If business has NMI subscription, cancel it via Ecom Payments
    if (business.nmi_subscription_id) {
      console.log("Cancelling NMI subscription:", business.nmi_subscription_id);

      // Prepare the data for canceling the subscription
      const postData = new URLSearchParams();
      postData.append("security_key", SECURITY_KEY);
      postData.append("subscription_id", business.nmi_subscription_id);
      postData.append("type", "delete_subscription");

      console.log("Sending cancel subscription request to Ecom Payments");

      // Make the request to the payment gateway
      const paymentResponse = await fetch(
        "https://ecompaymentprocessing.transactiongateway.com/api/transact.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: postData.toString(),
        }
      );

      // Get the response text
      const responseText = await paymentResponse.text();
      console.log("Raw payment gateway response:", responseText);

      // Parse the response
      const parsedResponse = parseNMIResponse(responseText);

      // Check if the cancellation was successful
      if (!parsedResponse.success) {
        console.error(
          "Ecom Payments cancellation failed:",
          parsedResponse.responseText
        );
        // Continue with database update even if Ecom Payments fails
      } else {
        console.log("Ecom Payments cancellation successful");
      }
    }

    // Update business subscription status to cancelled
    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({
        subscription_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", business_id);

    if (businessUpdateError) {
      console.error(
        "Error updating business subscription status:",
        businessUpdateError
      );
      return new Response(
        JSON.stringify({ error: "Failed to cancel subscription" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log the cancellation
    const { error: historyError } = await supabase
      .from("payment_history")
      .insert({
        business_id: business_id,
        nmi_transaction_id: "no_transaction_id",
        amount: 0,
        status: "approved",
        type: "subscription_cancellation",
        response_text: "Subscription cancelled via dashboard",
      });

    if (historyError) {
      console.error(
        "Error logging subscription cancellation history:",
        historyError
      );
    }

    console.log(
      "Subscription cancelled successfully for business:",
      business_id
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription cancelled successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error cancelling subscription:", error);

    return new Response(
      JSON.stringify({
        error:
          "An unexpected error occurred while cancelling your subscription. Please try again or contact support.",
        details: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
