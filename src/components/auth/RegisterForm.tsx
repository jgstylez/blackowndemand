import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Check, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/errorLogger';
import useErrorHandler from '../../hooks/useErrorHandler';
import { sendWelcomeEmail } from '../../lib/emailService';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
  
  const { error, handleError, clearError } = useErrorHandler({
    context: 'RegisterForm',
    defaultMessage: 'Failed to create account'
  });

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

  const subscribeToEmailList = async (userEmail: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          email: userEmail,
          first_name: firstName,
          last_name: lastName
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.warn('Newsletter subscription failed:', data.error);
        // Don't throw error - newsletter subscription failure shouldn't block account creation
      }
    } catch (error) {
      console.warn('Newsletter subscription error:', error);
      // Don't throw error - newsletter subscription failure shouldn't block account creation
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Client-side validation
    if (password !== confirmPassword) {
      handleError(new Error('Passwords do not match'), 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      handleError(new Error('Password too short'), 'Password must be at least 8 characters');
      return;
    }

    // Validate all password requirements
    const requirements = validatePassword(password);
    if (!Object.values(requirements).every(Boolean)) {
      handleError(new Error('Password does not meet all requirements'), 'Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      // Sign up with email confirmation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            email_confirm: true
          }
        }
      });

      if (signUpError) {
        // Map technical error messages to user-friendly ones
        let userMessage = signUpError.message;
        
        if (signUpError.message.includes('User already registered') || signUpError.message.includes('user_already_exists')) {
          userMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (signUpError.message.includes('password')) {
          userMessage = 'Password is too weak. Please use a stronger password.';
        } else if (signUpError.message.includes('email')) {
          userMessage = 'Please enter a valid email address.';
        }
        
        throw new Error(userMessage);
      }

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        setSuccess(true);
        
        // Subscribe to newsletter if user opted in
        if (subscribeToNewsletter) {
          await subscribeToEmailList(email);
        }
        
        // Send welcome email
        try {
          await sendWelcomeEmail(email, firstName);
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError);
          // Don't block signup if welcome email fails
        }
      } else {
        // If email confirmation is disabled, proceed normally
        if (subscribeToNewsletter) {
          await subscribeToEmailList(email);
        }
        
        // Send welcome email
        try {
          await sendWelcomeEmail(email, firstName);
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError);
          // Don't block signup if welcome email fails
        }
        
        navigate('/dashboard');
      }
    } catch (err) {
      handleError(err);
      
      // Log the original error for debugging
      logError(err, {
        context: 'RegisterForm',
        metadata: { email }
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Check your email</h2>
          <p className="text-gray-400 mb-6">
            We've sent a verification link to <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Click the link in the email to verify your account and complete registration.
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors text-center font-medium"
            >
              Return to Login
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFirstName('');
                setLastName('');
              }}
              className="block w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-center"
            >
              Try Different Email
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-6">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white">Create your account</h2>
        <p className="mt-2 text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-300 hover:text-white">
            Sign in
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error.hasError && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <span>{error.message}</span>
              {error.message?.includes('already exists') && (
                <div className="mt-2">
                  <Link to="/login" className="text-red-400 hover:text-red-300 underline">
                    Sign in instead
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="sr-only">
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="First name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="lastName" className="sr-only">
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
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
                placeholder="Password"
                aria-describedby="password-requirements"
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
            <label htmlFor="confirmPassword" className="sr-only">
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
                placeholder="Confirm Password"
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
        </div>

        {/* Newsletter subscription checkbox */}
        <div className="flex items-center">
          <input
            id="newsletter-subscription"
            name="newsletter-subscription"
            type="checkbox"
            checked={subscribeToNewsletter}
            onChange={(e) => setSubscribeToNewsletter(e.target.checked)}
            className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-white focus:ring-white focus:ring-offset-gray-900"
          />
          <label htmlFor="newsletter-subscription" className="ml-2 block text-sm text-gray-400">
            Subscribe to our newsletter for updates on Black businesses and community news
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
              Creating account...
            </div>
          ) : (
            'Create account'
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="text-gray-300 hover:text-white">
            Terms of Use
          </Link>
          {', '}
          <Link to="/privacy" className="text-gray-300 hover:text-white">
            Privacy Policy
          </Link>
          {', and '}
          <Link to="/terms" className="text-gray-300 hover:text-white">
            Disclaimer
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;