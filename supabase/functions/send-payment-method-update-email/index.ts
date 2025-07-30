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

    const { userEmail, businessName, paymentMethodLast4, updateDate } =
      await req.json();

    if (!userEmail || !businessName || !paymentMethodLast4 || !updateDate) {
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
      <h2>Payment Method Updated</h2>
      <p>Dear Business Owner,</p>
      
      <p>Your payment method for <strong>"${businessName}"</strong> has been successfully updated.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Update Details</h3>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>New Payment Method:</strong> ****${paymentMethodLast4}</p>
        <p><strong>Update Date:</strong> ${updateDate}</p>
      </div>
      
      <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Security Notice</h3>
        <p>If you did not make this change, please contact our support team immediately. We take the security of your payment information seriously.</p>
      </div>
      
      <p>Your next billing cycle will use this updated payment method. You can manage your payment information anytime from your account dashboard.</p>
      
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br>The BlackOWNDemand Team</p>
    `;

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: PRIMARY_SUPPORT_EMAIL,
      to: userEmail,
      subject: `Payment Method Updated - ${businessName}`,
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
        message: "Payment method update email sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending payment method update email:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
