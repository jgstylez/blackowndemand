import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Check, X, Star, Users, TrendingUp, Shield, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PlanPromotion from '../components/pricing/PlanPromotion';
import PaymentModal from '../components/payment/PaymentModal';

const PricingPage = () => {
  const navigate = useNavigate();
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
    service: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{price: number, name: string} | null>(null);
  
  const handlePlanSelect = async (planPrice: number, planName: string) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Store selected plan in session storage
      sessionStorage.setItem('selectedPlan', planPrice.toString());
      sessionStorage.setItem('selectedPlanName', planName);
      // Redirect to login
      navigate('/login?redirect=/pricing');
      return;
    }

    // If user is authenticated, show payment modal
    setSelectedPlan({ price: planPrice, name: planName });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    // Close payment modal
    setShowPaymentModal(false);
    
    // Navigate to business listing form with payment completed flag
    if (selectedPlan) {
      navigate('/business/new', { 
        state: { 
          planPrice: selectedPlan.price, 
          planName: selectedPlan.name,
          paymentCompleted: true 
        }
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send email using Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(contactForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      setSuccess(true);
      setTimeout(() => {
        setShowContactForm(false);
        setSuccess(false);
        setContactForm({
          name: '',
          email: '',
          message: '',
          service: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Pricing Plans</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Exclusive pricing plans for business owners looking to showcase their businesses and connect with customers on our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Starter Plan */}
          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="mb-8">
              <span className="text-sm text-gray-400">Basic Listing</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3">Starter Plan</h2>
              <p className="text-gray-400 text-sm">Perfect for getting started with your visibility</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">$1</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">(billed annually at $12)</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                 Public Directory Access
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Basic Profile 
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Basic Analytics
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Image Gallery
              </li>
            </ul>

            <button 
              onClick={() => handlePlanSelect(12, 'Starter Plan')}
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
            >
              Select Plan
            </button>
          </div>

          {/* Enhanced Plan */}
          <div className="bg-gray-900 rounded-2xl p-8 ring-2 ring-white relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-white text-black px-3 py-1 rounded-full text-sm">
                Most Popular
              </span>
            </div>

            <div className="mb-8">
              <span className="text-sm text-gray-400">More Benefits</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3">Enhanced Plan</h2>
              <p className="text-gray-400 text-sm">Get more visibility and features for your business</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">$5</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">(billed annually at $60)</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Everything in Starter Plan
              </li>
             
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Higher Directory Placement
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Category Prioritization
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Social Media Links
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Promo Video Display
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Promote Special Offers
              </li>
            </ul>

            <button 
              onClick={() => handlePlanSelect(60, 'Enhanced')}
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
            >
              Select Plan
            </button>
          </div>

          {/* VIP Members Plan */}
          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="mb-8">
              <span className="text-sm text-gray-400">Exclusive Access</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3 flex items-center gap-2">
                VIP Plan
                <Crown className="h-6 w-6 text-yellow-400" />
              </h2>
              <p className="text-gray-400 text-sm">Join and gain access to special benefits</p>
            </div>

            <div className="mb-8 pt-0">
              <PlanPromotion planName="VIP Plan" regularPrice={120} />
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Everything in Enhanced Plan
              </li>
               <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Exclusive Badge
              </li>
              <li className="hidden flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Early Access
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Special Recognition
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                BOD Credits
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Priority Placement
              </li>
              <li className="hidden flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Private VIP network
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-white mr-3" />
                Exclusive Benefits
              </li>
            </ul>

            <button 
              onClick={() => handlePlanSelect(99, 'VIP Plan')}
              className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg transition-colors font-semibold"
            >
              Become VIP
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Global Reach</h3>
            <p className="text-gray-400">Connect with customers worldwide looking specifically for Black-owned businesses.</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Verified Status</h3>
            <p className="text-gray-400">Build trust with customers through our business verification system.</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Premium Features</h3>
            <p className="text-gray-400">Access professional tools and features to showcase your business effectively.</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="bg-white/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Growth Tools</h3>
            <p className="text-gray-400">Get insights and analytics to help your business thrive in the digital economy.</p>
          </div>
        </div>

        {/* Contact Sales Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Contact Sales Team</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">Message Sent!</p>
                  <p className="text-gray-400">
                    Our sales team will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Interested Service
                    </label>
                    <select
                      required
                      value={contactForm.service}
                      onChange={(e) => setContactForm(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    >
                      <option value="">Select a service</option>
                      <option value="featured">Featured Listings</option>
                      <option value="category">Category Sponsorships</option>
                      <option value="advertising">Sitewide Advertising</option>
                      <option value="bundle">Cross-Promotion Bundles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                      placeholder="Tell us about your needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          amount={selectedPlan?.price || 0}
          description={`Annual ${selectedPlan?.name || ""} subscription`}
          planName={selectedPlan?.name || ""}
        />
      </div>
    </Layout>
  );
};

export default PricingPage;