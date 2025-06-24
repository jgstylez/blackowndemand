// This is a Supabase Edge Function for generating newsletter content with AI
// In a real implementation, this would connect to an AI service like OpenAI

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
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { prompt, type } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real implementation, this would call an AI service like OpenAI
    // For now, we'll simulate AI generation with predefined templates
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let generatedContent = '';
    let generatedTitle = '';
    
    // Generate content based on type
    if (type === 'news') {
      generatedTitle = generateNewsTitle(prompt);
      generatedContent = generateNewsContent(prompt);
    } else if (type === 'business') {
      generatedTitle = 'Business Spotlight';
      generatedContent = generateBusinessContent(prompt);
    } else if (type === 'referral') {
      generatedTitle = 'Share with Friends';
      generatedContent = generateReferralContent(prompt);
    } else {
      generatedContent = generateGenericContent(prompt);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        title: generatedTitle,
        content: generatedContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating content:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions to generate content
function generateNewsTitle(prompt: string): string {
  const titles = [
    "Breaking: Black Entrepreneurs Lead Tech Innovation Wave",
    "New Study Shows Growth in Black-Owned Business Success Rates",
    "Community Spotlight: How Black Businesses Are Transforming Local Economies",
    "The Rise of Black Excellence in E-Commerce",
    "Black Business Month Celebrations Reach Record Participation"
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
}

function generateNewsContent(prompt: string): string {
  return `In an exciting development for the Black business community, a recent surge in entrepreneurship has caught the attention of industry analysts. Black-owned businesses are growing at an unprecedented rate, with a 28% increase in new business formations compared to last year.

"We're seeing a renaissance of Black entrepreneurship," says economic analyst Maya Johnson. "The combination of increased access to capital, mentorship programs, and digital platforms has created a perfect environment for success."

This trend is particularly notable in the tech and e-commerce sectors, where Black entreprenuers are creating innovative solutions to long-standing problems. From fintech to health tech, these entrepreneurs are not just building businesses—they're building legacies.

What makes this growth even more impressive is that it's happening despite ongoing challenges in securing traditional funding. Many entreprenuers are leveraging community support, crowdfunding, and specialized grant programs designed to address historical inequities in business financing.`;
}

function generateBusinessContent(prompt: string): string {
  return `This week, we're shining a spotlight on an exceptional Black-owned business that's making waves in their industry. Founded with a vision to create products that celebrate cultural heritage while embracing modern design, this company has quickly become a customer favorite.

What sets them apart is their commitment to quality and community. Not only do they create outstanding products, but they also reinvest in their community through mentorship programs and local hiring initiatives.

Their journey hasn't been without challenges, but their perseverance and innovative approach have helped them overcome obstacles and build a loyal customer base that spans across the country.

Visit their website to explore their unique offerings and support a business that's truly making a difference.`;
}

function generateReferralContent(prompt: string): string {
  return `Love our newsletter? Share it with friends and family who would appreciate staying connected with the Black business community!

When you refer friends to our newsletter, you're helping to:
• Amplify Black voices and businesses
• Connect entrepreneurs with potential customers
• Spread awareness about economic opportunities
• Strengthen our community bonds

Use the buttons below to share this newsletter on your favorite social platforms. Together, we can build a stronger network of support for Black-owned businesses everywhere.`;
}

function generateGenericContent(prompt: string): string {
  return `The Black business community continues to show remarkable resilience and innovation in today's economic landscape. With each passing month, we're seeing new success stories emerge across various industries.

From retail to technology, food service to professional consulting, Black entrepreneurs are creating jobs, building wealth, and transforming communities. This growth isn't just good for individual business owners—it strengthens the entire economic ecosystem.

As we look toward the future, there's every reason to be optimistic. With increasing access to resources, mentorship, and capital, Black-owned businesses are positioned for continued growth and success.

Stay tuned for more updates, success stories, and opportunities to support the thriving Black business community.`;
}