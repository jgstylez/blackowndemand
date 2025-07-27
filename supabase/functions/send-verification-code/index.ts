import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { SESClient, SendEmailCommand } from "npm:@aws-sdk/client-ses";

// Env Variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const awsRegion = Deno.env.get("AWS_REGION") || "us-east-1";
const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

// ✅ Verified email — matches your contact form
const PRIMARY_SUPPORT_EMAIL = "support@blackdollarnetwork.com";

// Supabase & AWS SES Clients
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const sesClient = new SESClient({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Send verification email with logging
async function sendVerificationEmail(to: string, code: string) {
  const params = {
    Source: PRIMARY_SUPPORT_EMAIL,
    ReplyToAddresses: [PRIMARY_SUPPORT_EMAIL],
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: "Your Verification Code",
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
            <div style="font-family: sans-serif;">
              <h2>Your Verification Code</h2>
              <p>Here is your 6-digit code:</p>
              <div style="font-size: 28px; font-weight: bold; margin: 12px 0; color: #333;">
                ${code}
              </div>
              <p>This code expires in 15 minutes.</p>
            </div>
          `,
        },
        Text: {
          Charset: "UTF-8",
          Data: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log(
      "✅ Email sent successfully via SES. Message ID:",
      response.MessageId
    );
    return response.MessageId;
  } catch (err) {
    console.error("❌ Failed to send verification email via SES:", err);
    throw err;
  }
}

// API handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the raw request body first
    const rawBody = await req.text();
    console.log("📥 Raw request body:", rawBody);

    // Check if body is empty
    if (!rawBody || rawBody.trim() === "") {
      console.error("❌ Empty request body received");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Request body is empty",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      console.error("❌ Raw body was:", rawBody);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { businessId, email } = requestBody;

    console.log("📥 Parsed verification request:", { businessId, email });

    // Validate required fields
    if (!businessId || !email) {
      console.warn("⚠️ Missing businessId or email:", { businessId, email });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Business ID and email are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn("⚠️ Invalid email format:", email);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if business exists and is unclaimed
    console.log("🔍 Checking business:", businessId);
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, email, claimed_at")
      .eq("id", businessId)
      .single();

    if (businessError) {
      console.error("❌ Database error fetching business:", businessError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database error while fetching business",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!business) {
      console.warn("⚠️ Business not found:", businessId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Business not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (business.claimed_at) {
      console.warn("⚠️ Business already claimed:", businessId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Business is already claimed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    console.log("🔐 Generated verification code:", verificationCode);

    // Delete any existing unused codes for this business and email
    console.log("🗑️ Cleaning up old verification codes");
    const { error: deleteError } = await supabase
      .from("verification_codes")
      .delete()
      .eq("business_id", businessId)
      .eq("email", email)
      .eq("used", false);

    if (deleteError) {
      console.warn("⚠️ Error deleting old codes (non-critical):", deleteError);
    }

    // Store new verification code
    console.log("💾 Storing verification code");
    const { error: storeError } = await supabase
      .from("verification_codes")
      .insert({
        business_id: businessId,
        email,
        code: verificationCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        used: false,
      });

    if (storeError) {
      console.error("❌ Error storing verification code:", storeError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to store verification code",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email
    console.log("📧 Sending verification email");
    const messageId = await sendVerificationEmail(email, verificationCode);

    console.log("✅ Verification flow completed successfully");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification code sent successfully",
        messageId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Unhandled error in verification flow:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
