// This is a Supabase Edge Function for sending emails

import { createClient } from "npm:@supabase/supabase-js";
import { Resend } from "npm:resend";
import { SESClient, SendEmailCommand } from "npm:@aws-sdk/client-ses";

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email configuration
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

// Function to send email using Resend
async function sendEmailViaService(emailData: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: PRIMARY_SUPPORT_EMAIL,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      reply_to: emailData.replyTo,
      cc: emailData.cc,
      bcc: emailData.bcc,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully via Resend:", data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
}

// Function to send email using AWS SES
async function sendEmailViaService(emailData: any) {
  try {
    const params = {
      Source: PRIMARY_SUPPORT_EMAIL,
      ReplyToAddresses: [emailData.replyTo],
      Destination: {
        ToAddresses: [emailData.to],
        CcAddresses: emailData.cc || [],
        BccAddresses: emailData.bcc || [],
      },
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: emailData.subject,
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: emailData.html,
          },
          Text: {
            Charset: "UTF-8",
            Data: emailData.text || emailData.html?.replace(/<[^>]*>/g, ""),
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    console.log("Email sent successfully via SES:", response.MessageId);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("SES error:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { to, subject, html, text, replyTo, cc, bcc } = await req.json();

    if (!to || !subject || (!html && !text)) {
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

    // Prepare email data
    const emailData = {
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ""), // Strip HTML if no text provided
      replyTo: replyTo || PRIMARY_SUPPORT_EMAIL,
      cc: cc || [],
      bcc: bcc || [SECONDARY_SUPPORT_EMAIL],
    };

    console.log("Processing email request:", {
      from: PRIMARY_SUPPORT_EMAIL, // IMPORTANT: Always use verified email as the "From" address
      to: emailData.to,
      subject: emailData.subject,
      replyTo: emailData.replyTo,
      cc: emailData.cc,
      bcc: emailData.bcc,
    });

    // Send email using the email service
    const result = await sendEmailViaService(emailData);

    if (!result.success) {
      throw new Error("Failed to send email via service");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing email request:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
