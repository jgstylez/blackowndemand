import React, { useState, useEffect, useCallback, useRef } from "react";
import { Download, RefreshCw, Building2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

import useErrorHandler from "../../hooks/useErrorHandler";
import ErrorFallback from "../common/ErrorFallback";
import BusinessStatsCards from "./business/BusinessStatsCards";
import BusinessFilters from "./business/BusinessFilters";
import BusinessListItem from "./business/BusinessListItem";
import PaginationControls from "../common/PaginationControls";

interface Business {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  city: string;
  state: string;
  country: string;
  website_url: string;
  phone: string;
  email: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  migration_source: string;
  claimed_at: string;
  vip_member?: any;
}

type BusinessFilter =
  | "all"
  | "verified"
  | "unverified"
  | "featured"
  | "members"
  | "unclaimed"
  | "inactive";
type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "category";

interface BusinessManagementProps {
  onBusinessUpdate?: () => void;
}

const BusinessManagement: React.FC<BusinessManagementProps> = ({
  onBusinessUpdate,
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<BusinessFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Reduced from 20 to 12
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    featured: 0,
    members: 0,
    unclaimed: 0,
    inactive: 0,
  });

  const { error, handleError, clearError } = useErrorHandler({
    context: "BusinessManagement",
    defaultMessage: "Failed to manage businesses",
  });

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_business_stats");
      if (error) throw error;

      if (data && data.length > 0) {
        setStats({
          total: data[0].total_businesses || 0,
          verified: data[0].verified_businesses || 0,
          featured: data[0].featured_businesses || 0,
          members: data[0].founder_businesses || 0,
          unclaimed: data[0].unclaimed_businesses || 0,
          inactive: data[0].inactive_businesses || 0,
        });
      }
    } catch (err) {
      // Move error handling outside the callback
      console.error("Failed to fetch stats:", err);
    }
  }, []); // Now has no dependencies

  const fetchBusinesses = useCallback(async () => {
    if (!mounted.current) return; // Add mounted check

    try {
      setLoading(true);
      clearError();

      let query = supabase.from("businesses").select(
        `
          *
        `,
        { count: "exact" }
      );

      // Apply filters
      switch (filter) {
        case "verified":
          query = query.eq("is_verified", true);
          break;
        case "unverified":
          query = query.eq("is_verified", false);
          break;
        case "featured":
          query = query
            .eq("is_featured", true)
            .order("featured_position", { ascending: true, nullsFirst: false });
          break;
        case "members":
          query = query.not("vip_member", "is", null);
          break;
        case "unclaimed":
          query = query
            .not("migration_source", "is", null)
            .is("claimed_at", null);
          break;
        case "inactive":
          query = query.eq("is_active", false);
          break;
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`
          name.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%,
          description.ilike.%${searchTerm}%,
          category.ilike.%${searchTerm}%
        `);
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "name_desc":
          query = query.order("name", { ascending: false });
          break;
        case "category":
          query = query
            .order("category", { ascending: true })
            .order("name", { ascending: true });
          break;
      }

      // Apply pagination
      const start = (currentPage - 1) * itemsPerPage;
      query = query.range(start, start + itemsPerPage - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setBusinesses(
        (data || []).map((b: any) => ({
          ...b,
          tagline: b.tagline ?? "",
          name: b.name ?? "",
          description: b.description ?? "",
          category: b.category ?? "",
          city: b.city ?? "",
          state: b.state ?? "",
          country: b.country ?? "",
          website_url: b.website_url ?? "",
          phone: b.phone ?? "",
          email: b.email ?? "",
          image_url: b.image_url ?? "",
          migration_source: b.migration_source ?? "",
          claimed_at: b.claimed_at ?? "",
          owner_id: b.owner_id ?? "",
          created_at: b.created_at ?? "",
          updated_at: b.updated_at ?? "",
          // Add other fields as needed to ensure non-null values
        }))
      );
      setTotalCount(count || 0);
    } catch (err) {
      if (mounted.current) {
        handleError(err, { defaultMessage: "Failed to fetch businesses" });
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [
    searchTerm,
    filter,
    sortBy,
    currentPage,
    itemsPerPage,
    // Remove handleError and clearError from dependencies
  ]); // Only depend on search/filter/pagination params

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleBusinessAction = async (action: string, businessId: string) => {
    try {
      setLoading(true);
      clearError();

      switch (action) {
        case "verify":
          await supabase
            .from("businesses")
            .update({ is_verified: true })
            .eq("id", businessId);
          break;
        case "unverify":
          await supabase
            .from("businesses")
            .update({ is_verified: false })
            .eq("id", businessId);
          break;
        case "feature":
          await supabase
            .from("businesses")
            .update({ is_featured: true })
            .eq("id", businessId);
          break;
        case "unfeature":
          await supabase
            .from("businesses")
            .update({ is_featured: false })
            .eq("id", businessId);
          break;
        case "activate":
          await supabase
            .from("businesses")
            .update({ is_active: true })
            .eq("id", businessId);
          break;
        case "deactivate":
          await supabase
            .from("businesses")
            .update({ is_active: false })
            .eq("id", businessId);
          break;
        case "delete":
          if (
            window.confirm(
              "Are you sure you want to delete this business? This action cannot be undone."
            )
          ) {
            await supabase.from("businesses").delete().eq("id", businessId);
          }
          break;
      }

      // Refresh data
      fetchBusinesses();
      fetchStats();
      onBusinessUpdate?.();
    } catch (err) {
      handleError(err, { defaultMessage: `Failed to ${action} business` });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBusinesses.length === 0) return;

    let confirmMessage = `Are you sure you want to ${action} ${selectedBusinesses.length} businesses?`;

    // Add specific warnings for destructive actions
    if (action === "delete") {
      confirmMessage = `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${selectedBusinesses.length} businesses? This action cannot be undone and will remove all business data, including subscriptions and analytics.`;
    } else if (action === "deactivate") {
      confirmMessage = `Are you sure you want to deactivate ${selectedBusinesses.length} businesses? They will be hidden from the directory but can be reactivated later.`;
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      clearError();

      for (const businessId of selectedBusinesses) {
        await handleBusinessAction(action, businessId);
      }

      setSelectedBusinesses([]);
    } catch (err) {
      handleError(err, { defaultMessage: `Failed to perform bulk ${action}` });
    } finally {
      setLoading(false);
    }
  };

  const exportBusinesses = async () => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .csv();

      if (error) throw error;

      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `businesses-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      handleError(err, { defaultMessage: "Failed to export businesses" });
    } finally {
      setLoading(false);
    }
  };

  const toggleBusinessSelection = (businessId: string) => {
    setSelectedBusinesses((prev) =>
      prev.includes(businessId)
        ? prev.filter((id) => id !== businessId)
        : [...prev, businessId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedBusinesses(
      selectedBusinesses.length === businesses.length
        ? []
        : businesses.map((b) => b.id)
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // If there's an error, show the error fallback
  if (error && !loading) {
    return <ErrorFallback error={error} resetErrorBoundary={fetchBusinesses} />;
  }

  // Extract business list rendering logic
  let businessListContent: React.ReactNode;
  if (loading) {
    businessListContent = (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-800 rounded-lg" />
              <div className="flex-grow space-y-3">
                <div className="h-6 bg-gray-800 rounded w-1/3" />
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (businesses.length === 0) {
    businessListContent = (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No businesses found</p>
      </div>
    );
  } else {
    businessListContent = (
      <div className="space-y-4">
        {businesses.map((business) => (
          <BusinessListItem
            key={business.id}
            business={business}
            selectedBusinesses={selectedBusinesses}
            toggleBusinessSelection={toggleBusinessSelection}
            showActions={showActions}
            setShowActions={setShowActions}
            handleBusinessAction={handleBusinessAction}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Management</h2>
          <p className="text-gray-400">
            Manage business listings and verification status
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportBusinesses}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              fetchBusinesses();
              fetchStats();
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <BusinessStatsCards stats={stats} />

      {/* Filters and Search */}
      <BusinessFilters
        searchTerm={searchTerm}
        filter={filter}
        sortBy={sortBy}
        selectedBusinesses={selectedBusinesses}
        businesses={businesses}
        onSearchChange={setSearchTerm}
        onFilterChange={(value) => {
          setFilter(value as BusinessFilter);
          setCurrentPage(1);
        }}
        onSortChange={(value) => {
          setSortBy(value as SortOption);
          setCurrentPage(1);
        }}
        onClearFilters={() => {
          setSearchTerm("");
          setFilter("all");
          setSortBy("newest");
          setCurrentPage(1);
        }}
        onBulkAction={handleBulkAction}
        toggleSelectAll={toggleSelectAll}
      />

      {/* Bulk Actions */}
      {selectedBusinesses.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-white">
              {selectedBusinesses.length} business
              {selectedBusinesses.length !== 1 ? "es" : ""} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("verify")}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                Verify
              </button>
              <button
                onClick={() => handleBulkAction("feature")}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
              >
                Feature
              </button>
              <button
                onClick={() => handleBulkAction("activate")}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business List */}
      {businessListContent}

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
};

export default BusinessManagement;
