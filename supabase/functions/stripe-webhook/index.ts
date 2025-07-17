import Stripe from "stripe";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-08-16",
});
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;
    const stripeSubscriptionId = session.subscription;

    // 1. Find the business (or user) by email
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("email", email)
      .single();

    if (businessError || !business) {
      console.error("Business not found for email:", email, businessError);
      return new Response("Business not found for email", { status: 200 });
    }

    // 2. Find the latest pending subscription for this business
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("business_id", business.id)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      console.error(
        "Subscription not found for business:",
        business.id,
        subError
      );
      return new Response("Subscription not found for business", {
        status: 200,
      });
    }

    // 3. Mark the subscription as paid/active and store Stripe subscription ID
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        payment_status: "paid",
        status: "active",
        stripe_subscription_id: stripeSubscriptionId,
      })
      .eq("id", subscription.id);
    if (updateError) {
      console.error(
        "Failed to update subscription:",
        subscription.id,
        updateError
      );
    }

    // 4. (Optional) Link the business to this subscription
    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({ subscription_id: subscription.id })
      .eq("id", business.id);
    if (businessUpdateError) {
      console.error(
        "Failed to update business with subscription_id:",
        business.id,
        businessUpdateError
      );
    }
  }

  return new Response("ok", { status: 200 });
});
