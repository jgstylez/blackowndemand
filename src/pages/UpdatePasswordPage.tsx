import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { logError } from '../lib/errorLogger';

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  
  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });
  
  // Password strength state (0-100)
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check if user has a valid session from password reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
    };
    
    checkSession();
  }, []);

  const validatePassword = (password: string) => {
    // Check each requirement
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password)
    };
    
    // Update requirements state
    setPasswordRequirements(requirements);
    
    // Calculate strength (20 points per requirement)
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const strength = metRequirements * 20;
    setPasswordStrength(strength);
    
    return requirements;
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 80) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password requirements
    const requirements = validatePassword(password);
    if (!Object.values(requirements).every(Boolean)) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        throw updateError;
      }

      // Show success message
      setSuccess(true);
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      logError('Failed to update password', {
        context: 'UpdatePasswordPage',
        metadata: { error: err }
      });
      
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Update Your Password</h2>
            <p className="mt-2 text-sm text-gray-400">
              Create a new secure password for your account
            </p>
          </div>

          {!hasSession && !success ? (
            <div className="bg-yellow-500/10 text-yellow-500 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Invalid or Expired Link</h3>
              <p className="text-sm mb-4">
                This password reset link is invalid or has expired. Please request a new password reset link.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
              >
                Request New Link
              </button>
            </div>
          ) : success ? (
            <div className="bg-green-500/10 text-green-500 p-6 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Password Updated Successfully!</h3>
              <p className="text-sm mb-4">
                Your password has been updated. You will be redirected to the login page shortly.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Password strength: {getStrengthLabel()}</span>
                    <span className="text-xs text-gray-400">{passwordStrength}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStrengthColor()} transition-all duration-300`} 
                      style={{ width: `${passwordStrength}%` }}
                      role="progressbar"
                      aria-valuenow={passwordStrength}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>
                
                {/* Password requirements */}
                <div id="password-requirements" className="mt-3 space-y-2 text-sm">
                  <p className={`flex items-center ${passwordRequirements.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordRequirements.minLength ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 text-red-400" />
                    )}
                    At least 8 characters
                  </p>
                  <p className={`flex items-center ${passwordRequirements.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordRequirements.hasUppercase ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 text-red-400" />
                    )}
                    At least 1 uppercase letter
                  </p>
                  <p className={`flex items-center ${passwordRequirements.hasLowercase ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordRequirements.hasLowercase ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 text-red-400" />
                    )}
                    At least 1 lowercase letter
                  </p>
                  <p className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordRequirements.hasNumber ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 text-red-400" />
                    )}
                    At least 1 number
                  </p>
                  <p className={`flex items-center ${passwordRequirements.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordRequirements.hasSpecial ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 text-red-400" />
                    )}
                    At least 1 special character (!@#$%^&*)
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                    )}
                  </button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UpdatePasswordPage;