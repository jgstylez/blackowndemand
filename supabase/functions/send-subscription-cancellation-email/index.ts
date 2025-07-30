import { createClient } from "npm:@supabase/supabase-js";
import { Resend } from "npm:resend";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PRIMARY_SUPPORT_EMAIL =
  Deno.env.get("PRIMARY_SUPPORT_EMAIL") ?? "support@blackdollarnetwork.com";
const SECONDARY_SUPPORT_EMAIL =
  Deno.env.get("SECONDARY_SUPPORT_EMAIL") ?? "jlgreen@blackdollarnetwork.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      userEmail,
      businessName,
      planName,
      cancellationDate,
      endDate,
      refundAmount,
    } = await req.json();

    if (
      !userEmail ||
      !businessName ||
      !planName ||
      !cancellationDate ||
      !endDate
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedRefund = refundAmount ? refundAmount.toFixed(2) : null;

    const htmlContent = `
      <h2>Subscription Cancellation Confirmation</h2>
      <p>Dear Business Owner,</p>
      
      <p>We've received your request to cancel your subscription for <strong>"${businessName}"</strong>.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Cancellation Details</h3>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Cancellation Date:</strong> ${cancellationDate}</p>
        <p><strong>Service End Date:</strong> ${endDate}</p>
        ${
          formattedRefund
            ? `<p><strong>Refund Amount:</strong> $${formattedRefund}</p>`
            : ""
        }
      </div>
      
      <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Important Information</h3>
        <ul>
          <li>Your business will remain active until ${endDate}</li>
          <li>You can reactivate your subscription at any time</li>
          <li>Your business data and settings will be preserved</li>
          ${
            formattedRefund
              ? `<li>Refund will be processed within 5-10 business days</li>`
              : ""
          }
        </ul>
      </div>
      
      <p>If you change your mind, you can reactivate your subscription by logging into your account and updating your payment information.</p>
      
      <p>Thank you for being part of the BlackOWNDemand community. We hope to see you again soon!</p>
      
      <p>Best regards,<br>The BlackOWNDemand Team</p>
    `;

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: PRIMARY_SUPPORT_EMAIL,
      to: userEmail,
      subject: `Subscription Cancellation - ${businessName}`,
      html: htmlContent,
      reply_to: PRIMARY_SUPPORT_EMAIL,
      bcc: [SECONDARY_SUPPORT_EMAIL],
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription cancellation email sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending subscription cancellation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
