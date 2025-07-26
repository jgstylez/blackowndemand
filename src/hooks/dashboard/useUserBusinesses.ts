
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Business {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  category?: string;
  city?: string;
  state?: string;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  tags?: string[];
}

const useUserBusinesses = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database results to match Business interface
      const transformedBusinesses: Business[] = (data || []).map(business => ({
        id: business.id,
        name: business.name,
        tagline: business.tagline || undefined,
        description: business.description || '',
        category: business.category || undefined,
        city: business.city || undefined,
        state: business.state || undefined,
        isVerified: business.is_verified || false,
        isFeatured: business.is_featured || false,
        isActive: business.is_active !== false,
        tags: business.tags || undefined,
      }));

      setBusinesses(transformedBusinesses);
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      setError(error.message || 'Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  };

  const updateBusiness = async (businessId: string, updates: Partial<Business>) => {
    if (!user) return;

    try {
      // Transform interface properties back to database format
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.state !== undefined) dbUpdates.state = updates.state;
      if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified;
      if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

      const { error } = await supabase
        .from('businesses')
        .update(dbUpdates)
        .eq('id', businessId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Update local state
      setBusinesses(prev => prev.map(business => 
        business.id === businessId ? { ...business, ...updates } : business
      ));
    } catch (error: any) {
      console.error('Error updating business:', error);
      setError(error.message || 'Failed to update business');
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Update local state
      setBusinesses(prev => prev.filter(business => business.id !== businessId));
    } catch (error: any) {
      console.error('Error deleting business:', error);
      setError(error.message || 'Failed to delete business');
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  return {
    businesses,
    loading,
    error,
    refetch: fetchBusinesses,
    updateBusiness,
    deleteBusiness,
  };
};

export default useUserBusinesses;
