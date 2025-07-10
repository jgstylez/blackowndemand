// This is a Supabase Edge Function for sending account deletion confirmation emails

import { createClient } from 'npm:@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email configuration
const PRIMARY_SUPPORT_EMAIL = Deno.env.get('PRIMARY_SUPPORT_EMAIL') ?? 'support@blackdollarnetwork.com';
const SECONDARY_SUPPORT_EMAIL = Deno.env.get('SECONDARY_SUPPORT_EMAIL') ?? 'jlgreen@blackdollarnetwork.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Function to send email using a third-party service
async function sendEmailViaService(emailData: any) {
  // TODO: Replace this with actual email service integration
  // For now, we'll simulate successful email sending and log the email data
  
  console.log('Account deletion email would be sent with the following data:', {
    from: PRIMARY_SUPPORT_EMAIL, // IMPORTANT: Always use verified email as the "From" address
    to: emailData.to,
    subject: emailData.subject,
    replyTo: emailData.replyTo,
    bcc: emailData.bcc,
    htmlPreview: emailData.html?.substring(0, 200) + '...'
  });

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // For development/testing, we'll return success
  // In production, integrate with services like:
  // - Resend: https://resend.com/
  // - SendGrid: https://sendgrid.com/
  // - Mailgun: https://www.mailgun.com/
  // - AWS SES: https://aws.amazon.com/ses/
  
  return { success: true };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, firstName, lastName } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create greeting based on available name information
    const greeting = firstName 
      ? `Hi ${firstName}${lastName ? ' ' + lastName : ''},` 
      : 'Hi there,';

    // Prepare email content
    const emailSubject = 'Your BlackOWNDemand Account Has Been Deleted';
    
    const emailContent = `
      <h2>Account Deletion Confirmation</h2>
      <p>${greeting}</p>
      <p>We're confirming that your BlackOWNDemand account has been successfully deleted as requested.</p>
      <p>All your personal information and data associated with your account have been permanently removed from our system.</p>
      <h3>What This Means:</h3>
      <ul>
        <li>Your profile information has been deleted</li>
        <li>Your business listings have been removed</li>
        <li>Your subscription and payment history have been deleted</li>
        <li>Your saved bookmarks have been removed</li>
      </ul>
      <p>We're sorry to see you go. If you change your mind, you're always welcome to create a new account.</p>
      <p>If you have any questions or if this was done in error, please contact our support team immediately.</p>
      <p>Thank you for being part of our community.</p>
      <p>Best regards,<br>The BlackOWNDemand Team</p>
    `;

    // Prepare email data
    const emailData = {
      to: email,
      subject: emailSubject,
      html: emailContent,
      replyTo: PRIMARY_SUPPORT_EMAIL,
      bcc: [SECONDARY_SUPPORT_EMAIL]
    };

    console.log('Processing account deletion email for:', email);

    // Send email using the email service
    const result = await sendEmailViaService(emailData);

    if (!result.success) {
      throw new Error('Failed to send account deletion email via service');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deletion email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing account deletion email:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to send account deletion email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});