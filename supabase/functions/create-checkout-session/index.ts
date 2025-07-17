import Stripe from "stripe";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; // For Deno Edge Functions

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getStripeCouponIdForDiscount(
  discountCode: string
): Promise<string | null> {
  // 1. Validate the code in your DB
  const { data, error } = await supabase
    .from("discount_codes")
    .select("percent_off, stripe_coupon_id, active")
    .eq("code", discountCode)
    .single();

  if (error || !data || !data.active) return null;

  // 2. If not in Stripe yet, create it
  if (!data.stripe_coupon_id) {
    const coupon = await stripe.coupons.create({
      percent_off: data.percent_off,
      duration: "once",
      name: discountCode,
    });
    // Save coupon.id to your DB for future use
    await supabase
      .from("discount_codes")
      .update({ stripe_coupon_id: coupon.id })
      .eq("code", discountCode);
    return coupon.id;
  }

  // 3. Return the Stripe coupon ID
  return data.stripe_coupon_id;
}

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-08-16",
});

Deno.serve(async (req) => {
  try {
    const { planPriceId, userEmail, discountCode } = await req.json();

    let discounts;
    if (discountCode) {
      // TODO: Validate discountCode with your internal system
      // For now, assume you have a mapping from discountCode to Stripe coupon ID
      const couponId = await getStripeCouponIdForDiscount(discountCode); // implement this
      if (couponId) {
        discounts = [{ coupon: couponId }];
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price: planPriceId, // Stripe Price ID for the annual plan
          quantity: 1,
        },
      ],
      discounts,
      success_url: `${Deno.env.get(
        "FRONTEND_URL"
      )}/business/onboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("FRONTEND_URL")}/pricing?canceled=true`,
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
