// This is a Supabase Edge Function for processing payments

import { createClient } from "npm:@supabase/supabase-js";
import { serve } from "std/server";

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Payment gateway configuration
const ECOM_LIVE_SECURITY_KEY = Deno.env.get("ECOM_LIVE_SECURITY_KEY") ?? "";
// Only use the live security key for all environments
const SECURITY_KEY = ECOM_LIVE_SECURITY_KEY;

console.log(`Security key available: ${SECURITY_KEY ? "Yes" : "No"}`);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to create a simulated successful payment response
function createSimulatedResponse(
  processAmount: number,
  currency: string,
  description: string,
  customer_email: string,
  payment_method: any,
  reason: string
) {
  console.log(`Creating simulated payment response. Reason: ${reason}`);

  // Generate a simulated transaction ID
  const transactionId = `sim_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;

  return {
    success: true,
    transaction_id: transactionId,
    amount: processAmount / 100, // Convert back from cents
    currency,
    description,
    customer_email,
    payment_date: new Date().toISOString(),
    status: "approved",
    payment_method_details: {
      type: "card",
      card: {
        brand: "visa",
        last4: payment_method.card_number?.slice(-4) || "1111",
        exp_month: payment_method.expiry_date?.split("/")[0] || "12",
        exp_year: `20${payment_method.expiry_date?.split("/")[1] || "30"}`,
      },
    },
    simulated: true,
    simulation_reason: reason,
  };
}

// Helper function to determine if we should use simulation mode
function shouldUseSimulation(cardNumber: string): boolean {
  // If no security key is available, always simulate
  if (!SECURITY_KEY || SECURITY_KEY.trim() === "") {
    console.log("No security key configured, using simulation mode");
    return true;
  }

  // In development, check if it's a known test card that should be simulated
  if (NODE_ENV === "development") {
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    const testCards = [
      "4000000000000002", // Visa success
      "5555555555554444", // Mastercard success
      "378282246310005", // Amex success
      "4000000000000127", // Visa decline (we'll simulate success for this too in dev)
    ];

    // Only simulate if it's a known test card AND we don't have proper credentials
    if (testCards.includes(cleanCardNumber) && SECURITY_KEY.length < 20) {
      console.log(
        "Test card with insufficient credentials, using simulation mode"
      );
      return true;
    }
  }

  return false;
}

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
    transactionId: response.transactionid,
    subscriptionId: response.subscription_id,
    customerVaultId: response.customer_vault_id,
    authCode: response.authcode,
  };
}

// Map NMI response codes to user-friendly messages
function getNMIErrorMessage(
  responseCode: string,
  responseText: string
): string {
  const errorMessages: Record<string, string> = {
    "200": "Transaction was declined by processor",
    "201": "Do not honor",
    "202": "Insufficient funds",
    "203": "Over limit",
    "204": "Transaction not allowed",
    "220": "Incorrect payment information",
    "221": "No such card issuer",
    "222": "No card number on file with issuer",
    "223": "Expired card",
    "224": "Invalid expiration date",
    "225": "Invalid card security code",
    "300": "Transaction was rejected by gateway",
    "400": "Transaction error returned by processor",
    "410": "Invalid merchant configuration",
    "411": "Merchant account is inactive",
    "420": "Communication error",
    "421": "Communication error with issuer",
    "430": "Duplicate transaction at processor",
    "440": "Processor format error",
    "441": "Invalid transaction information",
    "460": "Processor feature not available",
    "461": "Unsupported card type",
  };

  return (
    errorMessages[responseCode] ||
    responseText ||
    "Payment processing failed. Please try again."
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      console.log("Method not allowed:", req.method);
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const requestBody = await req.json();
    console.log(
      "Full request body received:",
      JSON.stringify(requestBody, null, 2)
    );

    const {
      token,
      amount,
      customer_email,
      planId,
      description,
      discount_code_id,
    } = requestBody;

    console.log("Received token:", token);
    console.log("Received amount:", amount);
    console.log("Received customer_email:", customer_email);
    console.log("Received planId:", planId);
    console.log("Received description:", description);
    console.log("Received discount_code_id:", discount_code_id);

    // Validate required fields - improved validation
    if (!token || !amount || !customer_email || !planId) {
      console.error("Validation failed:", {
        token_missing: !token,
        amount_missing: !amount,
        customer_email_missing: !customer_email,
        planId_missing: !planId,
      });
      return new Response(
        JSON.stringify({ error: "Missing required payment fields." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If a discount code was provided, apply it
    if (discount_code_id) {
      try {
        const { data: discountApplied, error: discountError } =
          await supabase.rpc("apply_discount_code", {
            p_code: discount_code_id,
          });

        if (discountError) {
          console.error("Error applying discount code:", discountError);
          // Continue with payment even if discount application fails
        } else {
          console.log("Discount code applied successfully:", discountApplied);
        }
      } catch (discountErr) {
        console.error("Exception applying discount code:", discountErr);
        // Continue with payment even if discount application fails
      }
    }

    // Prepare payload for NMI Payment API
    const paymentPayload = new URLSearchParams({
      security_key: SECURITY_KEY,
      amount: (amount / 100).toFixed(2), // NMI expects dollars, not cents
      payment_token: token,
      email: customer_email,
      description: description || "",
      // Add any other required fields here
    });

    // Call NMI Payment API
    const nmiRes = await fetch(
      "https://secure.transactiongateway.com/api/transact.php",
      {
        method: "POST",
        body: paymentPayload,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const nmiText = await nmiRes.text();
    // NMI returns query string format, parse it
    const nmiResult = Object.fromEntries(new URLSearchParams(nmiText));

    if (nmiResult["response"] !== "1") {
      // Payment failed
      console.error(
        "Payment failed with response code:",
        nmiResult["response"]
      );
      console.error("Response text:", nmiResult["responsetext"]);

      // Get user-friendly error message
      const errorMessage = getNMIErrorMessage(
        nmiResult["response"],
        nmiResult["responsetext"]
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          nmiResult,
        }),
        { status: 402 }
      );
    }

    // Payment succeeded, update subscription in your DB
    // Example: upsert into 'subscriptions' table
    const { error: dbError } = await supabase.from("subscriptions").upsert([
      {
        user_email: customer_email,
        plan_id: planId,
        status: "active",
        transaction_id: nmiResult["transactionid"],
        amount_paid: amount,
        discount_code_id: discount_code_id || null,
        paid_at: new Date().toISOString(),
      },
    ]);

    if (dbError) {
      console.error("Database error when updating subscription:", dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment succeeded but failed to update subscription.",
        }),
        { status: 500 }
      );
    }

    // Respond with success and transaction info
    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: nmiResult["transactionid"],
        amount: amount,
        plan_id: planId,
        nmiResult,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error processing payment:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "An unexpected error occurred while processing your payment. Please try again or contact support.",
        details: err.message || "Internal server error",
      }),
      { status: 500 }
    );
  }
});
