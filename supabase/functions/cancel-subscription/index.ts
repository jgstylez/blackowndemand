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

  const parsedResponse = {
    success: response.response === "1",
    responseCode: response.response_code,
    responseText: response.responsetext,
  };

  // ENHANCED LOGGING: Log NMI response for subscription cancellation
  console.log("🔍 NMI Subscription Cancellation Response Analysis:", {
    rawResponse: responseText,
    parsedFields: {
      response: response.response,
      response_code: response.response_code,
      responsetext: response.responsetext,
    },
    extractedData: {
      success: parsedResponse.success,
      responseCode: parsedResponse.responseCode,
      responseText: parsedResponse.responseText,
    },
  });

  return parsedResponse;
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

    // Validate required fields
    if (!business_id) {
      return new Response(JSON.stringify({ error: "Missing business ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the business and subscription details
    const { data: business } = await supabase
      .from("businesses")
      .select(
        `
        id, 
        subscription_id,
        subscription_status,
        plan_name,
        subscriptions!inner(
          id,
          nmi_subscription_id,
          nmi_customer_vault_id,
          stripe_subscription_id
        )
      `
      )
      .eq("id", business_id)
      .single();

    if (!business) {
      console.error("Error fetching business:", businessError);
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ENHANCED LOGGING: Log subscription details for cancellation
    console.log("🔍 Subscription details for cancellation:", {
      businessId: business_id,
      businessName: business.name,
      subscriptionId: business.subscription_id,
      subscriptionStatus: business.subscription_status,
      planName: business.plan_name,
      nmiSubscriptionId:
        business.subscriptions?.nmi_subscription_id || "Not found",
      nmiCustomerVaultId:
        business.subscriptions?.nmi_customer_vault_id || "Not found",
      hasNmiSubscription: !!business.subscriptions?.nmi_subscription_id,
      hasNmiCustomerVault: !!business.subscriptions?.nmi_customer_vault_id,
    });

    if (!business.subscriptions?.nmi_subscription_id) {
      console.warn("⚠️ No NMI subscription ID found for cancellation");
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

    // Prepare the data for canceling the subscription
    const postData = new URLSearchParams();
    postData.append("security_key", SECURITY_KEY);
    postData.append(
      "subscription_id",
      business.subscriptions.nmi_subscription_id
    );
    postData.append("type", "delete_subscription");

    console.log("📤 Sending cancel subscription request to gateway:", {
      subscriptionId: business.subscriptions.nmi_subscription_id,
      type: "delete_subscription",
      hasSecurityKey: !!SECURITY_KEY,
      environment: NODE_ENV,
    });

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

    // ENHANCED LOGGING: Log subscription cancellation result
    console.log("🔍 Subscription cancellation result:", {
      success: parsedResponse.success,
      responseCode: parsedResponse.responseCode,
      responseText: parsedResponse.responseText,
      cancelledSubscriptionId: business.subscriptions.nmi_subscription_id,
      hasCustomerVaultId: !!business.subscriptions.nmi_customer_vault_id,
    });

    // Check if the cancellation was successful
    if (!parsedResponse.success) {
      return new Response(
        JSON.stringify({
          error: parsedResponse.responseText || "Failed to cancel subscription",
          code: parsedResponse.responseCode || "unknown_error",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update the business record to reflect the cancellation
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        subscription_status: "pending", // Or keep the current plan name
        updated_at: new Date().toISOString(),
      })
      .eq("id", business_id);

    if (updateError) {
      console.error(
        "Error updating business subscription status:",
        updateError
      );
    }

    // Log the cancellation in payment_history
    const { error: historyError } = await supabase
      .from("payment_history")
      .insert({
        business_id: business_id,
        nmi_transaction_id: "no_transaction_id", // Cancellations don't generate transaction IDs
        amount: 0, // No charge for cancellation
        status: "approved",
        type: "subscription_cancellation",
        response_text: responseText,
      });

    if (historyError) {
      console.error(
        "Error logging subscription cancellation history:",
        historyError
      );
    }

    // Return success response
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
