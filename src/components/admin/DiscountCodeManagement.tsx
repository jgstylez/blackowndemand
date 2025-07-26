import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Download,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  applies_to_plan: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DiscountCodeForm {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applies_to_plan: string | null;
}

const defaultForm: DiscountCodeForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  max_uses: 100,
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  is_active: true,
  applies_to_plan: null,
};

interface DiscountCodeManagementProps {
  onUpdate?: () => void;
}

const DiscountCodeManagement: React.FC<DiscountCodeManagementProps> = ({
  onUpdate,
}) => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DiscountCodeForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    fetchDiscountCodes();
    fetchSubscriptionPlans();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiscountCodes((data as DiscountCode[]) || []);
    } catch (err) {
      console.error("Failed to fetch discount codes:", err);
      setError("Failed to load discount codes");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name")
        .order("price", { ascending: true });

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (err) {
      console.error("Failed to fetch subscription plans:", err);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "max_uses" && value === "") {
      setFormData((prev) => ({ ...prev, [name]: null }));
    } else if (name === "applies_to_plan" && value === "") {
      setFormData((prev) => ({ ...prev, [name]: null }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!formData.code.trim()) {
      setError("Discount code is required");
      return;
    }

    if (formData.discount_value <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    if (
      formData.discount_type === "percentage" &&
      formData.discount_value > 100
    ) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    try {
      setLoading(true);

      // Format the code to uppercase
      const formattedCode = formData.code.trim().toUpperCase();

      if (editingId) {
        // Update existing discount code
        const { error } = await supabase
          .from("discount_codes")
          .update({
            ...formData,
            code: formattedCode,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
        setSuccess("Discount code updated successfully");
      } else {
        // Create new discount code
        const { error } = await supabase.from("discount_codes").insert({
          ...formData,
          code: formattedCode,
          current_uses: 0,
        });

        if (error) {
          if (error.code === "23505") {
            // Unique violation
            setError("A discount code with this code already exists");
            return;
          }
          throw error;
        }
        setSuccess("Discount code created successfully");
      }

      // Reset form and refresh data
      setFormData(defaultForm);
      setShowForm(false);
      setEditingId(null);
      fetchDiscountCodes();
      onUpdate?.();
    } catch (err) {
      console.error("Failed to save discount code:", err);
      setError("Failed to save discount code");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (code: DiscountCode) => {
    setFormData({
      code: code.code,
      description: code.description || "",
      discount_type: code.discount_type as "percentage" | "fixed",
      discount_value: code.discount_value,
      max_uses: code.max_uses,
      valid_from: code.valid_from
        ? code.valid_from.split("T")[0]
        : new Date().toISOString().split("T")[0],
      valid_until: code.valid_until ? code.valid_until.split("T")[0] : null,
      is_active: code.is_active,
      applies_to_plan: code.applies_to_plan,
    });
    setEditingId(code.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this discount code?")
    ) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSuccess("Discount code deleted successfully");
      fetchDiscountCodes();
      onUpdate?.();
    } catch (err) {
      console.error("Failed to delete discount code:", err);
      setError("Failed to delete discount code");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("discount_codes")
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setSuccess(
        `Discount code ${
          !currentStatus ? "activated" : "deactivated"
        } successfully`
      );
      fetchDiscountCodes();
      onUpdate?.();
    } catch (err) {
      console.error("Failed to toggle discount code status:", err);
      setError("Failed to update discount code status");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportDiscountCodes = () => {
    const csvContent = [
      [
        "Code",
        "Description",
        "Type",
        "Value",
        "Uses",
        "Max Uses",
        "Valid From",
        "Valid Until",
        "Active",
        "Plan",
      ],
      ...discountCodes.map((code) => [
        code.code,
        code.description,
        code.discount_type,
        code.discount_value,
        code.current_uses,
        code.max_uses || "Unlimited",
        code.valid_from
          ? new Date(code.valid_from).toLocaleDateString()
          : "N/A",
        code.valid_until
          ? new Date(code.valid_until).toLocaleDateString()
          : "No expiration",
        code.is_active ? "Yes" : "No",
        code.applies_to_plan || "All plans",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discount-codes-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const cancelForm = () => {
    setFormData(defaultForm);
    setShowForm(false);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  };

  const isExpired = (code: DiscountCode) => {
    return code.valid_until && new Date(code.valid_until) < new Date();
  };

  const isExhausted = (code: DiscountCode) => {
    return code.max_uses !== null && (code.current_uses || 0) >= code.max_uses;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Discount Codes</h2>
          <p className="text-gray-400">
            Create and manage promotional discount codes
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportDiscountCodes}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={fetchDiscountCodes}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Code
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingId ? "Edit Discount Code" : "Create New Discount Code"}
            </h3>
            <button
              onClick={cancelForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Code
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent uppercase"
                    placeholder="SUMMER25"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Code will be automatically converted to uppercase
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Summer sale discount"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Type
                </label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Value
                </label>
                <div className="relative">
                  {formData.discount_type === "percentage" ? (
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  )}
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleFormChange}
                    min="0"
                    max={
                      formData.discount_type === "percentage" ? 100 : undefined
                    }
                    step="0.01"
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
                {formData.discount_type === "percentage" &&
                  formData.discount_value > 100 && (
                    <p className="text-red-500 text-xs mt-1">
                      Percentage cannot exceed 100%
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  name="max_uses"
                  value={formData.max_uses === null ? "" : formData.max_uses}
                  onChange={handleFormChange}
                  min="1"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valid From
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valid Until
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    name="valid_until"
                    value={formData.valid_until || ""}
                    onChange={handleFormChange}
                    className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for no expiration
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Applies to Plan
                </label>
                <select
                  name="applies_to_plan"
                  value={formData.applies_to_plan || ""}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="">All Plans</option>
                  {subscriptionPlans.map((plan) => (
                    <option key={plan.id} value={plan.name}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-white focus:ring-white focus:ring-offset-gray-900"
              />
              <label
                htmlFor="is_active"
                className="ml-2 block text-sm text-gray-300"
              >
                Active
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discount Codes List */}
      <div className="space-y-4">
        {loading && discountCodes.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : discountCodes.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No discount codes found</p>
            <p className="text-gray-500 text-sm mt-2">
              Create your first discount code to get started
            </p>
          </div>
        ) : (
          discountCodes.map((code) => (
            <div key={code.id} className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-gray-800 text-white rounded-lg font-mono text-sm">
                        {code.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Copy code"
                      >
                        {copied === code.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {code.is_active ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-500 rounded text-xs">
                          Inactive
                        </span>
                      )}

                      {isExpired(code) && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs">
                          Expired
                        </span>
                      )}

                      {isExhausted(code) && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs">
                          Exhausted
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-white font-medium mb-1">
                    {code.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>
                      {code.discount_type === "percentage"
                        ? `${code.discount_value}% off`
                        : `$${code.discount_value} off`}
                    </span>
                    <span>
                      Used: {code.current_uses}
                      {code.max_uses ? `/${code.max_uses}` : ""}
                    </span>
                    <span>
                      Valid:{" "}
                      {code.valid_from
                        ? new Date(code.valid_from).toLocaleDateString()
                        : "N/A"}{" "}
                      -{" "}
                      {code.valid_until
                        ? new Date(code.valid_until).toLocaleDateString()
                        : "No expiration"}
                    </span>
                    {code.applies_to_plan && (
                      <span>Plan: {code.applies_to_plan}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(code.id, code.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      code.is_active
                        ? "text-yellow-500 hover:bg-yellow-500/20"
                        : "text-green-500 hover:bg-green-500/20"
                    }`}
                    title={code.is_active ? "Deactivate" : "Activate"}
                  >
                    {code.is_active ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleEdit(code)}
                    className="p-2 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(code.id)}
                    className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscountCodeManagement;
