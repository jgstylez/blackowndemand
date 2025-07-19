import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logError } from '../lib/errorLogger';
import useErrorHandler from './useErrorHandler';

interface BusinessDetails {
  business: any | null;
  businessImages: any[];
  similarBusinesses: any[];
  loading: boolean;
  error: {
    hasError: boolean;
    message: string | null;
    details: any;
  };
  clearError: () => void;
}

export const useBusinessDetails = (id: string | undefined): BusinessDetails => {
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessImages, setBusinessImages] = useState<any[]>([]);
  const [similarBusinesses, setSimilarBusinesses] = useState<any[]>([]);
  
  const { error, handleError, clearError } = useErrorHandler({
    context: 'BusinessDetailPage',
    defaultMessage: 'Failed to load business details'
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        setLoading(true);
        clearError();
        
        // Use the RPC function to get business details
        const { data, error } = await supabase.rpc('get_businesses_with_plan_details', {
          p_business_id: id
        });

        if (error) throw error;
        
        if (!data || data.length === 0) {
          throw new Error('Business not found');
        }
        
        setBusiness(data[0]);

        // Fetch actual business images from business_images table
        const { data: images, error: imagesError } = await supabase
          .from('business_images')
          .select('*')
          .eq('business_id', id)
          .order('created_at', { ascending: true });

        if (imagesError) {
          logError('Failed to fetch business images', {
            context: 'BusinessDetailPage',
            metadata: { businessId: id, error: imagesError }
          });
        } else if (images) {
          setBusinessImages(images);
        }

        // Fetch similar businesses
        if (data[0]?.category) {
          const { data: similar, error: similarError } = await supabase.rpc('get_businesses_with_plan_details', {
            p_category: data[0].category,
            p_is_active: true,
            p_limit: 4
          });

          if (similarError) {
            logError('Failed to fetch similar businesses', {
              context: 'BusinessDetailPage',
              metadata: { businessId: id, category: data[0].category, error: similarError }
            });
          } else {
            // Filter out the current business
            const filteredSimilar = similar?.filter(b => b.id !== id) || [];
            setSimilarBusinesses(filteredSimilar);
          }
        }
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id, handleError, clearError]);

  return {
    business,
    businessImages,
    similarBusinesses,
    loading,
    error,
    clearError
  };
};

export default useBusinessDetails;