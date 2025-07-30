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
      deactivationReason,
      reactivationInstructions,
    } = await req.json();

    if (!userEmail || !businessName) {
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

    const htmlContent = `
      <h2>Business Deactivation Notice</h2>
      <p>Dear Business Owner,</p>
      
      <p>We regret to inform you that your business listing <strong>"${businessName}"</strong> has been deactivated on BlackOWNDemand.</p>
      
      ${
        deactivationReason
          ? `<p><strong>Reason:</strong> ${deactivationReason}</p>`
          : ""
      }
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">What this means:</h3>
        <ul>
          <li>Your business is no longer visible to customers</li>
          <li>You will not receive new inquiries or bookings</li>
          <li>Your subscription has been paused</li>
        </ul>
      </div>
      
      ${
        reactivationInstructions
          ? `
        <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">How to Reactivate:</h3>
          <p>${reactivationInstructions}</p>
        </div>
      `
          : ""
      }
      
      <p>If you believe this deactivation was made in error, or if you have any questions, please contact our support team immediately.</p>
      
      <p>We're here to help you get your business back online as quickly as possible.</p>
      
      <p>Best regards,<br>The BlackOWNDemand Team</p>
    `;

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: PRIMARY_SUPPORT_EMAIL,
      to: userEmail,
      subject: `Business Deactivation Notice - ${businessName}`,
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
        message: "Business deactivation email sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending business deactivation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
