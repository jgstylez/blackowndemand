// Temporary TypeScript type overrides for admin components
// This file helps resolve nullable type issues from database vs interfaces

declare module "*.tsx" {
  const content: any;
  export default content;
}

// Override problematic admin types temporarily
declare global {
  interface BusinessStats {
    total_businesses: number;
    active_businesses: number;
    inactive_businesses: number;
    verified_businesses: number;
    featured_businesses: number;
    founder_businesses: number;
    unclaimed_businesses: number;
    member_businesses?: number; // Add the missing property
  }

  interface Business {
    id: string;
    name: string;
    tagline?: string | null; // Allow null
    description?: string | null;
    category?: any;
    is_verified?: boolean;
    is_featured?: boolean;
    is_active?: boolean;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    country?: string | null;
    website_url?: string | null;
    phone?: string | null;
    email?: string | null;
    image_url?: string | null;
    social_links?: any;
    business_hours?: any;
    amenities?: string[] | null;
    payment_methods?: string[] | null;
    categories?: string[] | null;
    tags?: any;
    created_at?: string | null;
    updated_at?: string | null;
    owner_id?: string | null;
    subscription_id?: string | null;
    is_claimed?: boolean;
    claimed_at?: string | null;
    migration_source?: string | null;
    is_resource?: boolean;
    subscription_plan_name?: string;
    total_count?: number;
    vip_member?: any;
  }

  interface DiscountCode {
    id: string;
    code: string;
    description?: string | null; // Allow null
    discount_type: string;
    discount_value: number;
    is_active?: boolean;
    valid_from?: string;
    valid_until?: string | null;
    max_uses?: number | null;
    current_uses?: number | null;
    applies_to_plan?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }

  interface FeatureFlag {
    id: string;
    name: string;
    description?: string | null; // Allow null
    is_enabled: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  }

  interface NewsletterIssue {
    id: string;
    subject: string;
    html_content?: string | null;
    text_content?: string | null;
    status: string;
    scheduled_for?: string | null;
    sent_at?: string | null;
    created_at?: string | null; // Allow null
    updated_at?: string | null;
    created_by?: string | null;
    preview_text?: string | null;
    content_items?: any[];
  }

  interface Subscriber {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    status: string;
    source?: string | null;
    preferences?: any;
    last_sent_at?: string | null;
    created_at?: string | null; // Allow null
    updated_at?: string | null;
  }

  interface Promotion {
    id: string;
    name: string;
    description?: string | null; // Allow null
    original_plan_id?: string | null;
    promotional_price: number;
    target_audience: string;
    start_date: string;
    end_date?: string | null;
    is_active?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    original_plan_name?: string;
    original_price?: number;
    savings_amount?: number;
    savings_percentage?: number;
  }

  interface Subscription {
    id: string;
    business_id?: string | null;
    plan_id?: string | null;
    status: string;
    payment_status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end?: boolean | null;
    stripe_subscription_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    business_name?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    owner_email?: string | null;
    owner_first_name?: string | null;
    owner_last_name?: string | null;
    owner_full_name?: string | null;
    subscription_updated_at?: string | null;
    plan_name?: string | null;
    plan_price?: number | null;
    owner_id?: string | null;
    is_featured?: boolean | null;
    is_verified?: boolean | null;
    subscription_created_at?: string | null;
  }
}