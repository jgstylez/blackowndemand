
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Business {
  id: string;
  name: string;
  city?: string;
  state?: string;
  category?: string;
  description: string;
  isVerified: boolean;
  isFeatured: boolean;
}

const useUserBookmarks = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select(`
          business_id,
          businesses (
            id,
            name,
            city,
            state,
            category,
            description,
            is_verified,
            is_featured
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Transform database results to match Business interface
      const transformedBookmarks: Business[] = (data || [])
        .filter(bookmark => bookmark.businesses)
        .map(bookmark => {
          const business = bookmark.businesses as any;
          return {
            id: business.id,
            name: business.name,
            city: business.city || undefined,
            state: business.state || undefined,
            category: business.category || undefined,
            description: business.description || '',
            isVerified: business.is_verified || false,
            isFeatured: business.is_featured || false,
          };
        });

      setBookmarks(transformedBookmarks);
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error);
      setError(error.message || 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (businessId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('business_id', businessId);

      if (error) throw error;

      // Update local state
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== businessId));
    } catch (error: any) {
      console.error('Error removing bookmark:', error);
      setError(error.message || 'Failed to remove bookmark');
    }
  };

  return {
    bookmarks,
    loading,
    error,
    refetch: fetchBookmarks,
    removeBookmark,
  };
};

export default useUserBookmarks;
