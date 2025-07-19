import React, { useState } from 'react';
import { X, UserPlus, Check, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SignUpPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onDontShowAgain: () => void;
}

const SignUpPromptModal: React.FC<SignUpPromptModalProps> = ({
  isOpen,
  onClose,
  onDismiss,
  onDontShowAgain
}) => {
  const [showDontShowOption, setShowDontShowOption] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        className="bg-gray-900 rounded-xl max-w-md w-full shadow-2xl transform transition-all animate-scaleIn"
        style={{
          boxShadow: '0 0 40px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="p-6 pt-10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            Join Our Community
          </h2>
          
          <p className="text-gray-300 text-center mb-6">
            Sign up for free to access our full directory of Black-owned businesses.
          </p>
          
          <div className="space-y-4 mb-6">
            <Link
              to="/signup"
              className="block w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors text-center font-medium"
              onClick={onClose}
            >
              Create Free Account
            </Link>
            
            <Link
              to="/login"
              className="block w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-center"
              onClick={onClose}
            >
              Sign In
            </Link>
          </div>
          
          <div className="flex justify-center">
            {showDontShowOption ? (
              <div className="flex gap-4">
                <button
                  onClick={onDontShowAgain}
                  className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Don't show again
                </button>
                <button
                  onClick={onDismiss}
                  className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Ask me later
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDontShowOption(true)}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Not interested?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPromptModal;