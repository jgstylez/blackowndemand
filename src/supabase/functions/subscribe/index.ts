// This is a Supabase Edge Function for newsletter subscription

import { createClient } from 'npm:@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, first_name, last_name, source = 'website' } = await req.json();

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

    // Check if subscriber already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking subscriber:', checkError);
      throw new Error('Failed to check subscription status');
    }

    // If subscriber exists and is active, return success with a message
    if (existingSubscriber && existingSubscriber.status === 'active') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already subscribed',
          alreadySubscribed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If subscriber exists but is unsubscribed, reactivate them
    if (existingSubscriber) {
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          status: 'active',
          first_name: first_name || existingSubscriber.first_name,
          last_name: last_name || existingSubscriber.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscriber.id);

      if (updateError) {
        console.error('Error reactivating subscriber:', updateError);
        throw new Error('Failed to reactivate subscription');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Subscription reactivated' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new subscriber
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        first_name,
        last_name,
        status: 'active',
        source,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating subscriber:', insertError);
      throw new Error('Failed to create subscription');
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully subscribed to newsletter' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscription error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred during subscription' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});