import { supabase } from "../lib/supabase";

// Function to record business action
export const recordBusinessAction = async (
  businessId: string,
  actionType:
    | "contact_click"
    | "website_click"
    | "phone_click"
    | "email_click"
    | "social_click",
  actionData?: any
) => {
  try {
    // Get current user if available
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Record the action in business_actions table
    const { error: actionError } = await supabase
      .from("business_actions")
      .insert({
        business_id: businessId,
        action_type: actionType,
        action_data: actionData,
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
      });

    if (actionError) {
      console.error("Error recording business action:", actionError);
      return;
    }

    // Update the cached total_actions count in businesses table
    const { error: updateError } = await supabase.rpc(
      "increment_business_actions" as any,
      { business_id: businessId }
    );

    if (updateError) {
      console.error("Error updating business action count:", updateError);
    }
  } catch (error) {
    console.error("Error recording business action:", error);
  }
};

// Function to track website clicks
export const trackWebsiteClick = async (
  businessId: string,
  websiteUrl: string
) => {
  await recordBusinessAction(businessId, "website_click", {
    website_url: websiteUrl,
  });
};

// Function to track phone clicks
export const trackPhoneClick = async (
  businessId: string,
  phoneNumber: string
) => {
  await recordBusinessAction(businessId, "phone_click", {
    phone_number: phoneNumber,
  });
};

// Function to track email clicks
export const trackEmailClick = async (
  businessId: string,
  emailAddress: string
) => {
  await recordBusinessAction(businessId, "email_click", {
    email_address: emailAddress,
  });
};

// Function to track social media clicks
export const trackSocialClick = async (
  businessId: string,
  platform: string,
  socialUrl: string
) => {
  await recordBusinessAction(businessId, "social_click", {
    platform: platform,
    social_url: socialUrl,
  });
};

// Function to track general contact clicks
export const trackContactClick = async (
  businessId: string,
  contactType: string
) => {
  await recordBusinessAction(businessId, "contact_click", {
    contact_type: contactType,
  });
};

// Function to fetch business analytics
export const fetchBusinessAnalytics = async (businessId: string) => {
  try {
    const { data, error } = await supabase
      .from("business_analytics")
      .select("*")
      .eq("business_id", businessId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching business analytics:", error);
    return null;
  }
};

// Function to fetch analytics for all user businesses
export const fetchUserBusinessAnalytics = async (businessIds: string[]) => {
  try {
    if (businessIds.length === 0) return [];

    // First, get basic business data with analytics fields
    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, name, views_count, last_viewed_at, total_actions")
      .in("id", businessIds);

    if (businessesError) throw businessesError;

    // Transform to match BusinessAnalytics interface
    const analytics =
      businesses?.map((business) => ({
        business_id: business.id,
        business_name: business.name,
        views_count: business.views_count || 0,
        last_viewed_at: business.last_viewed_at,
        total_actions: business.total_actions || 0,
        total_views: business.views_count || 0,
        total_actions_count: business.total_actions || 0,
        contact_clicks: 0, // Will be calculated from business_actions table
        website_clicks: 0, // Will be calculated from business_actions table
        phone_clicks: 0, // Will be calculated from business_actions table
      })) || [];

    return analytics;
  } catch (error) {
    console.error("Error fetching user business analytics:", error);
    return [];
  }
};
