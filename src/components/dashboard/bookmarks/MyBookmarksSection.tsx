import React from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Trash2, CheckCircle, Crown, Eye } from "lucide-react";
import { Business } from "../../../types";
import { getBusinessImageUrl } from "../../../lib/supabase";

interface MyBookmarksSectionProps {
  bookmarkedBusinesses: Business[];
  loading: boolean;
  onRemoveBookmark: (businessId: string) => Promise<boolean>;
}

const MyBookmarksSection: React.FC<MyBookmarksSectionProps> = ({
  bookmarkedBusinesses,
  loading,
  onRemoveBookmark,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-800 rounded-lg" />
              <div className="flex-grow space-y-3">
                <div className="h-5 bg-gray-800 rounded w-1/3" />
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">My Bookmarks</h2>
      </div>

      {bookmarkedBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {bookmarkedBusinesses.map((business) => (
            <div
              key={business.id}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getBusinessImageUrl(business.image_url)}
                    alt={business.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg";
                    }}
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-white break-words">
                          {business.name}
                        </h3>
                        {business.isVerified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        )}
                        {business.subscription_plans === "VIP Plan" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-400/20 text-yellow-400">
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-2 break-words">
                        {business.tagline}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {business.category && <span>{business.category}</span>}
                        {business.city && business.state && (
                          <>
                            <span>•</span>
                            <span>
                              {business.city}, {business.state}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Using same style as other dashboard sections */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t sm:border-t-0 border-gray-800">
                    {/* Left side - View Business button */}
                    <button
                      onClick={() => navigate(`/business/${business.id}`)}
                      className="flex items-center justify-center px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 border border-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Business
                    </button>

                    {/* Right side - Remove Bookmark button */}
                    <button
                      onClick={() => onRemoveBookmark(business.id)}
                      className="flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Bookmark
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bookmark className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No bookmarks yet
          </h3>
          <p className="text-gray-400 mb-6">
            You haven't bookmarked any businesses yet. Browse the directory and
            save businesses you're interested in.
          </p>
          <button
            onClick={() => navigate("/browse")}
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            Browse Businesses
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBookmarksSection;
