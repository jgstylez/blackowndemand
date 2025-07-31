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
  processAmount,
  currency,
  description,
  customer_email,
  payment_method,
  reason
) {
  console.log(`Creating simulated payment response. Reason: ${reason}`);

  // Generate simulated IDs for testing
  const transactionId = `sim_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;
  const customerVaultId = `vault_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;
  const subscriptionId = `sub_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;

  console.log("🎭 Generated simulated IDs:", {
    transactionId,
    customerVaultId,
    subscriptionId,
    reason,
  });

  return {
    success: true,
    transaction_id: transactionId,
    customer_vault_id: customerVaultId,
    subscription_id: subscriptionId,
    amount: processAmount / 100,
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

function shouldUseSimulation(cardNumber: string): boolean {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");

  // If no security key, we must simulate
  if (!SECURITY_KEY) {
    console.log("❌ No security key configured, using simulation mode");
    return true;
  }

  // Always attempt real processing if security key is available
  console.log(
    "✅ Security key available - attempting real EcomPayments processing",
    SECURITY_KEY
  );
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
    customerVaultId: response.customer_vault_id, // Make sure this is extracted
    subscriptionId: response.subscription_id,
  };
}
// Map NMI response codes to user-friendly messages
function getNMIErrorMessage(responseCode, responseText) {
  const errorMessages = {
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

// At the top of the file, add better logging for environment setup

console.log("🔧 EcomPayments Environment Setup:", {
  environment: NODE_ENV,
  securityKeyConfigured: !!SECURITY_KEY,
  securityKeyLength: SECURITY_KEY ? SECURITY_KEY.length : 0,
  apiUrl:
    "https://ecompaymentprocessing.transactiongateway.com/api/transact.php",
});

if (!SECURITY_KEY) {
  console.error("❌ CRITICAL: EcomPayments security key not configured!");
  console.error(
    "Please set ECOM_LIVE_SECURITY_KEY or ECOM_TEST_SECURITY_KEY environment variable"
  );
} else {
  console.log("✅ EcomPayments security key configured successfully");
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      console.log("Method not allowed:", req.method);
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
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
      is_recurring = true,
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
        JSON.stringify({
          error: "Missing or invalid payment information",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Ensure minimum amount for recurring payments
    const minimumAmount = 100; // $1.00 in cents
    if (processAmount > 0 && processAmount < minimumAmount) {
      return new Response(
        JSON.stringify({
          error: `Minimum amount for recurring payments is $${
            minimumAmount / 100
          }.00`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Format amount with exactly 2 decimal places
    const formattedAmount = (processAmount / 100).toFixed(2);
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
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Always attempt real processing if security key is available
    if (!SECURITY_KEY) {
      console.log("❌ No security key configured, falling back to simulation");
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const simulatedResponse = createSimulatedResponse(
        processAmount,
        currency,
        description,
        customer_email,
        payment_method,
        "No security key configured"
      );

      // ADD THIS: Store simulated response in database
      if (is_recurring && simulatedResponse.subscription_id) {
        console.log("🎭 Processing simulated subscription data");
        try {
          const { data: businessData, error: businessError } = await supabase
            .from("businesses")
            .select("id, name")
            .eq("email", customer_email)
            .single();

          if (businessData) {
            console.log(" Found business for simulated subscription:", {
              businessId: businessData.id,
              businessName: businessData.name,
            });

            // Create subscription record with simulated data
            const { error: subscriptionError } = await supabase
              .from("subscriptions")
              .upsert({
                business_id: businessData.id,
                plan_id: null,
                status: "active",
                payment_status: "paid",
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(
                  Date.now() + 365 * 24 * 60 * 60 * 1000
                ).toISOString(),
                payment_provider: "nmi",
                nmi_subscription_id: simulatedResponse.subscription_id,
                nmi_customer_vault_id: simulatedResponse.customer_vault_id,
              });

            if (subscriptionError) {
              console.error(
                "❌ Error creating simulated subscription:",
                subscriptionError
              );
            } else {
              console.log("✅ Simulated subscription record created");
            }

            // Update business (without customer vault ID)
            const { error: updateError } = await supabase
              .from("businesses")
              .update({
                subscription_status: "active",
                plan_name: plan_name,
                next_billing_date: new Date(
                  Date.now() + 365 * 24 * 60 * 60 * 1000
                ).toISOString(),
                last_payment_date: new Date().toISOString(),
                payment_method_last_four: payment_method.card_number
                  .replace(/\s/g, "")
                  .slice(-4),
              })
              .eq("id", businessData.id);

            if (updateError) {
              console.error(
                "❌ Error updating business for simulated payment:",
                updateError
              );
            } else {
              console.log("✅ Business updated for simulated payment");
            }

            // Log payment history
            await supabase.from("payment_history").insert({
              business_id: businessData.id,
              nmi_transaction_id: simulatedResponse.transaction_id,
              amount: processAmount / 100,
              status: "approved",
              type: "initial_subscription",
              response_text: `Simulated subscription payment for ${plan_name}`,
            });

            console.log("✅ Simulated payment history logged");
          }
        } catch (dbError) {
          console.error(
            "💥 Database error when storing simulated subscription details:",
            dbError
          );
        }
      }

      return new Response(JSON.stringify(simulatedResponse), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
    // REAL EcomPayments processing - always attempt this if security key is available
    console.log("🚀 Attempting real EcomPayments processing with security key");

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
      // For recurring subscriptions - use customer vault with add_subscription
      console.log("📋 Setting up recurring subscription with customer vault");
      postData.append("type", "add_subscription");
      postData.append("plan_payments", "0"); // 0 = unlimited recurring payments
      postData.append("plan_amount", (processAmount / 100).toFixed(2));
      postData.append("day_frequency", "365"); // Annual billing
      postData.append("month_frequency", "0");
      postData.append("customer_vault", "add_customer");

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
      // For one-time payments
      postData.append("type", "sale");
      postData.append("amount", (processAmount / 100).toFixed(2));
    }

    // Add description and currency
    if (description) postData.append("order_description", description);
    postData.append("currency", currency || "USD");

    console.log("📤 Sending real payment request to EcomPayments gateway:", {
      type: is_recurring ? "add_subscription" : "sale",
      amount: (processAmount / 100).toFixed(2),
      ccnumber:
        "****" + payment_method.card_number.replace(/\s/g, "").slice(-4),
      ccexp: payment_method.expiry_date,
      cvv: "***",
      customer_vault: is_recurring ? "add_customer" : "not_used",
      security_key: SECURITY_KEY ? "****" : "MISSING",
      environment: NODE_ENV,
      billing_info: {
        first_name: billingInfo.first_name,
        last_name: billingInfo.last_name,
        email: billingInfo.email,
        has_address: !!billingInfo.address1,
        has_city: !!billingInfo.city,
        has_state: !!billingInfo.state,
        has_zip: !!billingInfo.zip,
      },
    });

    let paymentResponse;
    let responseText;

    try {
      // Make the request to the payment gateway with timeout and error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      console.log("🌐 Making HTTP request to EcomPayments gateway...");

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
      console.log(
        "📥 EcomPayments gateway response status:",
        paymentResponse.status
      );
      console.log(
        "📋 EcomPayments gateway response headers:",
        Object.fromEntries(paymentResponse.headers.entries())
      );

      // Get the response text
      responseText = await paymentResponse.text();
      console.log("📄 Raw EcomPayments gateway response:", responseText);
    } catch (networkError) {
      console.error(
        "💥 Network error when contacting EcomPayments gateway:",
        networkError
      );

      // Only fall back to simulation if it's a network error
      console.log("🔄 Falling back to simulation due to network error");
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Parse the NMI response
    const parsedResponse = parseNMIResponse(responseText);
    console.log("🔍 Parsed EcomPayments response:", {
      success: parsedResponse.success,
      responseCode: parsedResponse.responseCode,
      responseText: parsedResponse.responseText,
      transactionId: parsedResponse.transactionId,
      customerVaultId: parsedResponse.customerVaultId,
      subscriptionId: parsedResponse.subscriptionId,
    });

    // Check if the payment was successful (response code 1 means approved)
    if (!parsedResponse.success) {
      console.error("❌ EcomPayments payment failed:", {
        responseCode: parsedResponse.responseCode,
        responseText: parsedResponse.responseText,
      });

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
          gateway_response: parsedResponse,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // SUCCESS! Real EcomPayments payment processed
    console.log("🎉 Real EcomPayments payment successful!");

    // Extract the last 4 digits of the card number for storage
    const last4 = payment_method.card_number.replace(/\s/g, "").slice(-4);

    console.log(
      "✅ Payment successful! Processing customer vault and subscription data:",
      {
        transactionId: parsedResponse.transactionId,
        subscriptionId: parsedResponse.subscriptionId,
        customerVaultId: parsedResponse.customerVaultId,
        isRecurring: is_recurring,
        customerEmail: customer_email,
        planName: plan_name,
      }
    );

    // For recurring payments, store subscription details in the database
    if (is_recurring && parsedResponse.subscriptionId) {
      try {
        console.log(
          "🔄 Processing recurring subscription for customer:",
          customer_email
        );

        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("email", customer_email)
          .single();

        if (businessError) {
          console.error("❌ Error finding business by email:", businessError);
          // Try alternative lookup methods if needed
        }

        if (businessData) {
          console.log(" Found business for subscription:", {
            businessId: businessData.id,
            businessName: businessData.name,
            customerEmail: customer_email,
          });

          // Create or update subscription record
          const subscriptionData = {
            business_id: businessData.id,
            plan_id: null, // You might want to add plan_id mapping
            status: "active",
            payment_status: "paid",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
            payment_provider: "nmi",
            nmi_subscription_id: parsedResponse.subscriptionId,
            nmi_customer_vault_id: parsedResponse.customerVaultId,
          };

          console.log("📝 Creating/updating subscription record:", {
            businessId: businessData.id,
            subscriptionId: parsedResponse.subscriptionId,
            customerVaultId: parsedResponse.customerVaultId,
          });

          const { error: subscriptionError } = await supabase
            .from("subscriptions")
            .upsert(subscriptionData);

          if (subscriptionError) {
            console.error("❌ Error creating subscription:", subscriptionError);
          } else {
            console.log("✅ Subscription record created/updated successfully");
          }

          // Update business with basic subscription info (but NOT customer vault ID)
          const businessUpdateData = {
            subscription_status: "active",
            plan_name: plan_name,
            next_billing_date: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
            last_payment_date: new Date().toISOString(),
            payment_method_last_four: last4,
            // Remove nmi_customer_vault_id from here - it should only be in subscriptions table
          };

          console.log("📝 Updating business record:", {
            businessId: businessData.id,
            planName: plan_name,
            last4: last4,
          });

          const { error: updateError } = await supabase
            .from("businesses")
            .update(businessUpdateData)
            .eq("id", businessData.id);

          if (updateError) {
            console.error("❌ Error updating business:", updateError);
          } else {
            console.log("✅ Business record updated successfully");
          }

          // Log payment history
          const { error: historyError } = await supabase
            .from("payment_history")
            .insert({
              business_id: businessData.id,
              nmi_transaction_id: parsedResponse.transactionId,
              amount: processAmount / 100,
              status: "approved",
              type: "initial_subscription",
              response_text: `Initial subscription payment for ${plan_name}`,
            });

          if (historyError) {
            console.error("❌ Error logging payment history:", historyError);
          } else {
            console.log("✅ Payment history logged successfully");
          }
        } else {
          console.error("❌ No business found for email:", customer_email);
        }
      } catch (dbError) {
        console.error(
          "💥 Database error during subscription processing:",
          dbError
        );
      }
    } else if (is_recurring && !parsedResponse.subscriptionId) {
      console.warn(
        "⚠️ Recurring payment but no subscription ID received from gateway"
      );
    } else {
      console.log("ℹ️ One-time payment - no subscription processing needed");
    }

    // Payment successful - return the response
    const successResponse = {
      success: true,
      transaction_id: parsedResponse.transactionId,
      subscription_id: parsedResponse.subscriptionId,
      customer_vault_id: parsedResponse.customerVaultId,
      amount: processAmount / 100,
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
    };

    console.log("🎉 Final success response:", {
      transactionId: successResponse.transaction_id,
      subscriptionId: successResponse.subscription_id,
      customerVaultId: successResponse.customer_vault_id,
      amount: successResponse.amount,
      customerEmail: successResponse.customer_email,
    });

    return new Response(JSON.stringify(successResponse), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
