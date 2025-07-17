import { serve } from "std/server";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-08-16",
});

serve(async (req) => {
  try {
    const { amount } = await req.json();
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency: "usd",
    });
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
});
