import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import BusinessManagement from '../components/admin/BusinessManagement';
import AnnouncementManagement from '../components/admin/AnnouncementManagement';
import AdManagement from '../components/admin/AdManagement';
import Analytics from '../components/admin/Analytics';
import UserRoleManagement from '../components/admin/UserRoleManagement';
import NewsletterManagement from '../components/admin/NewsletterManagement';
import DiscountCodeManagement from '../components/admin/DiscountCodeManagement';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';
import FeatureFlagManagement from '../components/admin/FeatureFlagManagement';
import PromotionManagement from '../components/admin/PromotionManagement';
import AdminSidebar from '../components/admin/AdminSidebar';
import { 
  Users, 
  Building2, 
  Star, 
  Crown, 
  TrendingUp, 
  Megaphone,
  BarChart3,
  Settings,
  LayoutGrid,
  Shield,
  Mail,
  Tag,
  CreditCard,
  Flag,
  Percent
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BusinessStats {
  total_businesses: number;
  active_businesses: number;
  inactive_businesses: number;
  verified_businesses: number;
  featured_businesses: number;
  member_businesses: number;
  unclaimed_businesses: number;
}

type AdminTab = 'overview' | 'businesses' | 'announcements' | 'ads' | 'analytics' | 'settings' | 'user-roles' | 'newsletter' | 'discount-codes' | 'subscriptions' | 'feature-flags' | 'promotions';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_business_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = () => {
    fetchStats();
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
        <p className="text-gray-400">Platform settings and configuration</p>
      </div>
      
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Platform Configuration</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-2">Business Verification</h4>
            <p className="text-gray-400 text-sm mb-3">Configure automatic verification rules and manual review processes.</p>
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
              Configure
            </button>
          </div>
          
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-2">Featured Business Rules</h4>
            <p className="text-gray-400 text-sm mb-3">Set criteria for featuring businesses and promotional guidelines.</p>
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
              Configure
            </button>
          </div>
          
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-2">Content Moderation</h4>
            <p className="text-gray-400 text-sm mb-3">Manage content filtering, approval workflows, and community guidelines.</p>
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
              Configure
            </button>
          </div>
          
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-2">User Role Definitions</h4>
            <p className="text-gray-400 text-sm mb-3">Define and manage custom roles and their associated permissions.</p>
            <button 
              onClick={() => setActiveTab('user-roles')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Manage Roles
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title={`Admin - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Overview */}
          {activeTab === 'overview' && renderOverview()}
          
          {/* Business Management */}
          {activeTab === 'businesses' && (
            <BusinessManagement onBusinessUpdate={handleDataUpdate} />
          )}
          
          {/* Subscriptions */}
          {activeTab === 'subscriptions' && (
            <SubscriptionManagement onUpdate={handleDataUpdate} />
          )}
          
          {/* Promotions */}
          {activeTab === 'promotions' && (
            <PromotionManagement onUpdate={handleDataUpdate} />
          )}
          
          {/* Announcements */}
          {activeTab === 'announcements' && (
            <AnnouncementManagement onAnnouncementUpdate={handleDataUpdate} />
          )}
          
          {/* Ads */}
          {activeTab === 'ads' && (
            <AdManagement onAdUpdate={handleDataUpdate} />
          )}
          
          {/* Discount Codes */}
          {activeTab === 'discount-codes' && (
            <DiscountCodeManagement onUpdate={handleDataUpdate} />
          )}
          
          {/* Analytics */}
          {activeTab === 'analytics' && (
            <Analytics onDataUpdate={handleDataUpdate} />
          )}
          
          {/* Settings */}
          {activeTab === 'settings' && renderSettings()}
          
          {/* User Roles */}
          {activeTab === 'user-roles' && (
            <UserRoleManagement />
          )}
          
          {/* Feature Flags */}
          {activeTab === 'feature-flags' && (
            <FeatureFlagManagement onUpdate={handleDataUpdate} />
          )}
          
          {/* Newsletter Management - Always show for admins */}
          {activeTab === 'newsletter' && (
            <NewsletterManagement onUpdate={handleDataUpdate} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
  
  function renderOverview() {
    return (
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Businesses</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats?.total_businesses?.toLocaleString() || 0}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Verified</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats?.verified_businesses?.toLocaleString() || 0}
                </p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Featured</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats?.featured_businesses?.toLocaleString() || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">VIP Members</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats?.member_businesses?.toLocaleString() || 0}
                </p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('businesses')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <Building2 className="h-6 w-6 text-blue-500 mb-2" />
              <h4 className="text-white font-medium">Manage Businesses</h4>
              <p className="text-gray-400 text-sm">Verify, feature, and manage business listings</p>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <Megaphone className="h-6 w-6 text-green-500 mb-2" />
              <h4 className="text-white font-medium">Announcements</h4>
              <p className="text-gray-400 text-sm">Create and manage homepage announcements</p>
            </button>

            <button
              onClick={() => setActiveTab('ads')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <LayoutGrid className="h-6 w-6 text-purple-500 mb-2" />
              <h4 className="text-white font-medium">Manage Ads</h4>
              <p className="text-gray-400 text-sm">Create and manage platform advertisements</p>
            </button>
            
            <button
              onClick={() => setActiveTab('subscriptions')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <CreditCard className="h-6 w-6 text-green-500 mb-2" />
              <h4 className="text-white font-medium">Subscriptions</h4>
              <p className="text-gray-400 text-sm">Track paid subscriptions and revenue</p>
            </button>
            
            <button
              onClick={() => setActiveTab('promotions')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <Percent className="h-6 w-6 text-yellow-500 mb-2" />
              <h4 className="text-white font-medium">Promotions</h4>
              <p className="text-gray-400 text-sm">Manage promotional pricing and offers</p>
            </button>
            
            <button
              onClick={() => setActiveTab('user-roles')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <Shield className="h-6 w-6 text-yellow-500 mb-2" />
              <h4 className="text-white font-medium">User Roles</h4>
              <p className="text-gray-400 text-sm">Manage user roles and permissions</p>
            </button>

            <button
              onClick={() => setActiveTab('discount-codes')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <Tag className="h-6 w-6 text-orange-500 mb-2" />
              <h4 className="text-white font-medium">Discount Codes</h4>
              <p className="text-gray-400 text-sm">Create and manage promotional discount codes</p>
            </button>

            <button
              onClick={() => setActiveTab('feature-flags')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <Flag className="h-6 w-6 text-blue-500 mb-2" />
              <h4 className="text-white font-medium">Feature Flags</h4>
              <p className="text-gray-400 text-sm">Control which features are enabled in production</p>
            </button>

            <button
              onClick={() => setActiveTab('newsletter')}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left relative overflow-hidden"
            >
              <Mail className="h-6 w-6 text-blue-400 mb-2" />
              <h4 className="text-white font-medium">Newsletter</h4>
              <p className="text-gray-400 text-sm">Create and send newsletters</p>
            </button>
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Platform Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <p className="text-white font-medium">Active Businesses</p>
                <p className="text-gray-400 text-sm">Businesses currently visible to users</p>
              </div>
              <span className="text-2xl font-bold text-green-500">
                {loading ? '...' : stats?.active_businesses?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <p className="text-white font-medium">Unclaimed VIP Businesses</p>
                <p className="text-gray-400 text-sm">VIP businesses waiting to be claimed</p>
              </div>
              <span className="text-2xl font-bold text-yellow-500">
                {loading ? '...' : stats?.unclaimed_businesses?.toLocaleString() || 0}
              </span>
            </div>

            {stats && stats.inactive_businesses > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Inactive Businesses</p>
                  <p className="text-gray-400 text-sm">Businesses hidden from public view</p>
                </div>
                <span className="text-2xl font-bold text-red-500">
                  {stats.inactive_businesses.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default AdminDashboardPage;