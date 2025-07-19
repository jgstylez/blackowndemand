import React, { useState } from "react";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface DiscountCodeInputProps {
  onApply: (discountInfo: DiscountInfo) => void;
  onRemove: () => void;
  planName?: string;
  disabled?: boolean;
}

export interface DiscountInfo {
  valid: boolean;
  discountId?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  message: string;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  onApply,
  onRemove,
  planName,
  disabled = false,
}) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("Please enter a discount code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the RPC function to validate the discount code
      const { data, error } = await supabase.rpc("validate_discount_code", {
        p_code: code.trim().toUpperCase(),
        p_plan_name: planName,
      });

      if (error) throw error;

      if (data && data.valid) {
        // Format the discount info
        const discountInfo: DiscountInfo = {
          valid: true,
          discountId: data.discount_id,
          discountType: data.discount_type,
          discountValue: data.discount_value,
          message: data.message,
        };

        setDiscountInfo(discountInfo);
        setAppliedCode(code.trim().toUpperCase());
        onApply(discountInfo);
      } else {
        setError(data?.message || "Invalid discount code");
        setDiscountInfo(null);
        setAppliedCode(null);
        onRemove();
      }
    } catch (err) {
      console.error("Error validating discount code:", err);
      setError("Failed to validate discount code");
      setDiscountInfo(null);
      setAppliedCode(null);
      onRemove();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCode = () => {
    setCode("");
    setAppliedCode(null);
    setDiscountInfo(null);
    setError(null);
    onRemove();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Discount Code
      </label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            value={appliedCode ? appliedCode : code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="Enter discount code"
            className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:bg-gray-700 disabled:text-gray-400"
            disabled={!!appliedCode || disabled || loading}
          />
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          {appliedCode && (
            <button
              onClick={handleRemoveCode}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              style={{ padding: 0 }}
              disabled={disabled}
              aria-label="Remove discount code"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {!appliedCode && (
          <button
            onClick={handleApplyCode}
            disabled={disabled || loading || !code.trim()}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Apply"}
          </button>
        )}
      </div>
      {appliedCode && discountInfo && (
        <div className="mt-1">
          {discountInfo.discountType === "percentage" ? (
            <p className="text-green-400 text-sm">
              {discountInfo.discountValue}% discount applied
            </p>
          ) : (
            <p className="text-green-400 text-sm">
              ${discountInfo.discountValue} discount applied
            </p>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default DiscountCodeInput;
