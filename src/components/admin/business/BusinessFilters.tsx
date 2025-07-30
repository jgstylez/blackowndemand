import React from "react";
import { Search } from "lucide-react";

interface BusinessFiltersProps {
  searchTerm: string;
  filter: string;
  sortBy: string;
  selectedBusinesses: string[];
  businesses: any[];
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
  onBulkAction: (action: string) => void;
  toggleSelectAll: () => void;
}

const BusinessFilters: React.FC<BusinessFiltersProps> = ({
  searchTerm,
  filter,
  sortBy,
  selectedBusinesses,
  businesses,
  onSearchChange,
  onFilterChange,
  onSortChange,

  onBulkAction,
  toggleSelectAll,
}) => {
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        >
          <option value="all">All Businesses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="featured">Featured</option>
          <option value="members">VIP Members</option>
          <option value="unclaimed">Unclaimed</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="category">By Category</option>
        </select>
      </div>

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
                onClick={() => onBulkAction("verify")}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                Verify
              </button>
              <button
                onClick={() => onBulkAction("feature")}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
              >
                Feature
              </button>
              <button
                onClick={() => onBulkAction("activate")}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => onBulkAction("deactivate")}
                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => onBulkAction("delete")}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg mt-6">
        <input
          type="checkbox"
          checked={
            selectedBusinesses.length === businesses.length &&
            businesses.length > 0
          }
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-white focus:ring-white"
        />
        <span className="text-white text-sm">
          Select All ({businesses.length} businesses)
        </span>
      </div>
    </>
  );
};

export default BusinessFilters;
