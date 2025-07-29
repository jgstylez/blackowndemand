import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email)
      throw new Error("User not authenticated or email not available");

    // Parse request body
    const {
      businessId,
      currentPlan,
      newPlan,
      planPrice,
      paymentMethod,
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
      .eq("user_id", user.id)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found or access denied");
    }

    // Check if business has an active subscription
    if (business.subscription_status !== "active") {
      throw new Error("Business must have an active subscription to upgrade");
    }

    // Calculate the upgrade amount (difference between plans)
    const currentPlanPrice = business.plan_price || 0;
    const upgradeAmount = planPrice - currentPlanPrice;

    if (upgradeAmount <= 0) {
      throw new Error("New plan must be more expensive than current plan");
    }

    // Process the upgrade payment
    const paymentResult = await processUpgradePayment({
      businessId,
      currentPlan,
      newPlan,
      upgradeAmount,
      paymentMethod,
      userEmail: user.email,
      discountCode,
      discountedAmount,
    });

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || "Payment processing failed");
    }

    // Update the business with new plan details
    const { error: updateError } = await supabaseClient
      .from("businesses")
      .update({
        plan_name: newPlan,
        plan_price: planPrice,
        subscription_status: "active",
        next_billing_date: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        last_payment_date: new Date().toISOString(),
        payment_method_last_four:
          paymentResult.payment_method_details?.card?.last4 ||
          business.payment_method_last_four,
      })
      .eq("id", businessId);

    if (updateError) {
      console.error("Error updating business plan:", updateError);
      throw new Error("Failed to update business plan");
    }

    // Log the upgrade in payment_history
    const { error: historyError } = await supabaseClient
      .from("payment_history")
      .insert({
        business_id: businessId,
        amount: upgradeAmount,
        status: "approved",
        type: "plan_upgrade",
        description: `Upgraded from ${currentPlan} to ${newPlan}`,
        transaction_id: paymentResult.transaction_id,
      });

    if (historyError) {
      console.error("Error logging upgrade history:", historyError);
    }

    console.log("Plan upgrade completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Plan upgraded successfully",
        transaction_id: paymentResult.transaction_id,
        new_plan: newPlan,
        upgrade_amount: upgradeAmount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
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

async function processUpgradePayment({
  businessId,
  currentPlan,
  newPlan,
  upgradeAmount,
  paymentMethod,
  userEmail,
  discountCode,
  discountedAmount,
}: {
  businessId: string;
  currentPlan: string;
  newPlan: string;
  upgradeAmount: number;
  paymentMethod: any;
  userEmail: string;
  discountCode?: string;
  discountedAmount?: number;
}) {
  // Use the existing process-payment function logic
  const processAmount = Math.round((discountedAmount || upgradeAmount) * 100); // Convert to cents

  // For now, we'll use the same payment processing logic as the main process-payment function
  // In a production environment, you might want to create a separate upgrade-specific payment flow

  const paymentData = {
    amount: processAmount,
    currency: "USD",
    description: `Plan upgrade: ${currentPlan} to ${newPlan}`,
    customer_email: userEmail,
    payment_method: paymentMethod,
    is_recurring: false, // Upgrades are one-time payments
    discount_code: discountCode,
    discounted_amount: discountedAmount,
    metadata: {
      business_id: businessId,
      upgrade_from: currentPlan,
      upgrade_to: newPlan,
      upgrade_amount: upgradeAmount,
    },
  };

  // Call the process-payment function
  const response = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify(paymentData),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Payment processing failed");
  }

  return result;
}
