import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ECOM_LIVE_SECURITY_KEY = Deno.env.get("ECOM_LIVE_SECURITY_KEY") ?? "";
const ECOM_TEST_SECURITY_KEY = Deno.env.get("ECOM_TEST_SECURITY_KEY") ?? "";
const NODE_ENV = Deno.env.get("NODE_ENV") ?? "development";

// Select the appropriate security key based on environment
const SECURITY_KEY =
  NODE_ENV === "production" ? ECOM_LIVE_SECURITY_KEY : ECOM_TEST_SECURITY_KEY;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing plan upgrade...");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the user from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    // Parse request body
    const {
      businessId,
      currentPlan,
      newPlan,
      planPrice,
      customerEmail,
      discountCode,
      discountedAmount,
    } = await req.json();

    console.log("Upgrade request data:", {
      businessId,
      currentPlan,
      newPlan,
      planPrice,
      userEmail: user.email,
      discountCode,
      discountedAmount,
    });

    // Validate required fields
    if (!businessId || !newPlan || !planPrice) {
      throw new Error(
        "Missing required fields: businessId, newPlan, planPrice"
      );
    }

    // Check if business exists and user owns it
    const { data: business, error: businessError } = await supabaseClient
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found or access denied");
    }

    // Additional validation: check if business is active
    if (!business.is_active) {
      throw new Error("Cannot modify plan for inactive business");
    }

    // Check if business has a subscription (active or cancelled - both can be modified)
    if (!business.plan_name) {
      throw new Error("Business must have a subscription to modify plans");
    }

    // Calculate the upgrade amount (difference between plans)
    const currentPlanPrice = business.plan_price || 0;
    const planChangeAmount = planPrice - currentPlanPrice;
    const isUpgrade = planChangeAmount > 0;
    const isDowngrade = planChangeAmount < 0;

    // Allow both upgrades and downgrades
    if (planChangeAmount === 0) {
      throw new Error("New plan must be different from current plan");
    }

    // For downgrades, we need to ensure payment method is on file
    if (isDowngrade) {
      // Check if customer has a payment method on file
      if (!business.nmi_customer_vault_id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Payment method required for plan changes",
            code: "payment_method_required",
            requires_payment_method: true,
            message:
              "Please update your payment method before changing your plan to ensure future billing continues without interruption.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Update the business with new plan details (no payment needed for downgrades)
      const { error: updateError } = await supabaseClient
        .from("businesses")
        .update({
          plan_name: newPlan,
          plan_price: planPrice,
          subscription_status: "active", // Reactivate the subscription
          next_billing_date: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          last_payment_date: new Date().toISOString(),
        })
        .eq("id", businessId);

      if (updateError) {
        console.error("Error updating business plan:", updateError);
        throw new Error("Failed to update business plan");
      }

      // Log the plan change
      const { error: historyError } = await supabaseClient
        .from("payment_history")
        .insert({
          business_id: businessId,
          nmi_transaction_id: "no_transaction_id",
          amount: 0,
          status: "approved",
          type: "plan_downgrade",
          response_text: `Plan downgraded from ${currentPlan} to ${newPlan}`,
        });

      if (historyError) {
        console.error("Error logging plan downgrade:", historyError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Plan downgraded successfully",
          is_downgrade: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For upgrades, require customer vault
    if (!business.nmi_customer_vault_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "No payment method on file. Please update your payment method first.",
          code: "payment_method_required",
          requires_payment_method: true,
          message:
            "Please update your payment method before upgrading your plan.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Process upgrade with customer vault
    const upgradeResult = await processUpgradeWithCustomerVault({
      businessId,
      currentPlan,
      newPlan,
      upgradeAmount: planChangeAmount,
      customerVaultId: business.nmi_customer_vault_id,
      userEmail: user.email || "",
      discountCode,
      discountedAmount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Plan upgraded successfully",
        is_downgrade: false,
        ...upgradeResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing plan upgrade:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        code: "upgrade_error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function processUpgradeWithCustomerVault({
  businessId,
  currentPlan,
  newPlan,
  upgradeAmount,
  customerVaultId,
  userEmail,
  discountCode,
  discountedAmount,
}: {
  businessId: string;
  currentPlan: string;
  newPlan: string;
  upgradeAmount: number;
  customerVaultId: string;
  userEmail: string;
  discountCode?: string;
  discountedAmount?: number;
}) {
  // Prepare the payment data for charging the difference
  const postData = new URLSearchParams();
  postData.append("security_key", SECURITY_KEY); // Fix: Use SECURITY_KEY instead of NMI_SECURITY_KEY
  postData.append("type", "sale");
  postData.append("amount", (upgradeAmount / 100).toFixed(2)); // Convert cents to dollars
  postData.append("customer_vault_id", customerVaultId); // Use stored payment method
  postData.append("currency", "USD");
  postData.append(
    "order_description",
    `Plan upgrade from ${currentPlan} to ${newPlan}`
  );

  console.log("Processing upgrade with customer vault:", {
    customerVaultId,
    upgradeAmount: (upgradeAmount / 100).toFixed(2),
    currentPlan,
    newPlan,
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

  // Check if the payment was successful
  if (!parsedResponse.success) {
    const errorMessage = getNMIErrorMessage(
      parsedResponse.responseCode,
      parsedResponse.responseText
    );
    throw new Error(errorMessage);
  }

  // Update the business with new plan details
  const { error: updateError } = await supabaseClient
    .from("businesses")
    .update({
      plan_name: newPlan,
      plan_price: upgradeAmount / 100, // Fix: Use upgradeAmount converted to dollars
      subscription_status: "active",
      next_billing_date: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      last_payment_date: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (updateError) {
    console.error("Error updating business plan:", updateError);
    throw new Error("Failed to update business plan");
  }

  // Log the upgrade
  const { error: historyError } = await supabaseClient
    .from("payment_history")
    .insert({
      business_id: businessId,
      nmi_transaction_id: parsedResponse.transactionId || "no_transaction_id",
      amount: upgradeAmount / 100,
      status: "approved",
      type: "plan_upgrade",
      response_text: `Plan upgraded from ${currentPlan} to ${newPlan}`,
    });

  if (historyError) {
    console.error("Error logging plan upgrade:", historyError);
  }

  return {
    transaction_id: parsedResponse.transactionId,
    amount: upgradeAmount / 100,
    status: "approved",
  };
}

// Helper functions (reuse from process-payment)
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

function getNMIErrorMessage(
  responseCode: string,
  responseText: string
): string {
  // Add common error mappings
  const errorMessages: Record<string, string> = {
    "2": "Transaction declined",
    "3": "Transaction error",
    "4": "Transaction held for review",
    "6": "An error occurred while processing the card",
    "7": "Card number is invalid",
    "8": "Card has expired",
    "9": "Invalid CVV",
    "13": "Invalid amount",
    "14": "Invalid card number",
    "15": "Invalid customer vault ID",
  };

  return (
    errorMessages[responseCode] || responseText || "Payment processing failed"
  );
}
