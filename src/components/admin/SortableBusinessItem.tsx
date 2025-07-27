import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, X } from 'lucide-react';
import { getBusinessImageUrl } from '../../lib/supabase';

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

interface SortableBusinessItemProps {
  business: Business;
  index: number;
  onToggleFeatured: (id: string, currentStatus: boolean) => void;
  disabled: boolean;
}

const SortableBusinessItem: React.FC<SortableBusinessItemProps> = ({
  business,
  index,
  onToggleFeatured,
  disabled
}) => {
  // Debug: Log image_url for each business
  console.log('SortableBusinessItem image_url:', business.image_url);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: business.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 p-4 bg-gray-800 rounded-lg border-2 transition-all ${
        isDragging 
          ? 'border-yellow-400 shadow-lg shadow-yellow-400/20 z-10' 
          : 'border-transparent hover:border-gray-600'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex items-center justify-center w-8 h-8 bg-yellow-600 rounded-full text-white text-sm font-bold">
        {index + 1}
      </div>

      {/* Add border for visual debugging */}
      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center border border-blue-400">
        {business.image_url ? (
          <img
            src={getBusinessImageUrl(business.image_url)}
            alt={business.name}
            className="w-full h-full object-cover rounded-lg"
            style={{ border: '2px solid green' }} // Debug border
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
            }}
          />
        ) : (
          <div className="text-gray-400 text-xs text-center">No Image</div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="text-white font-semibold">{business.name}</h4>
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
        </div>
        <p className="text-gray-400 text-sm">
          {business.category} • {business.city}, {business.state}
        </p>
        <p className="text-yellow-400 text-xs">
          Position: {business.featured_position || 'Not set'}
        </p>
      </div>

      <button
        onClick={() => onToggleFeatured(business.id, true)}
        disabled={disabled}
        className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        title="Remove from featured"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SortableBusinessItem;
