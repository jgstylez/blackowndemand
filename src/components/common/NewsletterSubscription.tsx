import React, { useState } from "react";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { logError } from "../../lib/errorLogger";
import useErrorHandler from "../../hooks/useErrorHandler";

interface NewsletterSubscriptionProps {
  className?: string;
  variant?: "default" | "compact" | "footer";
  title?: string;
  description?: string;
}

const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({
  className = "",
  variant = "default",
  title = "Stay Updated",
  description = "Get the latest updates on Black businesses and community news.",
}) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const {
    error = null,
    handleError,
    clearError,
  } = useErrorHandler({
    context: "NewsletterSubscription",
    defaultMessage: "Failed to subscribe to newsletter",
  });

  // Helper function to safely check error state
  const hasError = error && typeof error === "object" && "message" in error;
  const errorMessage = hasError ? error.message : "An error occurred";

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubscribeStatus("loading");

    try {
      // Validate email format
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            source: "newsletter_form",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to subscribe");
      }

      const data = await response.json();

      if (!data.success) {
        if (data.error === "Member exists") {
          setSubscribeStatus("success");
          setEmail("");
          setFirstName("");
          setLastName("");
          return;
        }
        throw new Error(data.error || "Failed to subscribe");
      }

      setSubscribeStatus("success");
      setEmail("");
      setFirstName("");
      setLastName("");

      // Log successful subscription for analytics
      console.info(`Newsletter subscription: ${email}`);
    } catch (err) {
      setSubscribeStatus("error");
      handleError(err);

      // Log the error
      logError(err, {
        context: "NewsletterSubscription",
        metadata: { email, firstName, lastName },
      });
    }
  };

  // Reset status after 5 seconds of success
  React.useEffect(() => {
    if (subscribeStatus === "success") {
      const timer = setTimeout(() => {
        setSubscribeStatus("idle");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [subscribeStatus]);

  if (variant === "compact") {
    return (
      <div className={`${className}`}>
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-grow">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              disabled={
                subscribeStatus === "loading" || subscribeStatus === "success"
              }
            />
          </div>
          <button
            type="submit"
            disabled={
              subscribeStatus === "loading" ||
              subscribeStatus === "success" ||
              !email
            }
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscribeStatus === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>

        {subscribeStatus === "success" && (
          <div className="mt-2 flex items-center text-green-500 text-sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Successfully subscribed!</span>
          </div>
        )}

        {hasError && (
          <div className="mt-2 flex items-center text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`${className}`}>
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-4">{description}</p>
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div>
            <label htmlFor="email-input" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                disabled={
                  subscribeStatus === "loading" || subscribeStatus === "success"
                }
                required
              />
              <button
                type="submit"
                disabled={
                  subscribeStatus === "loading" ||
                  subscribeStatus === "success" ||
                  !email
                }
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Subscribe to newsletter"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
          {subscribeStatus === "success" && (
            <p className="text-green-500 text-sm">Thanks for subscribing!</p>
          )}
          {hasError && <p className="text-red-500 text-sm">{errorMessage}</p>}
        </form>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
      <div className="text-center mb-6">
        <Mail className="h-12 w-12 text-white mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>

      <form onSubmit={handleSubscribe} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name (optional)"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              disabled={
                subscribeStatus === "loading" || subscribeStatus === "success"
              }
            />
          </div>

          <div className="relative">
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name (optional)"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              disabled={
                subscribeStatus === "loading" || subscribeStatus === "success"
              }
            />
          </div>
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            disabled={
              subscribeStatus === "loading" || subscribeStatus === "success"
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={
            subscribeStatus === "loading" ||
            subscribeStatus === "success" ||
            !email
          }
          className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {subscribeStatus === "loading"
            ? "Subscribing..."
            : "Subscribe to Newsletter"}
        </button>

        {subscribeStatus === "success" && (
          <div className="p-3 bg-green-500/10 text-green-500 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Successfully subscribed to our newsletter!</span>
          </div>
        )}

        {hasError && (
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewsletterSubscription;
