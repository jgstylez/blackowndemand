import React, { useState } from 'react';
import { X, Mail, Check, Edit, AlertCircle } from 'lucide-react';
import { maskEmail } from '../../utils/emailUtils';

interface Business {
  id: string;
  name: string;
  email: string;
  image_url: string;
}

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  verifiedEmail: string;
  onSubmit: (finalEmail: string) => void;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  business,
  verifiedEmail,
  onSubmit
}) => {
  const [useVerifiedEmail, setUseVerifiedEmail] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const finalEmail = useVerifiedEmail ? verifiedEmail : newEmail;
      
      // Validate email format if using a new email
      if (!useVerifiedEmail) {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(newEmail)) {
          throw new Error('Please enter a valid email address');
        }
      }

      onSubmit(finalEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Confirm Business Email</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email Verification Successful</h3>
              <p className="text-gray-400">
                You've successfully verified ownership of <span className="text-white font-medium">{business.name}</span>
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Confirm Business Email</h4>
              <p className="text-gray-400 text-sm mb-4">
                Would you like to use the verified email address or update it?
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setUseVerifiedEmail(true)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    useVerifiedEmail 
                      ? 'bg-white/10 border border-white/30' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-white">{maskEmail(verifiedEmail)}</span>
                  </div>
                  {useVerifiedEmail && <Check className="h-5 w-5 text-green-500" />}
                </button>

                <div className="flex items-center">
                  <div className="flex-grow border-t border-gray-700"></div>
                  <span className="mx-4 text-gray-500 text-sm">or</span>
                  <div className="flex-grow border-t border-gray-700"></div>
                </div>

                <div
                  className={`w-full p-3 rounded-lg transition-colors ${
                    !useVerifiedEmail 
                      ? 'bg-white/10 border border-white/30' 
                      : 'bg-gray-700'
                  }`}
                >
                  <div 
                    className="flex items-center justify-between mb-2 cursor-pointer"
                    onClick={() => setUseVerifiedEmail(false)}
                  >
                    <div className="flex items-center">
                      <Edit className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-white">Use a different email</span>
                    </div>
                    {!useVerifiedEmail && <Check className="h-5 w-5 text-green-500" />}
                  </div>
                  
                  {!useVerifiedEmail && (
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full mt-2 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Enter new email address"
                    />
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || (!useVerifiedEmail && !newEmail.trim())}
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationModal;