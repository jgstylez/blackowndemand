// This is a Supabase Edge Function for updating payment methods for subscriptions

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
    transactionId: response.transactionid,
    customerVaultId: response.customer_vault_id, // Make sure this is extracted
    subscriptionId: response.subscription_id,
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

function isValidTestCard(cardNumber: string): boolean {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  const testCards = [
    "4000000000000002", // Visa success
    "4000000000000127", // Visa simulation
    "5555555555554444", // Mastercard success
    "378282246310005", // Amex success
    "4111111111111111", // Visa test
    "4222222222222222", // Visa test
    "5555555555554444", // Mastercard test
    "5105105105105100", // Mastercard test
    "378282246310005", // Amex test
    "371449635398431", // Amex test
  ];
  return testCards.includes(cleanCardNumber);
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
    console.log(
      "Request body received:",
      JSON.stringify(
        {
          ...requestBody,
          payment_method: requestBody.payment_method
            ? {
                ...requestBody.payment_method,
                card_number: requestBody.payment_method.card_number
                  ? `****${requestBody.payment_method.card_number.slice(-4)}`
                  : "Missing",
                cvv: requestBody.payment_method.cvv ? "***" : "Missing",
              }
            : "Missing",
        },
        null,
        2
      )
    );

    const { business_id, payment_method } = requestBody;

    // Validate required fields
    if (
      !business_id ||
      !payment_method ||
      !payment_method.card_number ||
      !payment_method.expiry_date ||
      !payment_method.cvv
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required payment information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the business and subscription details
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, nmi_subscription_id, nmi_customer_vault_id")
      .eq("id", business_id)
      .single();

    if (businessError) {
      console.error("Error fetching business:", businessError);
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if business has a customer vault ID (required for storing payment method)
    if (!business.nmi_customer_vault_id) {
      console.log("No customer vault found for business:", business_id);

      return new Response(
        JSON.stringify({
          error:
            "No payment method on file. Please contact support to set up your payment method.",
          code: "no_payment_method",
          details: "Customer vault not found for this business",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare the payment data for updating the customer vault
    const postData = new URLSearchParams();
    postData.append("security_key", SECURITY_KEY);
    postData.append("customer_vault_id", business.nmi_customer_vault_id);
    postData.append("customer_vault", "update_customer");
    postData.append("ccnumber", payment_method.card_number.replace(/\s/g, ""));
    postData.append("ccexp", payment_method.expiry_date);

    // CVV is optional for updates but recommended
    if (payment_method.cvv) {
      postData.append("cvv", payment_method.cvv);
    }

    // Add billing information if provided
    if (payment_method.billing_zip) {
      postData.append("zip", payment_method.billing_zip);
    }

    console.log("Sending update payment method request to gateway");

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

    // Check if the update was successful
    if (!parsedResponse.success) {
      const errorMessage = getNMIErrorMessage(
        parsedResponse.responseCode,
        parsedResponse.responseText
      );

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: parsedResponse.responseCode || "unknown_error",
          details:
            parsedResponse.responseText || "No additional details available",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract the last 4 digits of the card number for storage
    const last4 = payment_method.card_number.replace(/\s/g, "").slice(-4);

    // Update the business record with the new payment method details
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        payment_method_last_four: last4,
        updated_at: new Date().toISOString(),
      })
      .eq("id", business_id);

    if (updateError) {
      console.error(
        "Error updating business payment method details:",
        updateError
      );
    }

    // Log the payment method update in payment_history
    const { error: historyError } = await supabase
      .from("payment_history")
      .insert({
        business_id: business_id,
        nmi_transaction_id: parsedResponse.transactionId || "no_transaction_id",
        amount: 0, // No charge for updating payment method
        status: "approved",
        type: "payment_method_update",
        response_text: responseText,
      });

    if (historyError) {
      console.error(
        "Error logging payment method update history:",
        historyError
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment method updated successfully",
        last4: last4,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating payment method:", error);

    return new Response(
      JSON.stringify({
        error:
          "An unexpected error occurred while updating your payment method. Please try again or contact support.",
        details: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
