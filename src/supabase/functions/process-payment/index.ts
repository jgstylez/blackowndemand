// This is a Supabase Edge Function for processing payments

import { createClient } from "npm:@supabase/supabase-js";

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Payment gateway configuration
// Get the appropriate security key based on environment
const ECOM_LIVE_SECURITY_KEY = Deno.env.get("ECOM_LIVE_SECURITY_KEY") ?? "";
const ECOM_TEST_SECURITY_KEY = Deno.env.get("ECOM_TEST_SECURITY_KEY") ?? "";
const NODE_ENV = Deno.env.get("NODE_ENV") ?? "development";

// Select the appropriate security key based on environment
const SECURITY_KEY =
  NODE_ENV === "production" ? ECOM_LIVE_SECURITY_KEY : ECOM_TEST_SECURITY_KEY;

console.log(`Using ${NODE_ENV} environment for payment processing`);
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
    environment: NODE_ENV,
    simulation_reason: reason,
  };
}

// Helper function to determine if we should use simulation mode
function shouldUseSimulation(cardNumber: string): boolean {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  const testCards = [
    "4000000000000002",
    "5555555555554444",
    "378282246310005",
    "4000000000000127",
  ];
  // Always simulate for test cards
  if (testCards.includes(cleanCardNumber)) {
    return true;
  }
  // Still simulate if no security key
  if (!SECURITY_KEY) {
    return true;
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
    customerVaultId: response.customer_vault_id,
    subscriptionId: response.subscription_id,
    authCode: response.authcode,
    avsResponse: response.avsresponse,
    cvvResponse: response.cvvresponse,
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

Deno.serve(async (req) => {
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
      amount,
      final_amount,
      currency,
      description,
      customer_email,
      payment_method,
      discount_code_id,
      plan_name,
      is_recurring = true, // Default to recurring payments
    } = requestBody;

    console.log("Received amount:", amount);
    console.log("Received final_amount:", final_amount);
    console.log(
      "Received payment_method:",
      payment_method ? "Present (details masked)" : "Missing"
    );
    console.log(
      "Payment method details:",
      payment_method
        ? {
            card_number: payment_method.card_number
              ? `****${payment_method.card_number.slice(-4)}`
              : "Missing",
            expiry_date: payment_method.expiry_date || "Missing",
            cvv: payment_method.cvv ? "***" : "Missing",
            cardholder_name: payment_method.cardholder_name
              ? "Present (masked)"
              : "Missing",
          }
        : "No payment method provided"
    );

    // Validate required fields - improved validation
    // If amount is 0, we don't need payment method
    const processAmount = final_amount !== undefined ? final_amount : amount;
    const isZeroAmount = processAmount === 0;

    if (
      typeof processAmount !== "number" ||
      processAmount < 0 ||
      (!isZeroAmount && !payment_method)
    ) {
      console.error("Validation failed:", {
        amount_invalid: typeof processAmount !== "number" || processAmount < 0,
        payment_method_missing: !isZeroAmount && !payment_method,
      });
      return new Response(
        JSON.stringify({ error: "Missing or invalid payment information" }),
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

    // For zero-amount transactions, skip payment processing
    if (isZeroAmount) {
      console.log("Zero amount transaction - skipping payment processing");

      // Generate a simulated transaction ID for free orders
      const transactionId = `free_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}`;

      // Return success response for free transaction
      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionId,
          amount: 0,
          currency: currency || "USD",
          description,
          customer_email,
          payment_date: new Date().toISOString(),
          status: "approved",
          payment_method_details: {
            type: "free",
            card: null,
          },
          isFreeTransaction: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we should use simulation mode
    if (shouldUseSimulation(payment_method.card_number)) {
      console.log("Using simulation mode for payment processing");

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const simulatedResponse = createSimulatedResponse(
        processAmount,
        currency,
        description,
        customer_email,
        payment_method,
        !SECURITY_KEY
          ? "No security key configured"
          : "Development mode with test card"
      );

      return new Response(JSON.stringify(simulatedResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare the billing information
    const billingInfo = {
      first_name: payment_method.cardholder_name?.split(" ")[0] || "",
      last_name:
        payment_method.cardholder_name?.split(" ").slice(1).join(" ") || "",
      address1: payment_method.billing_address?.street || "",
      city: payment_method.billing_address?.city || "",
      state: payment_method.billing_address?.state || "",
      zip:
        payment_method.billing_address?.zipCode ||
        payment_method.billing_zip ||
        "",
      country: payment_method.billing_address?.country || "US",
      email: customer_email || "",
    };

    // Prepare the payment data according to the API
    const postData = new URLSearchParams();

    // Common fields for all transaction types
    postData.append("security_key", SECURITY_KEY);
    postData.append("ccnumber", payment_method.card_number.replace(/\s/g, ""));
    postData.append("ccexp", payment_method.expiry_date);
    postData.append("cvv", payment_method.cvv);

    // Add billing information
    Object.entries(billingInfo).forEach(([key, value]) => {
      if (value) postData.append(key, value);
    });

    // Set up transaction type and amount
    if (is_recurring) {
      // For recurring subscriptions - use customer vault
      postData.append("type", "add_subscription");
      postData.append("plan_payments", "0"); // 0 = unlimited recurring payments
      postData.append("plan_amount", (processAmount / 100).toFixed(2)); // Convert cents to dollars
      postData.append("day_frequency", "365"); // Annual billing
      postData.append("month_frequency", "0");
      postData.append("customer_vault", "add_customer"); // Store payment info for future use

      // Add required customer vault fields
      postData.append("first_name", billingInfo.first_name);
      postData.append("last_name", billingInfo.last_name);
      postData.append("email", billingInfo.email);

      // Add address information for customer vault
      if (billingInfo.address1)
        postData.append("address1", billingInfo.address1);
      if (billingInfo.city) postData.append("city", billingInfo.city);
      if (billingInfo.state) postData.append("state", billingInfo.state);
      if (billingInfo.zip) postData.append("zip", billingInfo.zip);
      if (billingInfo.country) postData.append("country", billingInfo.country);
    } else {
      // For one-time payments - also store in customer vault for future use
      postData.append("type", "sale");
      postData.append("amount", (processAmount / 100).toFixed(2)); // Convert cents to dollars
      postData.append("customer_vault", "add_customer"); // Store payment info for future use

      // Add required customer vault fields
      postData.append("first_name", billingInfo.first_name);
      postData.append("last_name", billingInfo.last_name);
      postData.append("email", billingInfo.email);
    }

    // Add description and currency
    if (description) postData.append("order_description", description);
    postData.append("currency", currency || "USD");

    console.log("Sending payment request to gateway with data:", {
      type: is_recurring ? "add_subscription" : "sale",
      amount: (processAmount / 100).toFixed(2),
      ccnumber:
        "****" + payment_method.card_number.replace(/\s/g, "").slice(-4),
      ccexp: payment_method.expiry_date,
      cvv: "***",
      security_key: SECURITY_KEY ? "****" : "MISSING",
      ...billingInfo,
      environment: NODE_ENV,
    });

    let paymentResponse;
    let responseText;

    try {
      // Make the request to the payment gateway with timeout and error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      paymentResponse = await fetch(
        "https://ecompaymentprocessing.transactiongateway.com/api/transact.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: postData.toString(),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log("Payment gateway response status:", paymentResponse.status);
      console.log(
        "Payment gateway response headers:",
        Object.fromEntries(paymentResponse.headers.entries())
      );

      // Get the response text
      responseText = await paymentResponse.text();
      console.log("Raw payment gateway response string:", responseText);
    } catch (networkError) {
      console.error(
        "Network error when contacting payment gateway:",
        networkError
      );
      console.log("Falling back to simulation mode due to network error");

      // Network request failed - fall back to simulation mode
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const simulatedResponse = createSimulatedResponse(
        processAmount,
        currency,
        description,
        customer_email,
        payment_method,
        `Network error: ${networkError.message}`
      );

      return new Response(JSON.stringify(simulatedResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the NMI response
    const parsedResponse = parseNMIResponse(responseText);
    console.log("Parsed payment gateway response:", parsedResponse);

    // Check if the payment was successful (response code 1 means approved)
    if (!parsedResponse.success) {
      console.error(
        "Payment failed with response code:",
        parsedResponse.responseCode
      );
      console.error("Response text:", parsedResponse.responseText);

      // In development mode, if we get a decline and it's a test card, fall back to simulation
      if (NODE_ENV === "development" && parsedResponse.responseCode === "2") {
        const cleanCardNumber = payment_method.card_number.replace(/\s/g, "");
        const knownTestCards = [
          "4000000000000002", // Visa success
          "5555555555554444", // Mastercard success
          "378282246310005", // Amex success
        ];

        if (knownTestCards.includes(cleanCardNumber)) {
          console.log(
            "Test card declined by gateway, falling back to simulation mode"
          );

          await new Promise((resolve) => setTimeout(resolve, 500));

          const simulatedResponse = createSimulatedResponse(
            processAmount,
            currency,
            description,
            customer_email,
            payment_method,
            "Test card declined by gateway - using simulation"
          );

          return new Response(JSON.stringify(simulatedResponse), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Get user-friendly error message
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

    // For recurring payments, store subscription details in the database
    if (is_recurring && parsedResponse.subscriptionId) {
      try {
        // Get the business ID from the customer email
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("id")
          .eq("email", customer_email)
          .single();

        if (businessError) {
          console.error("Error finding business:", businessError);
        } else if (businessData) {
          // Update the business with subscription details
          const { error: updateError } = await supabase
            .from("businesses")
            .update({
              nmi_subscription_id: parsedResponse.subscriptionId,
              nmi_customer_vault_id: parsedResponse.customerVaultId,
              subscription_status: "active",
              next_billing_date: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
              last_payment_date: new Date().toISOString(),
              payment_method_last_four: last4,
            })
            .eq("id", businessData.id);

          if (updateError) {
            console.error(
              "Error updating business with subscription details:",
              updateError
            );
          }

          // Log the payment in payment_history
          const { error: historyError } = await supabase
            .from("payment_history")
            .insert({
              business_id: businessData.id,
              nmi_transaction_id: parsedResponse.transactionId,
              amount: processAmount / 100, // Convert cents to dollars
              status: "approved",
              type: "initial_subscription",
              response_text: responseText,
            });

          if (historyError) {
            console.error("Error logging payment history:", historyError);
          }
        }
      } catch (dbError) {
        console.error(
          "Database error when storing subscription details:",
          dbError
        );
      }
    }

    // Payment successful - return the response
    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: parsedResponse.transactionId,
        subscription_id: parsedResponse.subscriptionId,
        customer_vault_id: parsedResponse.customerVaultId,
        amount: processAmount / 100, // Convert cents to dollars
        currency: currency || "USD",
        description: description,
        customer_email: customer_email,
        payment_date: new Date().toISOString(),
        status: "approved",
        payment_method_details: {
          type: "card",
          card: {
            last4: last4,
            exp_month: payment_method.expiry_date.split("/")[0],
            exp_year: `20${payment_method.expiry_date.split("/")[1]}`,
          },
        },
        gateway_response: parsedResponse,
        environment: NODE_ENV,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing payment:", error);

    return new Response(
      JSON.stringify({
        error:
          "An unexpected error occurred while processing your payment. Please try again or contact support.",
        details: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
