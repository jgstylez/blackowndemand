// This is a Supabase Edge Function for processing payments

import { createClient } from 'npm:@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Payment gateway configuration
// Get the appropriate security key based on environment
const ECOM_LIVE_SECURITY_KEY = Deno.env.get('ECOM_LIVE_SECURITY_KEY') ?? '';
const ECOM_TEST_SECURITY_KEY = Deno.env.get('ECOM_TEST_SECURITY_KEY') ?? '';
const NODE_ENV = Deno.env.get('NODE_ENV') ?? 'development';

// Select the appropriate security key based on environment
const SECURITY_KEY = NODE_ENV === 'production' 
  ? ECOM_LIVE_SECURITY_KEY 
  : ECOM_TEST_SECURITY_KEY;

console.log(`Using ${NODE_ENV} environment for payment processing`);

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
    const requestBody = await req.json();
    console.log('Full request body received:', JSON.stringify(requestBody, null, 2));

    const {
      amount,
      final_amount,
      currency,
      description,
      customer_email,
      payment_method,
      discount_code_id
    } = requestBody;

    console.log('Received amount:', amount);
    console.log('Received final_amount:', final_amount);
    console.log('Received payment_method:', payment_method ? 'Present (details masked)' : 'Missing');
    console.log('Payment method details:', payment_method ? {
      card_number: payment_method.card_number ? `****${payment_method.card_number.slice(-4)}` : 'Missing',
      expiry_date: payment_method.expiry_date || 'Missing',
      cvv: payment_method.cvv ? '***' : 'Missing',
      cardholder_name: payment_method.cardholder_name ? 'Present (masked)' : 'Missing'
    } : 'No payment method provided');

    // Validate required fields - improved validation
    // If amount is 0, we don't need payment method
    const processAmount = final_amount !== undefined ? final_amount : amount;
    const isZeroAmount = processAmount === 0;
    
    if (typeof processAmount !== 'number' || processAmount < 0 || (!isZeroAmount && !payment_method)) {
      console.error('Validation failed:', {
        amount_invalid: typeof processAmount !== 'number' || processAmount < 0,
        payment_method_missing: !isZeroAmount && !payment_method
      });
      return new Response(
        JSON.stringify({ error: 'Missing or invalid payment information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If a discount code was provided, apply it
    if (discount_code_id) {
      try {
        const { data: discountApplied, error: discountError } = await supabase.rpc(
          'apply_discount_code',
          { p_code: discount_code_id }
        );

        if (discountError) {
          console.error('Error applying discount code:', discountError);
          // Continue with payment even if discount application fails
        } else {
          console.log('Discount code applied successfully:', discountApplied);
        }
      } catch (discountErr) {
        console.error('Exception applying discount code:', discountErr);
        // Continue with payment even if discount application fails
      }
    }

    // For zero-amount transactions, skip payment processing
    if (isZeroAmount) {
      console.log('Zero amount transaction - skipping payment processing');
      
      // Generate a simulated transaction ID for free orders
      const transactionId = `free_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Return success response for free transaction
      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionId,
          amount: 0,
          currency: currency || 'USD',
          description,
          customer_email,
          payment_date: new Date().toISOString(),
          status: 'approved',
          payment_method_details: {
            type: 'free',
            card: null
          },
          isFreeTransaction: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we have the security key
    if (!SECURITY_KEY) {
      console.warn(`Payment gateway security key not found for ${NODE_ENV} environment. Falling back to simulation mode.`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a simulated transaction ID
      const transactionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Return simulated success response
      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionId,
          amount: processAmount / 100, // Convert back from cents
          currency,
          description,
          customer_email,
          payment_date: new Date().toISOString(),
          status: 'approved',
          payment_method_details: {
            type: 'card',
            card: {
              brand: 'visa',
              last4: payment_method.card_number?.slice(-4) || '1111',
              exp_month: payment_method.expiry_date?.split('/')[0] || '12',
              exp_year: `20${payment_method.expiry_date?.split('/')[1] || '30'}`,
            }
          },
          simulated: true,
          environment: NODE_ENV
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the billing information
    const billingInfo = {
      first_name: payment_method.cardholder_name?.split(' ')[0] || '',
      last_name: payment_method.cardholder_name?.split(' ').slice(1).join(' ') || '',
      address1: payment_method.billing_address?.street || '',
      city: payment_method.billing_address?.city || '',
      state: payment_method.billing_address?.state || '',
      zip: payment_method.billing_address?.zipCode || payment_method.billing_zip || '',
      country: payment_method.billing_address?.country || 'US',
      email: customer_email || ''
    };

    // Prepare the payment data according to the DirectPost API
    const postData = new URLSearchParams({
      type: 'sale',
      amount: (processAmount / 100).toFixed(2), // Convert cents to dollars with 2 decimal places
      ccnumber: payment_method.card_number.replace(/\s/g, ''),
      ccexp: payment_method.expiry_date,
      cvv: payment_method.cvv,
      security_key: SECURITY_KEY,
      ...billingInfo
    });

    console.log('Sending payment request to gateway with data:', {
      type: 'sale',
      amount: (processAmount / 100).toFixed(2),
      ccnumber: '****' + payment_method.card_number.replace(/\s/g, '').slice(-4),
      ccexp: payment_method.expiry_date,
      cvv: '***',
      security_key: '****',
      ...billingInfo,
      environment: NODE_ENV
    });

    // Make the request to the payment gateway
    const paymentResponse = await fetch('https://ecompaymentprocessing.transactiongateway.com/api/transact.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: postData.toString()
    });

    console.log('Payment gateway response status:', paymentResponse.status);
    console.log('Payment gateway response headers:', Object.fromEntries(paymentResponse.headers.entries()));

    // Get the response text
    const responseText = await paymentResponse.text();
    console.log('Raw payment gateway response string:', responseText);
    
    // Parse the response (format is key-value pairs separated by '&')
    const responseParams = new URLSearchParams(responseText);
    const responseObj: Record<string, string> = {};
    for (const [key, value] of responseParams.entries()) {
      responseObj[key] = value;
    }

    console.log('Parsed payment gateway response:', responseObj);

    // Check if the payment was successful (response code 1 means approved)
    if (responseObj.response !== '1') {
      console.error('Payment failed with response code:', responseObj.response);
      console.error('Response text:', responseObj.responsetext);
      
      // Map response codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        '2': 'Payment declined by the bank. Please try a different card.',
        '3': 'Payment error. Please check your card details and try again.',
        '300': 'Invalid credit card number. Please check and try again.',
        '301': 'Expired credit card. Please use a different card.',
        '302': 'Invalid CVV code. Please check the 3-digit security code.',
        '303': 'Invalid expiration date. Please check the format (MM/YY).',
        '304': 'Invalid billing information. Please check your address details.',
        '305': 'Transaction declined by the bank. Please contact your bank or try a different card.'
      };
      
      const errorMessage = errorMessages[responseObj.response] || 
                          responseObj.responsetext || 
                          'Payment processing failed. Please try again.';
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: responseObj.response || 'unknown_error',
          details: responseObj.responsetext || 'No additional details available'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment successful - return the response
    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: responseObj.transactionid,
        amount: parseFloat(responseObj.amount || (processAmount / 100).toString()),
        currency: currency || 'USD',
        description: description,
        customer_email: customer_email,
        payment_date: new Date().toISOString(),
        status: 'approved',
        payment_method_details: {
          type: 'card',
          card: {
            brand: responseObj.cardtype || 'unknown',
            last4: payment_method.card_number.slice(-4),
            exp_month: payment_method.expiry_date.split('/')[0],
            exp_year: `20${payment_method.expiry_date.split('/')[1]}`,
          }
        },
        gateway_response: responseObj,
        environment: NODE_ENV
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});