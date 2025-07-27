import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Business, BusinessCategory, BusinessTag } from "../../types";

const useUserBusinesses = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform database results to match Business interface
      const transformedBusinesses: Business[] = (data || []).map(
        (business) => ({
          id: business.id,
          name: business.name,
          tagline: business.tagline || undefined,
          description: business.description || "",
          category: (business.category as BusinessCategory) || undefined,
          city: business.city || undefined,
          state: business.state || undefined,
          zip_code: business.zip_code || undefined,
          country: business.country || undefined,
          website_url: business.website_url || undefined,
          phone: business.phone || undefined,
          email: business.email || undefined,
          image_url: business.image_url || undefined,
          promo_video_url: business.promo_video_url || undefined,
          social_links: business.social_links || {},
          tags: (business.tags as BusinessTag[]) || [],
          isVerified: business.is_verified || false,
          isFeatured: business.is_featured || false,
          is_active: business.is_active !== false,
          is_claimed: business.is_claimed || false,
          claimed_at: business.claimed_at || undefined,
          subscription_id: business.subscription_id || undefined,
          subscription_status: business.subscription_status || undefined,
          plan_name: business.plan_name || undefined,
          views_count: business.views_count || 0,
          last_viewed_at: business.last_viewed_at || null,
          total_actions: business.total_actions || 0,
          created_at: business.created_at || new Date().toISOString(),
          updated_at: business.updated_at || new Date().toISOString(),
        })
      );

      setBusinesses(transformedBusinesses);
    } catch (error: any) {
      console.error("Error fetching businesses:", error);
      setError(error.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  const updateBusiness = async (
    businessId: string,
    updates: Partial<Business>
  ) => {
    if (!user) return;

    try {
      // Transform interface properties back to database format
      const dbUpdates: any = {};

      if (updates.name) dbUpdates.name = updates.name;
      if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.state !== undefined) dbUpdates.state = updates.state;
      if (updates.zip_code !== undefined) dbUpdates.zip_code = updates.zip_code;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.website_url !== undefined)
        dbUpdates.website_url = updates.website_url;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.image_url !== undefined)
        dbUpdates.image_url = updates.image_url;
      if (updates.promo_video_url !== undefined)
        dbUpdates.promo_video_url = updates.promo_video_url;
      if (updates.social_links !== undefined)
        dbUpdates.social_links = updates.social_links;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.isVerified !== undefined)
        dbUpdates.is_verified = updates.isVerified;
      if (updates.isFeatured !== undefined)
        dbUpdates.is_featured = updates.isFeatured;
      if (updates.is_active !== undefined)
        dbUpdates.is_active = updates.is_active;
      if (updates.subscription_id !== undefined)
        dbUpdates.subscription_id = updates.subscription_id;

      const { error } = await supabase
        .from("businesses")
        .update(dbUpdates)
        .eq("id", businessId)
        .eq("owner_id", user.id);

      if (error) throw error;

      // Update local state
      setBusinesses((prev) =>
        prev.map((business) =>
          business.id === businessId ? { ...business, ...updates } : business
        )
      );
    } catch (error: any) {
      console.error("Error updating business:", error);
      setError(error.message || "Failed to update business");
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", businessId)
        .eq("owner_id", user.id);

      if (error) throw error;

      // Update local state
      setBusinesses((prev) =>
        prev.filter((business) => business.id !== businessId)
      );
    } catch (error: any) {
      console.error("Error deleting business:", error);
      setError(error.message || "Failed to delete business");
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  return {
    businesses,
    loading,
    error,
    refetch: fetchBusinesses,
    updateBusiness,
    deleteBusiness,
  };
};

export default useUserBusinesses;
