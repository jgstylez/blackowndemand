import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  Crown,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import BusinessCard from "../components/business/BusinessCard";
import BusinessCTA from "../components/common/BusinessCTA";
import {
  Business,
  BusinessCategory,
  BusinessCategoryLabels,
  BusinessTag,
  BusinessTagLabels,
} from "../types";
import { supabase } from "../lib/supabase";
import Select from "react-select";
import debounce from "lodash/debounce";
import { logError } from "../lib/errorLogger";
import useErrorHandler from "../hooks/useErrorHandler";
import ErrorFallback from "../components/common/ErrorFallback";

const ITEMS_PER_PAGE_OPTIONS = [12, 48, 96, 120];
const DEFAULT_ITEMS_PER_PAGE = 12;
const MAX_SHOW_ALL_LIMIT = 500; // Prevent performance issues

interface FilterState {
  category: BusinessCategory | null;
  location: string;
  tags: BusinessTag[];
  priceRange: [number, number] | null;
}

const BrowsePage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  // Improved category parameter handling
  const categoryParam = searchParams.get("category");
  const initialCategory = categoryParam
    ? // Try to find matching category by label or enum value
      (Object.entries(BusinessCategoryLabels).find(
        ([key, label]) =>
          label.toLowerCase() ===
            decodeURIComponent(categoryParam).toLowerCase() ||
          key.toLowerCase() === categoryParam.toLowerCase()
      )?.[0] as BusinessCategory) || null
    : null;

  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    location: "",
    tags: [],
    priceRange: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [showAll, setShowAll] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { error, handleError, clearError } = useErrorHandler({
    context: "BrowsePage",
    defaultMessage: "Failed to load businesses",
  });

  // Debounced search function with improved error handling
  const debouncedSearch = useCallback(
    debounce(
      async (
        term: string,
        filters: FilterState,
        page: number,
        perPage: number,
        showAllItems: boolean
      ) => {
        try {
          setLoading(true);
          clearError();
          console.log("🔍 Browse page query starting...");
          console.log("Search term:", term);
          console.log("Filters:", filters);
          console.log(
            "Page:",
            page,
            "Per page:",
            perPage,
            "Show all:",
            showAllItems
          );

          // Calculate offset for pagination
          const offset = (page - 1) * perPage;

          // Use the RPC function to get businesses with plan details
          const { data, error } = await supabase.rpc(
            "get_businesses_with_plan_details",
            {
              p_is_active: true,
              p_search_term: term && term.trim() ? term.trim() : undefined,
              p_category: filters.category
                ? BusinessCategoryLabels[filters.category]
                : undefined,
              p_location:
                filters.location && filters.location.trim()
                  ? filters.location.trim()
                  : undefined,
              p_limit: showAllItems ? MAX_SHOW_ALL_LIMIT : perPage,
              p_offset: offset,
            }
          );

          if (error) {
            console.error("❌ Query error:", error);
            throw new Error(`Search failed: ${error.message}`);
          }

          // Get total count from the first result
          const count = data && data.length > 0 ? data[0].total_count : 0;

          console.log("📋 Query results:", data?.length, "businesses");
          console.log("📋 Total count:", count);

          setBusinesses((data || []) as unknown as Business[]);
          setTotalCount(count || 0);
        } catch (err) {
          handleError(err, {
            defaultMessage: "Failed to fetch businesses. Please try again.",
          });
          setBusinesses([]);
          setTotalCount(0);
        } finally {
          setLoading(false);
        }
      },
      300
    ),
    [handleError, clearError]
  );

  useEffect(() => {
    debouncedSearch(searchTerm, filters, currentPage, itemsPerPage, showAll);
    return () => debouncedSearch.cancel();
  }, [
    searchTerm,
    filters,
    currentPage,
    itemsPerPage,
    showAll,
    debouncedSearch,
  ]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    clearError(); // Clear any previous errors
  };

  const clearFilters = () => {
    setFilters({
      category: null,
      location: "",
      tags: [],
      priceRange: null,
    });
    setCurrentPage(1);
    clearError();
  };

  const handleItemsPerPageChange = (newItemsPerPage: number | "all") => {
    if (newItemsPerPage === "all") {
      setShowAll(true);
      setItemsPerPage(DEFAULT_ITEMS_PER_PAGE); // Keep a default for when switching back
    } else {
      setShowAll(false);
      setItemsPerPage(newItemsPerPage);
    }
    setCurrentPage(1);
  };

  const totalPages = showAll ? 1 : Math.ceil(totalCount / itemsPerPage);
  const displayedBusinesses = showAll ? businesses : businesses;

  // Generate pagination numbers with proper logic to avoid duplicates
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range if we're near the beginning or end
      if (currentPage <= 3) {
        start = 2;
        end = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2);
        end = totalPages - 1;
      }

      // Add ellipsis if there's a gap after first page
      if (start > 2) {
        pages.push("...");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if there's a gap before last page
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page (if it's not already included)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Prepare meta description based on search/filters
  const getMetaDescription = () => {
    let description = "Discover Black-owned businesses worldwide. ";

    if (searchTerm) {
      description += `Search results for "${searchTerm}". `;
    }

    if (filters.category) {
      description += `Browse Black-owned ${
        BusinessCategoryLabels[filters.category]
      } businesses. `;
    }

    if (filters.location) {
      description += `Find Black-owned businesses in ${filters.location}. `;
    }

    return (
      description +
      "Connect with talented Black professionals and businesses on BlackOWNDemand."
    );
  };

  // Prepare meta title based on search/filters
  const getMetaTitle = () => {
    let title = "Browse Black-Owned Businesses";

    if (searchTerm) {
      title = `"${searchTerm}" - Search Results`;
    } else if (filters.category) {
      title = `${BusinessCategoryLabels[filters.category]} Businesses`;
    }

    if (filters.location) {
      title += ` in ${filters.location}`;
    }

    return `${title} | BlackOWNDemand`;
  };

  // Sort categories alphabetically by label
  const sortedCategoryOptions = Object.entries(BusinessCategoryLabels)
    .map(([value, label]) => ({ value: value as BusinessCategory, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Layout
      title={getMetaTitle()}
      description={getMetaDescription()}
      url="/browse"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Discover Black-owned businesses worldwide.
          </h1>
          <p className="text-xl text-gray-400">
            Connect with talented Black professionals and businesses across
            every industry.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex gap-4 items-center mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  clearError();
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                aria-label="Search businesses"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-white hover:bg-gray-800 transition-colors relative"
              aria-expanded={showFilters}
              aria-label="Toggle filters"
            >
              <Filter className="h-5 w-5" />
              {Object.values(filters).some(
                (value) =>
                  value !== null &&
                  value !== "" &&
                  (Array.isArray(value) ? value.length > 0 : true)
              ) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-900 rounded-lg p-6 mb-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-white transition-colors text-sm flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <Select
                    value={
                      filters.category
                        ? {
                            value: filters.category,
                            label: BusinessCategoryLabels[filters.category],
                          }
                        : null
                    }
                    onChange={(option) =>
                      handleFilterChange("category", option?.value || null)
                    }
                    options={sortedCategoryOptions}
                    isClearable
                    placeholder="Select category"
                    classNames={{
                      control: (state) =>
                        `!bg-gray-800 !border-gray-700 !rounded-lg !text-white ${
                          state.isFocused
                            ? "!ring-2 !ring-white !border-transparent"
                            : ""
                        }`,
                      menu: () => "!bg-gray-800 !border !border-gray-700",
                      option: (state) =>
                        `!px-3 !py-2 ${
                          state.isFocused
                            ? "!bg-gray-700 !text-white"
                            : "!bg-gray-800 !text-gray-300"
                        }`,
                      singleValue: () => "!text-white",
                      placeholder: () => "!text-gray-400",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) =>
                      handleFilterChange("location", e.target.value)
                    }
                    placeholder="City, State, or Country"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                  </label>
                  <Select
                    isMulti
                    value={filters.tags.map((tag) => ({
                      value: tag,
                      label: BusinessTagLabels[tag],
                    }))}
                    onChange={(options) =>
                      handleFilterChange(
                        "tags",
                        options.map((opt) => opt.value)
                      )
                    }
                    options={Object.entries(BusinessTagLabels).map(
                      ([value, label]) => ({
                        value: value as BusinessTag,
                        label,
                      })
                    )}
                    placeholder="Select tags"
                    classNames={{
                      control: (state) =>
                        `!bg-gray-800 !border-gray-700 !rounded-lg !text-white ${
                          state.isFocused
                            ? "!ring-2 !ring-white !border-transparent"
                            : ""
                        }`,
                      menu: () => "!bg-gray-800 !border !border-gray-700",
                      option: (state) =>
                        `!px-3 !py-2 ${
                          state.isFocused
                            ? "!bg-gray-700 !text-white"
                            : "!bg-gray-800 !text-gray-300"
                        }`,
                      multiValue: () => "!bg-gray-700 !rounded",
                      multiValueLabel: () => "!text-white",
                      multiValueRemove: () =>
                        "!text-gray-300 hover:!text-white hover:!bg-gray-600",
                      placeholder: () => "!text-gray-400",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results header with pagination controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="text-gray-400">
              {loading ? (
                "Loading..."
              ) : error ? (
                <span className="text-red-400">Error loading results</span>
              ) : (
                <>
                  Showing{" "}
                  {showAll
                    ? Math.min(businesses.length, MAX_SHOW_ALL_LIMIT)
                    : Math.min(itemsPerPage, businesses.length)}{" "}
                  of {totalCount} businesses
                  {searchTerm && ` for "${searchTerm}"`}
                  {filters.category &&
                    ` in ${BusinessCategoryLabels[filters.category]}`}
                  {showAll && totalCount > MAX_SHOW_ALL_LIMIT && (
                    <span className="text-yellow-400 text-sm block">
                      (Limited to {MAX_SHOW_ALL_LIMIT} for performance)
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Grid className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={showAll ? "all" : itemsPerPage}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleItemsPerPageChange(
                      value === "all" ? "all" : parseInt(value)
                    );
                  }}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <ErrorFallback
            error={error}
            resetErrorBoundary={() => {
              clearError();
              debouncedSearch(
                searchTerm,
                filters,
                currentPage,
                itemsPerPage,
                showAll
              );
            }}
          />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-900 rounded-lg overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-gray-800" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-4 bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No businesses found</p>
            <p className="text-gray-500 text-sm mb-4">
              Try adjusting your search terms or filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayedBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business as any} />
              ))}
            </div>

            {/* Pagination - only show if not showing all */}
            {!showAll && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex gap-2">
                  {generatePaginationNumbers().map((pageNum, index) => (
                    <React.Fragment key={index}>
                      {pageNum === "..." ? (
                        <span className="w-10 h-10 flex items-center justify-center text-gray-400">
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => setCurrentPage(pageNum as number)}
                          className={`w-10 h-10 rounded-lg ${
                            currentPage === pageNum
                              ? "bg-white text-black"
                              : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                          }`}
                          aria-label={`Page ${pageNum}`}
                          aria-current={
                            currentPage === pageNum ? "page" : undefined
                          }
                        >
                          {pageNum}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Show all indicator */}
            {showAll && (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">
                  Showing {businesses.length} of {totalCount} businesses
                  {totalCount > MAX_SHOW_ALL_LIMIT && (
                    <span className="text-yellow-400 block">
                      (Limited to {MAX_SHOW_ALL_LIMIT} for performance)
                    </span>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add the CTA section */}
      <BusinessCTA />
    </Layout>
  );
};

export default BrowsePage;
