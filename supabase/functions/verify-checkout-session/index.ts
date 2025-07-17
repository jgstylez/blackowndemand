import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-08-16",
});

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return new Response(
      JSON.stringify({ paid: false, error: "Missing session_id" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" || session.status === "complete";
    return new Response(JSON.stringify({ paid }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ paid: false, error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
