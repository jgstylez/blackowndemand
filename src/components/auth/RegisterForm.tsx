import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logError } from "../../lib/errorLogger";
import useErrorHandler from "../../hooks/useErrorHandler";

const RegisterForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Password strength state (0-100)
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { error, handleError, clearError } = useErrorHandler({
    context: "RegisterForm",
    defaultMessage: "Failed to create account",
  });

  // Email validation regex
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  // Validate password strength
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setPasswordRequirements(requirements);

    // Calculate strength (20 points per requirement)
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const strength = metRequirements * 20;
    setPasswordStrength(strength);

    return requirements;
  };

  // Get password strength color
  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get password strength label
  const getStrengthLabel = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  // Validate individual fields
  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };

    switch (field) {
      case "firstName":
        if (!value.trim()) {
          errors.firstName = "First name is required";
        } else if (value.trim().length < 2) {
          errors.firstName = "First name must be at least 2 characters";
        } else {
          errors.firstName = "";
        }
        break;

      case "lastName":
        if (!value.trim()) {
          errors.lastName = "Last name is required";
        } else if (value.trim().length < 2) {
          errors.lastName = "Last name must be at least 2 characters";
        } else {
          errors.lastName = "";
        }
        break;

      case "email":
        if (!value.trim()) {
          errors.email = "Email is required";
        } else if (!emailRegex.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          errors.email = "";
        }
        break;

      case "password":
        const requirements = validatePassword(value);
        if (!value) {
          errors.password = "Password is required";
        } else if (!Object.values(requirements).every(Boolean)) {
          errors.password = "Password does not meet all requirements";
        } else {
          errors.password = "";
        }
        break;

      case "confirmPassword":
        if (!value) {
          errors.confirmPassword = "Please confirm your password";
        } else if (value !== password) {
          errors.confirmPassword = "Passwords do not match";
        } else {
          errors.confirmPassword = "";
        }
        break;
    }

    setFieldErrors(errors);
  };

  // Handle field changes with validation
  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }

    // Validate field
    validateField(field, value);

    // Clear form error when user starts typing
    if (error) {
      clearError();
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      emailRegex.test(email) &&
      password &&
      confirmPassword &&
      password === confirmPassword &&
      Object.values(passwordRequirements).every(Boolean) &&
      Object.values(fieldErrors).every((error) => !error)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate all fields
    validateField("firstName", firstName);
    validateField("lastName", lastName);
    validateField("email", email);
    validateField("password", password);
    validateField("confirmPassword", confirmPassword);

    if (!isFormValid()) {
      handleError(new Error("Please fix the validation errors"));
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) throw authError;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        navigate("/login", {
          state: {
            message:
              "Please check your email to confirm your account before signing in.",
          },
        });
      } else if (data.session) {
        // Auto-confirmed, redirect to intended page
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Provide more user-friendly error messages
      if (err instanceof Error) {
        let userMessage = err.message;

        if (err.message.includes("User already registered")) {
          userMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (err.message.includes("Invalid email")) {
          userMessage = "Please enter a valid email address.";
        } else if (err.message.includes("network")) {
          userMessage =
            "Network error. Please check your connection and try again.";
        }

        handleError(err, userMessage);
      } else {
        handleError(err);
      }

      logError(String(err), {
        context: "RegisterForm",
        metadata: { email, firstName, lastName },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white">Create your account</h2>
        <p className="mt-2 text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-gray-300 hover:text-white">
            Sign in
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error.message}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                First name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) =>
                    handleFieldChange("firstName", e.target.value)
                  }
                  className={`appearance-none relative block w-full px-3 py-3 pl-10 border rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent ${
                    fieldErrors.firstName ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="First name"
                />
                {fieldErrors.firstName && (
                  <div className="mt-1 text-red-500 text-xs flex items-center">
                    <XCircle className="h-3 w-3 mr-1" />
                    {fieldErrors.firstName}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                className={`appearance-none relative block w-full px-3 py-3 border rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent ${
                  fieldErrors.lastName ? "border-red-500" : "border-gray-700"
                }`}
                placeholder="Last name"
              />
              {fieldErrors.lastName && (
                <div className="mt-1 text-red-500 text-xs flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  {fieldErrors.lastName}
                </div>
              )}
            </div>
          </div>

          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email address <span className="text-red-500">*</span>
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
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={`appearance-none relative block w-full px-3 py-3 pl-10 border rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent ${
                  fieldErrors.email ? "border-red-500" : "border-gray-700"
                }`}
                placeholder="Email address"
              />
              {fieldErrors.email && (
                <div className="mt-1 text-red-500 text-xs flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  {fieldErrors.email}
                </div>
              )}
            </div>
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password <span className="text-red-500">*</span>
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
                onChange={(e) => handleFieldChange("password", e.target.value)}
                className={`appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent ${
                  fieldErrors.password ? "border-red-500" : "border-gray-700"
                }`}
                placeholder="Password"
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
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Password strength:</span>
                  <span
                    className={`font-medium ${getStrengthColor().replace(
                      "bg-",
                      "text-"
                    )}`}
                  >
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>

                {/* Password requirements */}
                <div className="mt-3 space-y-1">
                  <div
                    className={`text-xs flex items-center ${
                      passwordRequirements.minLength
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordRequirements.minLength ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    At least 8 characters
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordRequirements.hasUppercase
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordRequirements.hasUppercase ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    One uppercase letter
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordRequirements.hasLowercase
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordRequirements.hasLowercase ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    One lowercase letter
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordRequirements.hasNumber
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordRequirements.hasNumber ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    One number
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordRequirements.hasSpecial
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordRequirements.hasSpecial ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    One special character
                  </div>
                </div>
              </div>
            )}

            {fieldErrors.password && (
              <div className="mt-1 text-red-500 text-xs flex items-center">
                <XCircle className="h-3 w-3 mr-1" />
                {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Confirm password <span className="text-red-500">*</span>
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
                onChange={(e) =>
                  handleFieldChange("confirmPassword", e.target.value)
                }
                className={`appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent ${
                  fieldErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-700"
                }`}
                placeholder="Confirm password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="mt-1 text-red-500 text-xs flex items-center">
                <XCircle className="h-3 w-3 mr-1" />
                {fieldErrors.confirmPassword}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
