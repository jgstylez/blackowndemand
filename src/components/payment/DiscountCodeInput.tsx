
import React, { useState } from "react";
import { Tag, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

export interface DiscountInfo {
  valid: boolean;
  discount_id?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  message?: string;
}

interface DiscountCodeInputProps {
  onApply: (discountInfo: DiscountInfo) => void;
  onRemove: () => void;
  planName: string;
  disabled?: boolean;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  onApply,
  onRemove,
  planName,
  disabled = false,
}) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApplyCode = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_discount_code', {
        p_code: code.trim(),
        p_plan_name: planName
      });

      if (rpcError) throw rpcError;

      if (data && typeof data === 'object') {
        const discountData = data as any;
        
        if (discountData.valid) {
          const discountInfo: DiscountInfo = {
            valid: true,
            discount_id: discountData.discount_id,
            discountType: discountData.discount_type as "percentage" | "fixed",
            discountValue: discountData.discount_value,
            message: discountData.message || "Discount applied successfully!",
          };

          setAppliedDiscount(discountInfo);
          onApply(discountInfo);
          setCode("");
        } else {
          setError(discountData.message || "Invalid discount code");
        }
      } else {
        setError("Invalid discount code");
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setError('Failed to validate discount code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCode = () => {
    setAppliedDiscount(null);
    setError(null);
    onRemove();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-gray-400" />
        <h4 className="text-md font-medium text-white">Discount Code</h4>
      </div>

      {appliedDiscount ? (
        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div>
            <p className="text-green-400 font-medium">Discount Applied!</p>
            <p className="text-green-300 text-sm">{appliedDiscount.message}</p>
          </div>
          <button
            onClick={handleRemoveCode}
            disabled={disabled}
            className="text-green-400 hover:text-green-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter discount code"
              disabled={disabled || loading}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCode();
                }
              }}
            />
            <button
              onClick={handleApplyCode}
              disabled={!code.trim() || disabled || loading}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "..." : "Apply"}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;
