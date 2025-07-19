import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface BookmarkButtonProps {
  businessId: string;
  className?: string;
  size?: number;
  showText?: boolean;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  businessId,
  className = '',
  size = 20,
  showText = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if the business is bookmarked when the component mounts
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('is_bookmarked', {
          p_business_id: businessId
        });
        
        if (error) {
          console.error('Error checking bookmark status:', error);
          return;
        }
        
        setIsBookmarked(data || false);
      } catch (err) {
        console.error('Failed to check bookmark status:', err);
      }
    };
    
    checkBookmarkStatus();
  }, [businessId, user]);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation(); // Prevent event bubbling
    
    if (!user) {
      // Redirect to login if user is not authenticated
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { data, error } = await supabase.rpc('remove_bookmark', {
          p_business_id: businessId
        });
        
        if (error) throw error;
        setIsBookmarked(false);
      } else {
        // Add bookmark
        const { data, error } = await supabase.rpc('add_bookmark', {
          p_business_id: businessId
        });
        
        if (error) throw error;
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        isBookmarked 
          ? 'text-yellow-400 hover:bg-yellow-400/10' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      } ${className}`}
      title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
      aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      <div className="flex items-center gap-1">
        {isBookmarked ? (
          <BookmarkCheck className={`h-${size/4} w-${size/4}`} />
        ) : (
          <Bookmark className={`h-${size/4} w-${size/4}`} />
        )}
        {showText && (
          <span className="text-sm">
            {isBookmarked ? 'Saved' : 'Save'}
          </span>
        )}
      </div>
    </button>
  );
};

export default BookmarkButton;