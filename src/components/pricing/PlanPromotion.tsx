import React, { useState, useEffect } from 'react';
import { Clock, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlanPromotionProps {
  planName: string;
  regularPrice: number;
  className?: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  original_plan_id: string;
  original_plan_name: string;
  original_price: number;
  promotional_price: number;
  start_date: string;
  end_date: string | null;
  savings_amount: number;
  savings_percentage: number;
}

const PlanPromotion: React.FC<PlanPromotionProps> = ({ planName, regularPrice, className = '' }) => {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetchPromotion();
  }, [planName]);

  useEffect(() => {
    if (promotion?.end_date) {
      const timer = setInterval(() => {
        updateTimeRemaining();
      }, 1000 * 60); // Update every minute
      
      updateTimeRemaining();
      
      return () => clearInterval(timer);
    }
  }, [promotion]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_active_promotion_for_plan', {
        plan_name: planName
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPromotion(data[0]);
      } else {
        setPromotion(null);
      }
    } catch (err) {
      console.error('Error fetching promotion:', err);
      setPromotion(null);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (!promotion?.end_date) return;
    
    const endDate = new Date(promotion.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    
    if (diffTime <= 0) {
      setTimeRemaining('Expired');
      return;
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const diffMonths = Math.floor(diffDays / 30);
      setTimeRemaining(`${diffMonths} month${diffMonths !== 1 ? 's' : ''} left`);
    } else {
      setTimeRemaining(`${diffDays} day${diffDays !== 1 ? 's' : ''} left`);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className={className}>
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-white">${(regularPrice / 12).toFixed(0)}</span>
          <span className="text-gray-400 ml-2">/month</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">(billed annually at ${regularPrice})</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="inline-flex items-center px-3 py-1 bg-yellow-400/20 rounded-full text-yellow-400 text-sm font-medium mb-2">
        <Tag className="h-4 w-4 mr-1" />
        Limited Time Offer
        {timeRemaining && (
          <span className="ml-1 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </span>
        )}
      </div>
      
      <div>
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-white">${(promotion.promotional_price / 12).toFixed(2)}</span>
          <span className="text-gray-400 ml-2">/month</span>
        </div>
        <div className="flex items-center mt-1">
          <p className="text-sm text-gray-500 line-through mr-2">${regularPrice}</p>
          <p className="text-sm text-gray-500">billed annually at ${promotion.promotional_price}</p>
        </div>
        <p className="text-sm text-green-500 mt-1">
          Save ${promotion.savings_amount} ({promotion.savings_percentage}% off)
        </p>
      </div>
    </div>
  );
};

export default PlanPromotion;