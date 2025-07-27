import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Loader2, Star, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import SortableBusinessItem from "./SortableBusinessItem";

interface Business {
  id: string;
  name: string;
  category: string;
  is_featured: boolean;
  featured_position: number | null;
  image_url: string | null;
  city: string;
  state: string;
}

const FeaturedBusinessManagement: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch featured businesses ordered by position
      const { data: featuredData, error: featuredError } = await supabase
        .from("businesses")
        .select(
          "id, name, category, is_featured, featured_position, image_url, city, state"
        )
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("featured_position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (featuredError) throw featuredError;

      // Fetch all non-featured businesses for adding new ones
      const { data: allData, error: allError } = await supabase
        .from("businesses")
        .select(
          "id, name, category, is_featured, featured_position, image_url, city, state"
        )
        .eq("is_active", true)
        .order("name");

      if (allError) throw allError;

      setBusinesses((featuredData as any) || []);
      setAllBusinesses((allData as any) || []);
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = businesses.findIndex(
      (business) => business.id === active.id
    );
    const newIndex = businesses.findIndex(
      (business) => business.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) return;

    setUpdating(true);
    setError(null); // Clear previous errors

    try {
      console.log("🔍 Starting drag reorder:", {
        oldIndex,
        newIndex,
        activeId: active.id,
        overId: over.id,
      });

      // Create new array with reordered items
      const newBusinesses = [...businesses];
      const [movedItem] = newBusinesses.splice(oldIndex, 1);
      newBusinesses.splice(newIndex, 0, movedItem);

      // Assign sequential featured_position values (1, 2, 3, ...)
      const updatedBusinesses = newBusinesses.map((business, index) => ({
        ...business,
        featured_position: index + 1,
      }));

      console.log(
        "🔍 Updated positions:",
        updatedBusinesses.map((b) => ({
          id: b.id,
          name: b.name,
          position: b.featured_position,
        }))
      );

      // Batch update all positions in database using Promise.all
      const updatePromises = updatedBusinesses.map((business) =>
        supabase
          .from("businesses")
          .update({ featured_position: business.featured_position })
          .eq("id", business.id)
      );

      const updateResults = await Promise.all(updatePromises);

      // Check for any errors in the batch update
      const errors = updateResults.filter((res) => res.error);
      if (errors.length > 0) {
        console.error("❌ Error(s) updating business positions:", errors);
        const errorMessages = errors.map((e) => e.error?.message).join(", ");
        setError(`Failed to update some business positions: ${errorMessages}`);
        return;
      }

      // Update local state immediately for better UX
      setBusinesses(updatedBusinesses);

      console.log("✅ Featured business positions updated successfully");

      // Optional: Re-fetch to confirm persistence
      // await fetchBusinesses();
    } catch (err: any) {
      console.error("❌ Error updating business positions:", err);
      setError(err.message || "Failed to update business positions");
    } finally {
      setUpdating(false);
    }
  };

  const toggleFeaturedStatus = async (
    businessId: string,
    currentStatus: boolean
  ) => {
    setUpdating(true);
    try {
      if (currentStatus) {
        // Remove from featured
        const { error } = await supabase
          .from("businesses")
          .update({
            is_featured: false,
            featured_position: null,
          })
          .eq("id", businessId);

        if (error) throw error;
      } else {
        // Add to featured with next position
        const maxPosition = Math.max(
          ...businesses.map((b) => b.featured_position || 0)
        );
        const newPosition = maxPosition + 1;

        const { error } = await supabase
          .from("businesses")
          .update({
            is_featured: true,
            featured_position: newPosition,
          })
          .eq("id", businessId);

        if (error) throw error;
      }

      await fetchBusinesses();
    } catch (err: any) {
      console.error("Error toggling featured status:", err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Star className="h-6 w-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">
          Featured Business Management
        </h2>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Featured Businesses ({businesses.length})
          </h3>
          {updating && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Updating positions...</span>
            </div>
          )}
        </div>

        {businesses.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No featured businesses yet. Add some businesses to get started.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={businesses.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {businesses.map((business, index) => (
                  <SortableBusinessItem
                    key={business.id}
                    business={business}
                    index={index}
                    onToggleFeatured={toggleFeaturedStatus}
                    disabled={updating}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default FeaturedBusinessManagement;
