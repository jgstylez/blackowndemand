import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Users,
  Building2,
  Star,
  Crown,
  Calendar,
  MapPin,
  BarChart3,
  Activity,
  RefreshCw,
  Download,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AnalyticsData {
  totalBusinesses: number;
  verifiedBusinesses: number;
  featuredBusinesses: number;
  vipBusinesses: number;
  activeBusinesses: number;
  newBusinessesThisMonth: number;
  newBusinessesToday: number;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
  topStates: Array<{ state: string; count: number; percentage: number }>;
  businessGrowth: Array<{ date: string; count: number; cumulative: number }>;
  verificationRate: number;
  claimRate: number;
  monthlyStats: Array<{
    month: string;
    new_businesses: number;
    verified: number;
    claimed: number;
  }>;
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
  { label: "Last 6 months", value: "6m", days: 180 },
  { label: "Last year", value: "1y", days: 365 },
  { label: "All time", value: "all", days: 0 },
];

interface AnalyticsProps {
  onDataUpdate?: () => void;
}

const Analytics: React.FC<AnalyticsProps> = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState<
    "businesses" | "verification" | "geography"
  >("businesses");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const selectedRange = timeRanges.find((r) => r.value === timeRange);
      const daysAgo = selectedRange?.days || 30;
      const startDate =
        daysAgo > 0
          ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          : new Date("2020-01-01");

      // Fetch basic stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_business_stats"
      );
      if (statsError) throw statsError;

      const stats = statsData?.[0] || {};

      // Fetch businesses created in time range
      const { data: recentBusinesses, error: recentError } = await supabase
        .from("businesses")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (recentError) throw recentError;

      // Fetch all businesses for category and location analysis
      const { data: allBusinesses, error: allError } = await supabase
        .from("businesses")
        .select(
          "category, city, state, country, is_verified, migration_source, claimed_at, created_at"
        )
        .eq("is_active", true);

      if (allError) throw allError;

      // Calculate top categories
      const categoryCount = allBusinesses.reduce((acc, business) => {
        if (business.category) {
          acc[business.category] = (acc[business.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: (count / allBusinesses.length) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate top states
      const stateCount = allBusinesses.reduce((acc, business) => {
        if (business.state) {
          acc[business.state] = (acc[business.state] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topStates = Object.entries(stateCount)
        .map(([state, count]) => ({
          state,
          count,
          percentage: (count / allBusinesses.length) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate business growth over time
      const businessGrowth = [];
      let cumulative = 0;
      const groupedByDate = recentBusinesses.reduce((acc, business) => {
        if (business.created_at) {
          const date = new Date(business.created_at)
            .toISOString()
            .split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      for (const [date, count] of Object.entries(groupedByDate)) {
        cumulative += count;
        businessGrowth.push({ date, count, cumulative });
      }

      // Calculate rates
      const verifiedCount = allBusinesses.filter((b) => b.is_verified).length;
      const claimedCount = allBusinesses.filter((b) => b.claimed_at).length;
      const migrationCount = allBusinesses.filter(
        (b) => b.migration_source
      ).length;

      const verificationRate =
        allBusinesses.length > 0
          ? (verifiedCount / allBusinesses.length) * 100
          : 0;
      const claimRate =
        migrationCount > 0 ? (claimedCount / migrationCount) * 100 : 0;

      // Calculate monthly stats for the last 6 months
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthBusinesses = allBusinesses.filter((b) => {
          if (!b.created_at) return false;
          const createdAt = new Date(b.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });

        monthlyStats.push({
          month: monthStart.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          new_businesses: monthBusinesses.length,
          verified: monthBusinesses.filter((b) => b.is_verified).length,
          claimed: monthBusinesses.filter((b) => b.claimed_at).length,
        });
      }

      // Get today's new businesses
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newBusinessesToday = allBusinesses.filter(
        (b) => b.created_at && new Date(b.created_at) >= today
      ).length;

      // Get this month's new businesses
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const newBusinessesThisMonth = allBusinesses.filter(
        (b) => b.created_at && new Date(b.created_at) >= thisMonth
      ).length;

      setData({
        totalBusinesses: stats.total_businesses || 0,
        verifiedBusinesses: stats.verified_businesses || 0,
        featuredBusinesses: stats.featured_businesses || 0,
        vipBusinesses: stats.founder_businesses || 0,
        activeBusinesses: allBusinesses.length,
        newBusinessesThisMonth,
        newBusinessesToday,
        topCategories,
        topStates,
        businessGrowth,
        verificationRate,
        claimRate,
        monthlyStats,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, fetchAnalytics]);

  const exportAnalytics = async () => {
    if (!data) return;

    try {
      const csvContent = [
        ["Metric", "Value"],
        ["Total Businesses", data.totalBusinesses],
        ["Verified Businesses", data.verifiedBusinesses],
        ["Featured Businesses", data.featuredBusinesses],
        ["VIP Businesses", data.vipBusinesses],
        ["Verification Rate", `${data.verificationRate.toFixed(1)}%`],
        ["Claim Rate", `${data.claimRate.toFixed(1)}%`],
        ["New Businesses Today", data.newBusinessesToday],
        ["New Businesses This Month", data.newBusinessesThisMonth],
        [""],
        ["Top Categories", ""],
        ...data.topCategories.map((cat) => [cat.category, cat.count]),
        [""],
        ["Top States", ""],
        ...data.topStates.map((state) => [state.state, state.count]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting analytics:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-800 rounded mb-4" />
              <div className="h-8 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Failed to load analytics data</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400">
            Platform insights and business metrics
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={exportAnalytics}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Businesses</p>
              <p className="text-3xl font-bold text-white">
                {data.totalBusinesses.toLocaleString()}
              </p>
              <p className="text-green-400 text-sm mt-1">
                +{data.newBusinessesToday} today
              </p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Verified Businesses</p>
              <p className="text-3xl font-bold text-white">
                {data.verifiedBusinesses.toLocaleString()}
              </p>
              <p className="text-blue-400 text-sm mt-1">
                {data.verificationRate.toFixed(1)}% rate
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Featured Businesses</p>
              <p className="text-3xl font-bold text-white">
                {data.featuredBusinesses.toLocaleString()}
              </p>
              <p className="text-purple-400 text-sm mt-1">Premium listings</p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">VIP Members</p>
              <p className="text-3xl font-bold text-white">
                {data.vipBusinesses.toLocaleString()}
              </p>
              <p className="text-yellow-400 text-sm mt-1">
                {data.claimRate.toFixed(1)}% claimed
              </p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Growth This Month
            </h3>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">New Businesses</span>
              <span className="text-white font-medium">
                {data.newBusinessesThisMonth}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Daily Average</span>
              <span className="text-white font-medium">
                {(data.newBusinessesThisMonth / new Date().getDate()).toFixed(
                  1
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Platform Health
            </h3>
            <Activity className="h-6 w-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Active Businesses</span>
              <span className="text-white font-medium">
                {data.activeBusinesses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Verification Rate</span>
              <span className="text-green-400 font-medium">
                {data.verificationRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Engagement</h3>
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Claim Rate</span>
              <span className="text-yellow-400 font-medium">
                {data.claimRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Featured Rate</span>
              <span className="text-purple-400 font-medium">
                {(
                  (data.featuredBusinesses / data.totalBusinesses) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
        <button
          onClick={() => setSelectedMetric("businesses")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedMetric === "businesses"
              ? "bg-white text-black"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Business Growth
        </button>
        <button
          onClick={() => setSelectedMetric("verification")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedMetric === "verification"
              ? "bg-white text-black"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Monthly Trends
        </button>
        <button
          onClick={() => setSelectedMetric("geography")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedMetric === "geography"
              ? "bg-white text-black"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Categories & Locations
        </button>
      </div>

      {/* Dynamic Content Based on Selected Metric */}
      {selectedMetric === "businesses" && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Business Growth Over Time
          </h3>
          {data.businessGrowth.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {data.businessGrowth.length}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Days with new businesses
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {Math.max(...data.businessGrowth.map((d) => d.count))}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Peak daily registrations
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {(
                      data.businessGrowth.reduce((sum, d) => sum + d.count, 0) /
                      data.businessGrowth.length
                    ).toFixed(1)}
                  </p>
                  <p className="text-gray-400 text-sm">Average per day</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Recent growth pattern shows{" "}
                {data.businessGrowth
                  .slice(-7)
                  .reduce((sum, d) => sum + d.count, 0)}{" "}
                new businesses in the last 7 days.
              </div>
            </div>
          ) : (
            <p className="text-gray-400">
              No growth data available for the selected time range.
            </p>
          )}
        </div>
      )}

      {selectedMetric === "verification" && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Monthly Trends
          </h3>
          <div className="space-y-4">
            {data.monthlyStats.map((month, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-white font-medium">{month.month}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-white font-medium">
                      {month.new_businesses}
                    </p>
                    <p className="text-gray-400">New</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-400 font-medium">
                      {month.verified}
                    </p>
                    <p className="text-gray-400">Verified</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-400 font-medium">
                      {month.claimed}
                    </p>
                    <p className="text-gray-400">Claimed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMetric === "geography" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Categories
            </h3>
            <div className="space-y-3">
              {data.topCategories.slice(0, 8).map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-white">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{category.count}</p>
                    <p className="text-gray-400 text-sm">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top States
            </h3>
            <div className="space-y-3">
              {data.topStates.slice(0, 8).map((state, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{state.state}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{state.count}</p>
                    <p className="text-gray-400 text-sm">
                      {state.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
