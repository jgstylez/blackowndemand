import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get Stripe secret key
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

// Helper function to create a simulated successful payment response for test cards
function createSimulatedResponse(
  processAmount: number,
  currency: string,
  description: string,
  customer_email: string,
  payment_method: any,
  reason: string
) {
  console.log(`Creating simulated payment response. Reason: ${reason}`);

  const transactionId = `sim_stripe_${Date.now()}_${Math.random()
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
    stripe_mode: true,
    simulation_reason: reason,
  };
}

// Helper function to determine if we should use simulation mode
function shouldUseSimulation(cardNumber: string): boolean {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  const testCards = [
    "4000000000000002", // Visa test card
    "5555555555554444", // Mastercard test card  
    "378282246310005",  // Amex test card
    "4000000000000127", // Visa simulation card
  ];
  
  // Always simulate for test cards or if no Stripe key
  return testCards.includes(cleanCardNumber) || !stripeSecretKey;
}

serve(async (req) => {
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
    console.log("Stripe payment request received:", JSON.stringify(requestBody, null, 2));

    const {
      amount,
      final_amount,
      currency = "usd",
      description,
      customer_email,
      payment_method,
      discount_code_id,
      plan_name,
      is_recurring = true,
    } = requestBody;

    // Validate required fields
    const processAmount = final_amount !== undefined ? final_amount : amount;
    const isZeroAmount = processAmount === 0;

    if (
      typeof processAmount !== "number" ||
      processAmount < 0 ||
      (!isZeroAmount && !payment_method)
    ) {
      console.error("Validation failed for Stripe payment");
      return new Response(
        JSON.stringify({ error: "Missing or invalid payment information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle discount code if provided
    if (discount_code_id) {
      try {
        const { error: discountError } = await supabase.rpc("apply_discount_code", {
          p_code: discount_code_id,
        });
        if (discountError) {
          console.error("Error applying discount code:", discountError);
        }
      } catch (discountErr) {
        console.error("Exception applying discount code:", discountErr);
      }
    }

    // For zero-amount transactions, skip payment processing
    if (isZeroAmount) {
      console.log("Zero amount transaction - skipping Stripe processing");
      
      const transactionId = `free_stripe_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}`;

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionId,
          amount: 0,
          currency,
          description,
          customer_email,
          payment_date: new Date().toISOString(),
          status: "approved",
          payment_method_details: {
            type: "free",
            card: null,
          },
          isFreeTransaction: true,
          stripe_mode: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we should use simulation mode
    if (shouldUseSimulation(payment_method.card_number)) {
      console.log("Using simulation mode for Stripe payment");
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const simulatedResponse = createSimulatedResponse(
        processAmount,
        currency,
        description,
        customer_email,
        payment_method,
        !stripeSecretKey ? "No Stripe key configured" : "Test card detected"
      );

      return new Response(JSON.stringify(simulatedResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Real Stripe payment processing
    console.log("Processing real Stripe payment");

    // Find or create customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ 
      email: customer_email, 
      limit: 1 
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing Stripe customer:", customerId);
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: payment_method.cardholder_name,
      });
      customerId = customer.id;
      console.log("Created new Stripe customer:", customerId);
    }

    if (is_recurring) {
      // Create subscription
      console.log("Creating Stripe subscription");
      
      // Create payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          number: payment_method.card_number.replace(/\s/g, ""),
          exp_month: parseInt(payment_method.expiry_date.split("/")[0]),
          exp_year: parseInt(`20${payment_method.expiry_date.split("/")[1]}`),
          cvc: payment_method.cvv,
        },
        billing_details: {
          name: payment_method.cardholder_name,
          email: customer_email,
        },
      });

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Create price
      const price = await stripe.prices.create({
        unit_amount: processAmount,
        currency,
        recurring: {
          interval: "year",
        },
        product_data: {
          name: plan_name || "Business Listing",
          description,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id,
        }],
        default_payment_method: paymentMethod.id,
        expand: ["latest_invoice.payment_intent"],
      });

      console.log("Stripe subscription created:", subscription.id);

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: subscription.id,
          subscription_id: subscription.id,
          customer_id: customerId,
          amount: processAmount / 100,
          currency,
          description,
          customer_email,
          payment_date: new Date().toISOString(),
          status: "approved",
          payment_method_details: {
            type: "card",
            card: {
              brand: paymentMethod.card?.brand || "unknown",
              last4: paymentMethod.card?.last4 || "0000",
              exp_month: paymentMethod.card?.exp_month,
              exp_year: paymentMethod.card?.exp_year,
            },
          },
          stripe_mode: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // One-time payment
      console.log("Creating Stripe one-time payment");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: processAmount,
        currency,
        customer: customerId,
        description,
        payment_method_data: {
          type: "card",
          card: {
            number: payment_method.card_number.replace(/\s/g, ""),
            exp_month: parseInt(payment_method.expiry_date.split("/")[0]),
            exp_year: parseInt(`20${payment_method.expiry_date.split("/")[1]}`),
            cvc: payment_method.cvv,
          },
          billing_details: {
            name: payment_method.cardholder_name,
            email: customer_email,
          },
        },
        confirm: true,
        return_url: "https://your-domain.com/return", // You'll need to set this
      });

      console.log("Stripe payment intent created:", paymentIntent.id);

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: paymentIntent.id,
          customer_id: customerId,
          amount: processAmount / 100,
          currency,
          description,
          customer_email,
          payment_date: new Date().toISOString(),
          status: paymentIntent.status === "succeeded" ? "approved" : paymentIntent.status,
          payment_method_details: {
            type: "card",
            card: {
              brand: paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand || "unknown",
              last4: paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4 || "0000",
            },
          },
          stripe_mode: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Stripe payment error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Payment processing failed";
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: "stripe_error",
        stripe_mode: true,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});