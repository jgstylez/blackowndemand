import React from "react";
import {
  TrendingUp,
  Eye,
  MousePointer,
  Phone,
  Mail,
  Globe,
  Share2,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";
import { BusinessAnalytics } from "../../../hooks/dashboard/useBusinessAnalytics";

interface BusinessAnalyticsSectionProps {
  analytics: BusinessAnalytics[];
  loading: boolean;
  hasBusinesses: boolean;
}

const BusinessAnalyticsSection: React.FC<BusinessAnalyticsSectionProps> = ({
  analytics,
  loading,
  hasBusinesses,
}) => {
  if (!hasBusinesses) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          No Analytics Available
        </h3>
        <p className="text-gray-400">
          Analytics will appear here once you have active business listings.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-800 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate totals across all businesses
  const totalViews = analytics.reduce(
    (sum, item) => sum + (item.total_views || 0),
    0
  );
  const totalActions = analytics.reduce(
    (sum, item) => sum + (item.total_actions_count || 0),
    0
  );
  const totalWebsiteClicks = analytics.reduce(
    (sum, item) => sum + (item.website_clicks || 0),
    0
  );
  const totalPhoneClicks = analytics.reduce(
    (sum, item) => sum + (item.phone_clicks || 0),
    0
  );
  const totalContactClicks = analytics.reduce(
    (sum, item) => sum + (item.contact_clicks || 0),
    0
  );

  const engagementRate =
    totalViews > 0 ? ((totalActions / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Business Analytics</h2>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-3xl font-bold text-white">
                {totalViews.toLocaleString()}
              </p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Actions</p>
              <p className="text-3xl font-bold text-white">
                {totalActions.toLocaleString()}
              </p>
            </div>
            <MousePointer className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Engagement Rate</p>
              <p className="text-3xl font-bold text-white">{engagementRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Businesses</p>
              <p className="text-3xl font-bold text-white">
                {analytics.length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Contact Actions
            </h3>
            <Phone className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Website Clicks</span>
              <span className="text-white font-medium">
                {totalWebsiteClicks}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone Clicks</span>
              <span className="text-white font-medium">{totalPhoneClicks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Other Contacts</span>
              <span className="text-white font-medium">
                {totalContactClicks}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Performance</h3>
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg. Views/Business</span>
              <span className="text-white font-medium">
                {analytics.length > 0
                  ? Math.round(totalViews / analytics.length)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg. Actions/Business</span>
              <span className="text-white font-medium">
                {analytics.length > 0
                  ? Math.round(totalActions / analytics.length)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-white font-medium">{engagementRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Recent Activity
            </h3>
            <Calendar className="h-6 w-6 text-purple-500" />
          </div>
          <div className="space-y-3">
            {analytics
              .filter((item) => item.last_viewed_at)
              .sort(
                (a, b) =>
                  new Date(b.last_viewed_at!).getTime() -
                  new Date(a.last_viewed_at!).getTime()
              )
              .slice(0, 3)
              .map((item) => (
                <div key={item.business_id} className="flex justify-between">
                  <span className="text-gray-400 truncate">
                    {item.business_name}
                  </span>
                  <span className="text-white font-medium text-sm">
                    {new Date(item.last_viewed_at!).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Individual Business Analytics */}
      {analytics.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Business Performance
          </h3>
          <div className="space-y-4">
            {analytics.map((item) => (
              <div
                key={item.business_id}
                className="border-b border-gray-800 pb-4 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">
                    {item.business_name}
                  </h4>
                  <div className="text-sm text-gray-400">
                    {item.last_viewed_at && (
                      <span>
                        Last viewed:{" "}
                        {new Date(item.last_viewed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Views:</span>
                    <span className="text-white ml-2">
                      {item.total_views || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Actions:</span>
                    <span className="text-white ml-2">
                      {item.total_actions_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Website:</span>
                    <span className="text-white ml-2">
                      {item.website_clicks || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white ml-2">
                      {item.phone_clicks || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalyticsSection;
