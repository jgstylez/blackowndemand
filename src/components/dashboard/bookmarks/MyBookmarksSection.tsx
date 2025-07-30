import React from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Trash2, CheckCircle, Crown } from "lucide-react";
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
            <div key={business.id} className="bg-gray-900 rounded-xl p-6">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-white">
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
                      <p className="text-gray-400 text-sm mb-2">
                        {business.tagline}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {business.category && (
                          <>
                            <span>{business.category}</span>
                          </>
                        )}
                        {business.city && business.state && (
                          <span>
                            • &nbsp;&nbsp; {business.city}, {business.state}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/business/${business.id}`)}
                        className="px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onRemoveBookmark(business.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
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
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            Browse Businesses
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBookmarksSection;
