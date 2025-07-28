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
} from "lucide-react";
import { Business } from "../../../types";
import InlineBusinessEdit from "./InlineBusinessEdit";
import { supabase } from "../../../lib/supabase";

interface MyBusinessesSectionProps {
  businesses: Business[];
  incompleteBusinesses: Business[];
  loading: boolean;
  hasBusinesses: boolean;
  onDeleteBusiness: (businessId: string) => Promise<boolean>;
  onContinueListing: (business: Business) => void;
  onBusinessUpdated?: () => void; // Add this prop
}

const MyBusinessesSection: React.FC<MyBusinessesSectionProps> = ({
  businesses,
  incompleteBusinesses,
  loading,
  hasBusinesses,
  onDeleteBusiness,
  onContinueListing,
  onBusinessUpdated, // Add this prop
}) => {
  const navigate = useNavigate();
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(
    null
  );
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

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
      {updateSuccess && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center">
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
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {business.name === "Pending Business Listing"
                          ? "Complete Your Business Listing"
                          : business.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Incomplete
                      </span>
                    </div>
                    <p className="text-gray-400 mb-4">
                      You've started the process of listing your business.
                      Complete your listing to make it visible in our directory.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onContinueListing(business)}
                      className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      Complete Listing
                    </button>
                    <button
                      onClick={() => onDeleteBusiness(business.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Businesses - Simplified without subscription management */}
      {businesses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {businesses.map((business) => (
            <div key={business.id}>
              {editingBusinessId === business.id ? (
                <InlineBusinessEdit
                  business={business}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-white">
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
                      <p className="text-gray-400 text-sm mb-4">
                        {business.tagline}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {business.city && business.state && (
                          <span>
                            {business.city}, {business.state}
                          </span>
                        )}
                        {business.category && (
                          <>
                            <span>•</span>
                            <span>{business.category}</span>
                          </>
                        )}
                        {business.subscription_plans && (
                          <>
                            <span>•</span>
                            <span>Plan: {business.subscription_plans}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewClick(business.id)}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        title="View business page"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(business)}
                        className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                        title="Edit business"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDeleteBusiness(business.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Delete business"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

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
    </div>
  );
};

export default MyBusinessesSection;
