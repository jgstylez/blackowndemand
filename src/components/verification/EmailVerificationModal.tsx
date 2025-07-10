import React, { useState, useEffect } from 'react';
import { X, Mail, Check, AlertCircle, Edit, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { maskEmail } from '../../utils/emailUtils';
import { callEdgeFunction } from '../../lib/edgeFunctions';

interface Business {
  id: string;
  name: string;
  description: string;
  email: string;
  city: string;
  state: string;
  category: string;
  image_url: string;
  migration_source: string;
  claimed_at: string | null;
}

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onVerificationSuccess: (email: string) => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  business,
  onVerificationSuccess
}) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const sendVerificationCode = async () => {
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email format (example@domain.com)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the send-verification-code Edge Function
      const response = await callEdgeFunction<{ success: boolean, message?: string }>({
        functionName: 'send-verification-code',
        payload: {
          email: email,
          businessId: business.id
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send verification code');
      }

      // Move to code entry step
      setStep('code');
      setCountdown(60); // 60 second countdown for resend
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!enteredCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (enteredCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the verify_business_code RPC function
      const { data, error: verifyError } = await supabase.rpc('verify_business_code', {
        p_business_id: business.id,
        p_email: email,
        p_code: enteredCode
      });

      if (verifyError) {
        throw verifyError;
      }

      // Check if verification was successful
      if (!data) {
        throw new Error('Invalid verification code. Please try again.');
      }

      // Call success callback with the verified email
      onVerificationSuccess(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify business ownership. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmailStep = () => {
    setStep('email');
    setEnteredCode('');
    setError(null);
  };

  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Mail className="h-12 w-12 text-white mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Verify Business Email</h3>
        <p className="text-gray-400">
          We'll send a verification code to confirm you own this business
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">{business.name}</h4>
        <p className="text-gray-400 text-sm">
          Current email on file: {business.email ? maskEmail(business.email) : 'No email on file'}
        </p>
      </div>

      <div>
        <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-300 mb-2">
          Verify business email
        </label>
        <input
          id="businessEmail"
          name="businessEmail"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          placeholder="Enter your business email"
          required
        />
        {email !== business.email && (
          <p className="text-yellow-400 text-sm mt-2 flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Email will be updated in your business profile
          </p>
        )}
      </div>

      <button
        onClick={sendVerificationCode}
        disabled={loading || !email.trim()}
        className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Sending Code...' : 'Send Verification Code'}
      </button>
    </div>
  );

  const renderCodeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Enter Verification Code</h3>
        <p className="text-gray-400">
          {codeSent ? (
            <>We've sent a 6-digit code to <span className="text-white">{maskEmail(email)}</span></>
          ) : (
            <>Please enter the verification code sent to <span className="text-white">{maskEmail(email)}</span></>
          )}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={enteredCode}
          onChange={(e) => {
            setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          placeholder="000000"
          maxLength={6}
        />
      </div>

      <button
        onClick={verifyCode}
        disabled={loading || enteredCode.length !== 6}
        className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => countdown === 0 ? sendVerificationCode() : undefined}
          disabled={countdown > 0 || loading}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend verification code'}
        </button>
        
        <button
          onClick={goBackToEmailStep}
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Change email address
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Verify Business Ownership</h2>
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

          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;