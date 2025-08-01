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

  const parsedResponse = {
    success: response.response === "1",
    responseCode: response.response_code,
    responseText: response.responsetext,
    transactionId: response.transactionid,
    customerVaultId: response.customer_vault_id, // Make sure this is extracted
    subscriptionId: response.subscription_id,
  };

  // ENHANCED LOGGING: Log NMI response for payment method update
  console.log("🔍 NMI Payment Method Update Response Analysis:", {
    rawResponse: responseText,
    parsedFields: {
      response: response.response,
      response_code: response.response_code,
      responsetext: response.responsetext,
      transactionid: response.transactionid,
      customer_vault_id: response.customer_vault_id,
      subscription_id: response.subscription_id,
    },
    extractedData: {
      success: parsedResponse.success,
      transactionId: parsedResponse.transactionId,
      customerVaultId: parsedResponse.customerVaultId,
      subscriptionId: parsedResponse.subscriptionId,
    },
  });

  return parsedResponse;
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

// Standardized test cards - keep in sync with frontend
const TEST_CARDS = [
  "4000000000000002", // Visa success
  "5555555555554444", // Mastercard success
  "378282246310005", // Amex success
  "4000000000000127", // Visa simulation
  "4111111111111111", // Visa test
  "4222222222222222", // Visa test
  "5105105105105100", // Mastercard test
  "371449635398431", // Amex test
];

function isValidTestCard(cardNumber: string): boolean {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  return TEST_CARDS.includes(cleanCardNumber);
}

