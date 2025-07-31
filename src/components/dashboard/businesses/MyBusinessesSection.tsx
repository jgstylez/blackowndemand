import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Crown,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
} from "lucide-react";
import { Business } from "../../../types";
import InlineBusinessEdit from "./InlineBusinessEdit";
import { supabase } from "../../../lib/supabase";
import DeactivateBusinessModal from "./DeactivateBusinessModal";

interface MyBusinessesSectionProps {
  businesses: Business[];
  incompleteBusinesses: Business[];
  loading: boolean;
  hasBusinesses: boolean;
  onDeleteBusiness: (businessId: string) => Promise<boolean>;
  onDeactivateBusiness: (businessId: string) => Promise<boolean>;
  onReactivateBusiness: (businessId: string) => Promise<boolean>;
  onContinueListing: (business: Business) => void;
  onBusinessUpdated?: () => void;
}

const MyBusinessesSection: React.FC<MyBusinessesSectionProps> = ({
  businesses,
  incompleteBusinesses,
  loading,
  hasBusinesses,
  onDeleteBusiness,
  onDeactivateBusiness,
  onReactivateBusiness,
  onContinueListing,
  onBusinessUpdated,
}) => {
  const navigate = useNavigate();
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(
    null
  );
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Add state for deactivation modal
  const [deactivateModal, setDeactivateModal] = useState<{
    isOpen: boolean;
    businessId: string | null;
    businessName: string;
  }>({
    isOpen: false,
    businessId: null,
    businessName: "",
  });
  const [deactivating, setDeactivating] = useState(false);

  const handleEditClick = (business: Business) => {
    setEditingBusinessId(business.id);
  };

  const handleViewClick = (businessId: string) => {
    navigate(`/business/${businessId}`);
  };

  // Add specific debugging for promo video in handleSaveEdit
  const handleSaveEdit = async (businessData: Partial<Business>) => {
    try {
      if (!editingBusinessId) {
        throw new Error("No business selected for editing");
      }

      console.log("🔍 handleSaveEdit received data:", businessData);

      // Transform businessData to match database schema
      const dbUpdates: any = {
        name: businessData.name,
        tagline: businessData.tagline,
        description: businessData.description,
        category: businessData.category,
        website_url: businessData.website_url,
        phone: businessData.phone,
        email: businessData.email,
        city: businessData.city,
        state: businessData.state,
        zip_code: businessData.zip_code,
        country: businessData.country,
        tags: businessData.tags
          ? businessData.tags.map((tag: any) =>
              typeof tag === "string" ? tag : tag.value
            )
          : null,
        promo_video_url: businessData.promo_video_url,
        social_links: businessData.social_links,
        image_url: businessData.image_url,
        business_hours: businessData.business_hours,
        updated_at: new Date().toISOString(),
      };

      console.log("🔍 Database updates:", dbUpdates);

      // Update the business in the database
      const { data, error } = await supabase
        .from("businesses")
        .update(dbUpdates)
        .eq("id", editingBusinessId)
        .select()
        .single();

      if (error) {
        console.error("🔍 Database update error:", error);

        // Provide more specific error messages
        if (error.code === "42501") {
          throw new Error(
            "Permission denied. You can only edit your own businesses."
          );
        } else if (error.code === "23505") {
          throw new Error("A business with this information already exists.");
        } else if (error.message.includes("RLS")) {
          throw new Error("Access denied. Please try logging out and back in.");
        } else {
          throw new Error(`Failed to update business: ${error.message}`);
        }
      }

      console.log("🔍 Database update successful:", data);

      // Close the edit form
      setEditingBusinessId(null);

      // Trigger refetch to get updated data
      if (onBusinessUpdated) {
        onBusinessUpdated();
      }

      // Show success message instead of reloading
      // You can add a toast notification here
      console.log("Business updated successfully!");

      // Trigger a refetch of the businesses data to get the latest
      // This will be handled by the parent component that uses useUserBusinesses
      setUpdateSuccess("Business updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating business:", err);
      throw err;
    }
  };

  const handleCancelEdit = () => {
    setEditingBusinessId(null);
  };

  const handleDeactivateClick = (businessId: string, businessName: string) => {
    setDeactivateModal({
      isOpen: true,
      businessId,
      businessName,
    });
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateModal.businessId) return;

    try {
      setDeactivating(true);
      const success = await onDeactivateBusiness(deactivateModal.businessId);

      if (success) {
        setUpdateSuccess(
          `"${deactivateModal.businessName}" has been deactivated and is now hidden from the directory.`
        );
        // Clear success message after 5 seconds
        setTimeout(() => setUpdateSuccess(null), 5000);
      }
    } catch (error) {
      console.error("Error deactivating business:", error);
    } finally {
      setDeactivating(false);
      setDeactivateModal({ isOpen: false, businessId: null, businessName: "" });
    }
  };

  const handleDeactivateCancel = () => {
    setDeactivateModal({ isOpen: false, businessId: null, businessName: "" });
  };

  // Add reactivation handler
  const handleReactivateClick = async (
    businessId: string,
    businessName: string
  ) => {
    try {
      const success = await onReactivateBusiness(businessId);
      if (success) {
        setUpdateSuccess(
          `"${businessName}" has been reactivated and is now visible in the directory.`
        );
        setTimeout(() => setUpdateSuccess(null), 5000);
      }
    } catch (error) {
      console.error("Error reactivating business:", error);
    }
  };

  // Separate active and inactive businesses
  const activeBusinesses = businesses.filter(
    (business) => business.is_active !== false
  );
  const inactiveBusinesses = businesses.filter(
    (business) => business.is_active === false
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <div className="h-6 bg-gray-800 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-800 rounded w-1/4" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-800 rounded" />
                <div className="w-10 h-10 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {updateSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{updateSuccess}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">My Businesses</h2>
        <button
          onClick={() => navigate("/pricing")}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Business
        </button>
      </div>

      {/* Incomplete Businesses Section */}
      {incompleteBusinesses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            Incomplete Listings
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {incompleteBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-white break-words">
                        {business.name === "Pending Business Listing"
                          ? "Complete Your Business Listing"
                          : business.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Incomplete
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2 break-words">
                      You've started the process of listing your business.
                      Complete your listing to make it visible in our directory.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>
                        Plan: {business.subscription_plans || "Basic"}
                      </span>
                      <span>•</span>
                      <span>
                        Created:{" "}
                        {new Date(business.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {/* Action Buttons - Updated to match subscription section */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t sm:border-t-0 border-gray-800">
                    {/* Left side - Complete Listing */}
                    <button
                      onClick={() => onContinueListing(business)}
                      className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Complete Listing
                    </button>

                    {/* Right side - Delete button */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                      <button
                        onClick={() => onDeleteBusiness(business.id)}
                        className="flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Business
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Businesses Section */}
      {activeBusinesses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-400" />
            Active Businesses
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {activeBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800"
              >
                {editingBusinessId === business.id ? (
                  <InlineBusinessEdit
                    business={business}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <>
                    {/* Business name and badges inline */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-white break-words">
                        {business.name}
                      </h3>
                      {business.isVerified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                      {business.subscription_plans === "VIP Plan" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-400/20 text-yellow-400">
                          <Crown className="h-3 w-3 mr-1" />
                          VIP
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-4 break-words">
                      {business.tagline}
                    </p>

                    {business.category && (
                      <span className="w-full sm:w-auto text-gray-500">
                        {business.category}
                      </span>
                    )}

                    {/* Location details spanning full width on bottom */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-gray-500">
                      {business.city && business.state && (
                        <span className="w-full sm:w-auto">
                          {business.city}, {business.state}
                        </span>
                      )}

                      {business.subscription_plans && (
                        <span className="w-full sm:w-auto">
                          Plan: {business.subscription_plans}
                        </span>
                      )}
                    </div>
                  </>
                )}
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t sm:border-t-0 border-gray-800">
                  {/* Left side - View Business button */}
                  <button
                    onClick={() => handleViewClick(business.id)}
                    className="flex items-center justify-center px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 border border-gray-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Business
                  </button>

                  {/* Right side - Edit and Deactivate buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleEditClick(business)}
                      className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Business
                    </button>
                    <button
                      onClick={() =>
                        handleDeactivateClick(business.id, business.name)
                      }
                      className="flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Businesses Section */}
      {inactiveBusinesses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-gray-400" />
            Deactivated Businesses
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {inactiveBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 relative"
              >
                {/* Deactivated Badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600/50 text-gray-300 border border-gray-600/50">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Deactivated
                  </span>
                </div>

                {/* Business Info - Dimmed */}
                <div className="opacity-60">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-300 break-words">
                          {business.name}
                        </h3>
                      </div>
                      <p className="text-gray-500 mb-2 break-words">
                        {business.description || "No description available"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span>
                          Category: {business.category || "Uncategorized"}
                        </span>
                        <span>•</span>
                        <span>
                          Location: {business.city}, {business.state}
                        </span>
                        <span>•</span>
                        <span>
                          Plan: {business.subscription_plans || "Basic"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Inactive Business */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t sm:border-t-0 border-gray-700/50">
                  {/* Left side - View Business button */}
                  <button
                    onClick={() => handleViewClick(business.id)}
                    className="flex items-center justify-center px-4 py-2.5 bg-gray-800/50 text-gray-400 rounded-lg hover:bg-gray-700/50 hover:text-gray-300 transition-all duration-200 border border-gray-700/50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Business
                  </button>

                  {/* Right side - Edit and Reactivate buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleEditClick(business)}
                      className="flex items-center justify-center px-4 py-2.5 bg-blue-600/50 text-blue-300 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Business
                    </button>
                    <button
                      onClick={() =>
                        handleReactivateClick(business.id, business.name)
                      }
                      className="flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Reactivate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasBusinesses && !incompleteBusinesses.length && (
        <div className="mb-8">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Building2 className="h-12 w-12 text-gray-600" />
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-white mb-2">
                  List Your Business
                </h3>
                <p className="text-gray-400 mb-4">
                  Join hundreds of Black-owned businesses on our platform. Get
                  discovered by customers looking for your services.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate("/pricing")}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    List Your Business
                  </button>
                  <button
                    onClick={() => navigate("/claim-business")}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  >
                    Claim Existing Business
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      <DeactivateBusinessModal
        isOpen={deactivateModal.isOpen}
        onClose={handleDeactivateCancel}
        onConfirm={handleDeactivateConfirm}
        businessName={deactivateModal.businessName}
        loading={deactivating}
      />
    </div>
  );
};

export default MyBusinessesSection;
