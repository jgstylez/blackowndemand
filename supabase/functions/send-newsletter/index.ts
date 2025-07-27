// This is a Supabase Edge Function for sending newsletters
// In a real implementation, this would connect to an email service provider

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { newsletterId, testEmail } = await req.json();

    if (!newsletterId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: newsletterId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get newsletter data
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletter_issues')
      .select('*')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      return new Response(
        JSON.stringify({ error: 'Newsletter not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get newsletter content items
    const { data: contentItems, error: contentError } = await supabase
      .from('newsletter_content_items')
      .select('*')
      .eq('newsletter_id', newsletterId)
      .order('position');

    if (contentError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch newsletter content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If this is a test send, only send to the test email
    if (testEmail) {
      console.log(`Sending test newsletter from ${PRIMARY_SUPPORT_EMAIL} to ${testEmail}`);
      
      // In a real implementation, this would connect to an email service
      // For now, we'll just simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Test newsletter sent to ${testEmail}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For a real send, get all active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('email, first_name, last_name')
      .eq('status', 'active');

    if (subscribersError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscribers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real implementation, this would batch send emails to all subscribers
    // For now, we'll just simulate sending
    console.log(`Sending newsletter from ${PRIMARY_SUPPORT_EMAIL} to ${subscribers.length} subscribers`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update newsletter status to sent
    const { error: updateError } = await supabase
      .from('newsletter_issues')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update newsletter status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last_sent_at for all subscribers
    await supabase
      .from('newsletter_subscribers')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('status', 'active');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Newsletter sent to ${subscribers.length} subscribers` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending newsletter:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});