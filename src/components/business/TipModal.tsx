import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TipModalProps {
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
}

const PRESET_AMOUNTS = [5, 10, 20, 50];

const TipModal: React.FC<TipModalProps> = ({ businessName, isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tipAmount = customAmount ? parseFloat(customAmount) : amount;
      if (tipAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      await onSubmit(tipAmount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process tip');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
      setAmount(0);
    }
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Support {businessName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetAmount(preset)}
                  className={`py-3 rounded-lg text-center transition-colors ${
                    amount === preset
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Enter amount"
                className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!amount && !customAmount)}
            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing...' : 'Send Tip'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400 text-center">
          100% of your tip goes directly to supporting {businessName}
        </p>
      </div>
    </div>
  );
};

export default TipModal;