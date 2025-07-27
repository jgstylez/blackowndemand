// This is a Supabase Edge Function for handling NMI payment gateway webhooks

import { createClient } from "npm:@supabase/supabase-js";

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get the webhook secret for verification
const NMI_WEBHOOK_SECRET = Deno.env.get("NMI_WEBHOOK_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Verify webhook signature if a secret is configured
function verifyWebhookSignature(payload: string, signature: string): boolean {
  // If no secret is configured, skip verification
  if (!NMI_WEBHOOK_SECRET) {
    console.warn(
      "NMI_WEBHOOK_SECRET not configured, skipping webhook signature verification"
    );
    return true;
  }

  // In a real implementation, you would verify the signature here
  // This is a placeholder for the actual verification logic
  console.log("Verifying webhook signature");
  return true;
}

// Parse webhook payload
function parseWebhookPayload(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
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

    // Get the raw request body
    const rawBody = await req.text();
    console.log("Received webhook payload:", rawBody);

    // Get the signature from headers if available
    const signature = req.headers.get("x-nmi-signature") || "";

    // Verify the webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the webhook payload
    const webhookData = parseWebhookPayload(rawBody);
    console.log("Parsed webhook data:", webhookData);

    // Extract key information from the webhook
    const eventType = webhookData.event_type || "";
    const subscriptionId = webhookData.subscription_id || "";
    const transactionId = webhookData.transaction_id || "";
    const status = webhookData.status || "";
    const amount = parseFloat(webhookData.amount || "0");

    // Handle different event types
    switch (eventType) {
      case "recurring_payment_success":
        await handleRecurringPaymentSuccess(
          subscriptionId,
          transactionId,
          amount
        );
        break;

      case "recurring_payment_failed":
        await handleRecurringPaymentFailed(
          subscriptionId,
          transactionId,
          amount,
          webhookData.response_text || ""
        );
        break;

      case "subscription_cancelled":
        await handleSubscriptionCancelled(subscriptionId);
        break;

      case "subscription_updated":
        await handleSubscriptionUpdated(subscriptionId);
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Handler for successful recurring payments
async function handleRecurringPaymentSuccess(
  subscriptionId: string,
  transactionId: string,
  amount: number
) {
  console.log(
    `Processing successful recurring payment: ${subscriptionId}, ${transactionId}, $${amount}`
  );

  try {
    // Find the business with this subscription ID
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("nmi_subscription_id", subscriptionId)
      .single();

    if (businessError) {
      console.error("Error finding business for subscription:", businessError);
      return;
    }

    if (!business) {
      console.error(
        `No business found with subscription ID: ${subscriptionId}`
      );
      return;
    }

    // Update the business record
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        subscription_status: "Starter Plan", // Or get the actual plan name from the subscription
        last_payment_date: new Date().toISOString(),
        next_billing_date: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 year from now
      })
      .eq("id", business.id);

    if (updateError) {
      console.error(
        "Error updating business after successful payment:",
        updateError
      );
    }

    // Log the payment in payment_history
    const { error: historyError } = await supabase
      .from("payment_history")
      .insert({
        business_id: business.id,
        nmi_transaction_id: transactionId,
        amount: amount,
        status: "approved",
        type: "recurring_payment",
        response_text: "Recurring payment successful",
      });

    if (historyError) {
      console.error("Error logging payment history:", historyError);
    }

    console.log(
      `Successfully processed recurring payment for business ${business.id}`
    );
  } catch (error) {
    console.error("Error in handleRecurringPaymentSuccess:", error);
  }
}

// Handler for failed recurring payments
async function handleRecurringPaymentFailed(
  subscriptionId: string,
  transactionId: string,
  amount: number,
  responseText: string
) {
  console.log(
    `Processing failed recurring payment: ${subscriptionId}, ${transactionId}, $${amount}`
  );

  try {
    // Find the business with this subscription ID
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, subscription_status")
      .eq("nmi_subscription_id", subscriptionId)
      .single();

    if (businessError) {
      console.error("Error finding business for subscription:", businessError);
      return;
    }

    if (!business) {
      console.error(
        `No business found with subscription ID: ${subscriptionId}`
      );
      return;
    }

    // Update the business record - set to past_due status
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        subscription_status: "pending", // Or keep the current plan name but mark as pending
      })
      .eq("id", business.id);

    if (updateError) {
      console.error(
        "Error updating business after failed payment:",
        updateError
      );
    }

    // Log the payment in payment_history
    const { error: historyError } = await supabase
      .from("payment_history")
      .insert({
        business_id: business.id,
        nmi_transaction_id: transactionId,
        amount: amount,
        status: "failed",
        type: "recurring_payment",
        response_text: responseText,
      });

    if (historyError) {
      console.error("Error logging payment history:", historyError);
    }

    console.log(
      `Processed failed recurring payment for business ${business.id}`
    );

    // TODO: Send email notification to customer about failed payment
  } catch (error) {
    console.error("Error in handleRecurringPaymentFailed:", error);
  }
}

// Handler for cancelled subscriptions
async function handleSubscriptionCancelled(subscriptionId: string) {
  console.log(`Processing subscription cancellation: ${subscriptionId}`);

  try {
    // Find the business with this subscription ID
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("nmi_subscription_id", subscriptionId)
      .single();

    if (businessError) {
      console.error("Error finding business for subscription:", businessError);
      return;
    }

    if (!business) {
      console.error(
        `No business found with subscription ID: ${subscriptionId}`
      );
      return;
    }

    // Update the business record
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        subscription_status: "pending", // Or keep the current plan name
      })
      .eq("id", business.id);

    if (updateError) {
      console.error(
        "Error updating business after subscription cancellation:",
        updateError
      );
    }

    console.log(
      `Successfully processed subscription cancellation for business ${business.id}`
    );

    // TODO: Send email notification to customer about cancellation
  } catch (error) {
    console.error("Error in handleSubscriptionCancelled:", error);
  }
}

// Handler for updated subscriptions
async function handleSubscriptionUpdated(subscriptionId: string) {
  console.log(`Processing subscription update: ${subscriptionId}`);

  try {
    // Find the business with this subscription ID
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("nmi_subscription_id", subscriptionId)
      .single();

    if (businessError) {
      console.error("Error finding business for subscription:", businessError);
      return;
    }

    if (!business) {
      console.error(
        `No business found with subscription ID: ${subscriptionId}`
      );
      return;
    }

    // Log the update event
    console.log(
      `Successfully processed subscription update for business ${business.id}`
    );

    // No specific action needed here, just acknowledging the update
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
  }
}
