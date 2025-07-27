import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface TagRequest {
  id: string;
  name: string;
  category?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  requested_by?: string;
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  requester_email?: string;
}

export const TagRequestManagement: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<TagRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tag_requests")
        .select(
          `
          *,
          profiles!tag_requests_requested_by_fkey(email)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const requestsWithEmail =
        data?.map((request) => ({
          ...request,
          requester_email: request.profiles?.email,
        })) || [];

      setPendingRequests(requestsWithEmail);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tag_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // Refresh the list
      fetchPendingRequests();
      alert(
        "Tag request approved! The tag will be added to the enum in the next code update."
      );
    } catch (error: any) {
      console.error("Error approving request:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const rejectRequest = async (requestId: string, reason: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tag_requests")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq("id", requestId);

      if (error) throw error;

      fetchPendingRequests();
      alert("Tag request rejected.");
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Tag Request Management</h2>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-gray-400">No pending tag requests</div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="p-4 border border-gray-700 rounded-lg bg-gray-800"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-white text-lg">
                    {request.name}
                  </h4>
                  {request.category && (
                    <p className="text-sm text-gray-300">
                      Category: {request.category}
                    </p>
                  )}
                  {request.description && (
                    <p className="text-sm text-gray-400 mt-1">
                      {request.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Requested by: {request.requester_email}</p>
                    <p>
                      Date: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => approveRequest(request.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Rejection reason:");
                      if (reason) rejectRequest(request.id, reason);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