async function createCustomerVault(
  business: any,
  payment_method: any,
  userEmail: string
) {
  console.log("🔄 Creating customer vault for business:", {
    businessId: business.id,
    businessName: business.name,
    userEmail: userEmail || "Not provided",
  });

  const cleanCardNumber = payment_method.card_number.replace(/\s/g, "");
  console.log(" Card details:", {
    last4: cleanCardNumber.slice(-4),
    isTestCard: isValidTestCard(cleanCardNumber),
    expiryDate: payment_method.expiry_date,
    cardholderName: payment_method.cardholder_name ? "Present" : "Missing",
    billingZip: payment_method.billing_zip ? "Present" : "Missing",
  });

  // Add validation for test cards
  if (!isValidTestCard(cleanCardNumber)) {
    console.error("❌ Invalid test card number:", cleanCardNumber.slice(-4));
    return {
      success: false,
      error: "Invalid test card. Please use a valid test card number.",
      details:
        "For testing, use: 4000000000000002 (Visa), 5555555555554444 (Mastercard), or 378282246310005 (Amex)",
    };
  }

  const postData = new URLSearchParams();
  postData.append("security_key", SECURITY_KEY);
  postData.append("type", "sale");
  postData.append("amount", "0.01"); // Small charge to create vault
  postData.append("ccnumber", payment_method.card_number.replace(/\s/g, ""));
  postData.append("ccexp", payment_method.expiry_date);
  postData.append("cvv", payment_method.cvv);
  postData.append("customer_vault", "add_customer");
  postData.append("currency", "USD");
  postData.append(
    "order_description",
    `Customer vault creation for ${business.name}`
  );

  // Add billing information
  if (payment_method.cardholder_name) {
    const nameParts = payment_method.cardholder_name.split(" ");
    postData.append("first_name", nameParts[0] || "");
    postData.append("last_name", nameParts.slice(1).join(" ") || "");
  }
  if (payment_method.billing_zip) {
    postData.append("zip", payment_method.billing_zip);
  }
  if (userEmail) {
    postData.append("email", userEmail);
  }

  console.log("📤 Sending customer vault creation request to Ecom Payments:", {
    type: "sale",
    amount: "0.01",
    customer_vault: "add_customer",
    currency: "USD",
    order_description: `Customer vault creation for ${business.name}`,
    hasFirstName: !!payment_method.cardholder_name,
    hasLastName: !!payment_method.cardholder_name,
    hasZip: !!payment_method.billing_zip,
    hasEmail: !!userEmail,
    securityKeyConfigured: !!SECURITY_KEY,
    environment: NODE_ENV,
  });

  try {
    const paymentResponse = await fetch(
      "https://ecompaymentprocessing.transactiongateway.com/api/transact.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postData.toString(),
      }
    );

    console.log("📥 Payment gateway response status:", paymentResponse.status);

    const responseText = await paymentResponse.text();
    console.log("📄 Raw response from Ecom Payments:", responseText);

    const parsedResponse = parseNMIResponse(responseText);
    console.log("🔍 Parsed payment response:", {
      success: parsedResponse.success,
      responseCode: parsedResponse.responseCode,
      responseText: parsedResponse.responseText,
      customerVaultId: parsedResponse.customerVaultId,
      transactionId: parsedResponse.transactionId,
    });

    if (!parsedResponse.success) {
      console.error("❌ Payment gateway error:", {
        responseCode: parsedResponse.responseCode,
        responseText: parsedResponse.responseText,
        success: parsedResponse.success,
      });
      return {
        success: false,
        error: parsedResponse.responseText || "Payment gateway error",
        responseCode: parsedResponse.responseCode,
      };
    }

    console.log("✅ Customer vault created successfully:", {
      customerVaultId: parsedResponse.customerVaultId,
      transactionId: parsedResponse.transactionId,
      businessId: business.id,
      businessName: business.name,
    });

    return {
      success: true,
      customer_vault_id: parsedResponse.customerVaultId,
      transaction_id: parsedResponse.transactionId,
    };
  } catch (error) {
    console.error("💥 Error making payment gateway request:", error);
    return {
      success: false,
      error: error.message || "Network error",
    };
  }
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

    // Update the query to get nmi fields from subscriptions table
    const { data: business } = await supabase
      .from("businesses")
      .select(
        `
        id, 
        owner_id,
        subscription_id,
        subscriptions!inner(
          id,
          nmi_subscription_id,
          nmi_customer_vault_id
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

    // Get the user's email from auth.users table
    let userEmail = "";
    if (business.owner_id) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(business.owner_id);
      if (userError) {
        console.error("Error fetching user:", userError);
      } else if (userData?.user?.email) {
        userEmail = userData.user.email;
      }
    }

    // In the main function, add logging for customer vault ID updates
    console.log("🔍 Checking for existing customer vault ID:", {
      businessId: business_id,
      hasSubscription: !!business.subscription_id,
      customerVaultId:
        business.subscriptions?.nmi_customer_vault_id || "Not found",
      subscriptionId:
        business.subscriptions?.nmi_subscription_id || "Not found",
    });

    // Check if business has a customer vault ID (required for storing payment method)
    if (!business.subscriptions?.nmi_customer_vault_id) {
      console.log(
        "🆕 No customer vault found, creating one for business:",
        business_id
      );

      // Create customer vault first
      const vaultResult = await createCustomerVault(
        business,
        payment_method,
        userEmail
      );
      console.log("🏗️ Customer vault creation result:", vaultResult);

      if (!vaultResult.success) {
        console.error("❌ Failed to create customer vault:", vaultResult.error);
        return new Response(
          JSON.stringify({
            error: vaultResult.error || "Failed to create customer vault",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(
        "✅ Customer vault created successfully, updating subscription record:",
        {
          subscriptionId: business.subscription_id,
          customerVaultId: vaultResult.customer_vault_id,
        }
      );

      // Update the subscription record with the new customer vault ID
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          nmi_customer_vault_id: vaultResult.customer_vault_id,
        })
        .eq("id", business.subscription_id);

      if (updateError) {
        console.error(
          "❌ Error updating subscription with customer vault ID:",
          updateError
        );
        return new Response(
          JSON.stringify({ error: "Failed to update subscription record" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Subscription updated with customer vault ID:", {
        subscriptionId: business.subscription_id,
        customerVaultId: vaultResult.customer_vault_id,
      });

      // Update the business object for the rest of the function
      business.subscriptions.nmi_customer_vault_id =
        vaultResult.customer_vault_id;
    } else {
      console.log("✅ Existing customer vault found:", {
        customerVaultId: business.subscriptions.nmi_customer_vault_id,
        businessId: business_id,
      });
    }

    // Prepare the payment data for updating the customer vault
    const postData = new URLSearchParams();
    postData.append("security_key", SECURITY_KEY);
    postData.append(
      "customer_vault_id",
      business.subscriptions.nmi_customer_vault_id
    );
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

    // ENHANCED LOGGING: Log payment method update result
    console.log("🔍 Payment method update result:", {
      success: parsedResponse.success,
      responseCode: parsedResponse.responseCode,
      responseText: parsedResponse.responseText,
      transactionId: parsedResponse.transactionId,
      customerVaultId: parsedResponse.customerVaultId,
      subscriptionId: parsedResponse.subscriptionId,
      hasCustomerVaultId: !!parsedResponse.customerVaultId,
      hasSubscriptionId: !!parsedResponse.subscriptionId,
    });

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
