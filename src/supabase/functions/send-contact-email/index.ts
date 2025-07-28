// This is a Supabase Edge Function for sending contact form emails

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
  
  console.log('Contact email would be sent with the following data:', {
    from: PRIMARY_SUPPORT_EMAIL, // IMPORTANT: Always use verified email as the "From" address
    to: emailData.to,
    subject: emailData.subject,
    replyTo: emailData.replyTo, // User's email goes here
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
    const { name, email, category, subject, message, service } = await req.json();

    if (!email || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and message are required' }),
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

    // Prepare email content
    const emailSubject = subject || (service ? `Sales Inquiry: ${service}` : 'Contact Form Submission');
    
    const emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name || 'Not provided'} (${email})</p>
      ${category ? `<p><strong>Category:</strong> ${category}</p>` : ''}
      ${service ? `<p><strong>Service:</strong> ${service}</p>` : ''}
      <p><strong>Subject:</strong> ${subject || 'Not provided'}</p>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    // Prepare email data
    const emailData = {
      to: PRIMARY_SUPPORT_EMAIL,
      subject: emailSubject,
      html: emailContent,
      replyTo: email, // Set the user's email as the Reply-To address
      bcc: [SECONDARY_SUPPORT_EMAIL]
    };

    console.log('Processing contact form submission:', {
      from: PRIMARY_SUPPORT_EMAIL, // IMPORTANT: Always use verified email as the "From" address
      to: PRIMARY_SUPPORT_EMAIL,
      replyTo: email,
      name: name || 'Not provided',
      category: category || 'Not provided',
      service: service || 'Not provided',
      subject: emailSubject
    });

    // Send email using the email service
    const result = await sendEmailViaService(emailData);

    if (!result.success) {
      throw new Error('Failed to send contact email via service');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Contact email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing contact form:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to send contact email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});