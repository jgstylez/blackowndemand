import { useState, useEffect } from "react";
import { fetchUserBusinessAnalytics } from "../../utils/analyticsUtils";
import useErrorHandler from "../useErrorHandler";

export type BusinessAnalytics = {
  business_id: string;
  business_name: string;
  views_count: number;
  last_viewed_at: string | null;
  total_actions: number;
  total_views: number;
  total_actions_count: number;
  contact_clicks: number;
  website_clicks: number;
  phone_clicks: number;
};

interface UseBusinessAnalyticsReturn {
  analytics: BusinessAnalytics[];
  loading: boolean;
  error: any; // Changed from old format to UnifiedError format
  refetch: () => Promise<void>;
}

export const useBusinessAnalytics = (
  businessIds: string[]
): UseBusinessAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<BusinessAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const { error, handleError, clearError } = useErrorHandler({
    context: "BusinessAnalytics",
    defaultMessage: "Failed to load analytics",
  });

  const fetchAnalytics = async () => {
    if (businessIds.length === 0) {
      setAnalytics([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      clearError();

      const data = await fetchUserBusinessAnalytics(businessIds);
      // Filter out null values and transform the data
      const filteredData = data
        .filter((item) => item.business_id && item.business_name)
        .map((item) => ({
          business_id: item.business_id!,
          business_name: item.business_name!,
          views_count: item.views_count || 0,
          last_viewed_at: item.last_viewed_at,
          total_actions: item.total_actions || 0,
          total_views: item.total_views || 0,
          total_actions_count: item.total_actions_count || 0,
          contact_clicks: item.contact_clicks || 0,
          website_clicks: item.website_clicks || 0,
          phone_clicks: item.phone_clicks || 0,
        }));
      setAnalytics(filteredData);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [businessIds.join(",")]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
