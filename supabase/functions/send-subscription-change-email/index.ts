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
      oldPlanName,
      newPlanName,
      changeType,
      effectiveDate,
      priceDifference,
    } = await req.json();

    if (
      !userEmail ||
      !businessName ||
      !oldPlanName ||
      !newPlanName ||
      !changeType ||
      !effectiveDate
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

    const formattedPriceDiff = priceDifference
      ? Math.abs(priceDifference).toFixed(2)
      : null;
    const changeAction = changeType === "upgrade" ? "upgraded" : "downgraded";

    const htmlContent = `
      <h2>Subscription ${
        changeType.charAt(0).toUpperCase() + changeType.slice(1)
      } Confirmation</h2>
      <p>Dear Business Owner,</p>
      
      <p>Your subscription for <strong>"${businessName}"</strong> has been successfully ${changeAction}.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Change Details</h3>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Previous Plan:</strong> ${oldPlanName}</p>
        <p><strong>New Plan:</strong> ${newPlanName}</p>
        <p><strong>Change Type:</strong> ${
          changeType.charAt(0).toUpperCase() + changeType.slice(1)
        }</p>
        <p><strong>Effective Date:</strong> ${effectiveDate}</p>
        ${
          formattedPriceDiff
            ? `<p><strong>Price ${
                changeType === "upgrade" ? "Increase" : "Decrease"
              }:</strong> $${formattedPriceDiff}</p>`
            : ""
        }
      </div>
      
      <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">What's Next</h3>
        <ul>
          <li>Your new plan features are now active</li>
          <li>Your next billing cycle will reflect the new pricing</li>
          <li>You can manage your subscription anytime from your dashboard</li>
        </ul>
      </div>
      
      <p>If you have any questions about your new plan or need assistance, please don't hesitate to contact our support team.</p>
      
      <p>Thank you for choosing BlackOWNDemand!</p>
      
      <p>Best regards,<br>The BlackOWNDemand Team</p>
    `;

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: PRIMARY_SUPPORT_EMAIL,
      to: userEmail,
      subject: `Subscription ${
        changeType.charAt(0).toUpperCase() + changeType.slice(1)
      } - ${businessName}`,
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
        message: "Subscription change email sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending subscription change email:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
