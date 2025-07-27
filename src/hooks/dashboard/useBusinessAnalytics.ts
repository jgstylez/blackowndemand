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
  error: {
    hasError: boolean;
    message: string | null;
    details: any;
  };
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
      setAnalytics(data);
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
