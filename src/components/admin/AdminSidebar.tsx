import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Percent, 
  Tag, 
  LayoutGrid, 
  Megaphone, 
  Mail, 
  BarChart3, 
  Shield, 
  Flag, 
  Settings,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Star
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  isOpen?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'business': true,
    'content': true,
    'platform': true
  });

  const menuGroups: MenuGroup[] = [
    {
      title: 'Main',
      items: [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> }
      ]
    },
    {
      title: 'Business & Finance',
      items: [
        { id: 'businesses', label: 'Businesses', icon: <Building2 className="h-5 w-5" /> },
        { id: 'featured-businesses', label: 'Featured Businesses', icon: <Star className="h-5 w-5" /> },
        { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="h-5 w-5" /> },
        { id: 'payment-history', label: 'Payment History', icon: <DollarSign className="h-5 w-5" /> },
        { id: 'promotions', label: 'Promotions', icon: <Percent className="h-5 w-5" /> },
        { id: 'discount-codes', label: 'Discount Codes', icon: <Tag className="h-5 w-5" /> },
        { id: 'ads', label: 'Advertisements', icon: <LayoutGrid className="h-5 w-5" /> }
      ]
    },
    {
      title: 'Content & Communication',
      items: [
        { id: 'announcements', label: 'Announcements', icon: <Megaphone className="h-5 w-5" /> },
        { id: 'newsletter', label: 'Newsletter', icon: <Mail className="h-5 w-5" /> }
      ]
    },
    {
      title: 'Platform Settings',
      items: [
        { id: 'business-verification', label: 'Business Verification', icon: <Shield className="h-5 w-5" /> },
        { id: 'user-roles', label: 'User Roles', icon: <Shield className="h-5 w-5" /> },
        { id: 'feature-flags', label: 'Feature Flags', icon: <Flag className="h-5 w-5" /> },
        { id: 'payment-providers', label: 'Payment Providers', icon: <CreditCard className="h-5 w-5" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> }
      ]
    }
  ];

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle.toLowerCase()]: !prev[groupTitle.toLowerCase()]
    }));
  };

  return (
    <div className="w-64 bg-gray-900 h-full overflow-y-auto flex-shrink-0 border-r border-gray-800">
      <div className="p-4">
        <h2 className="text-xl font-bold text-white mb-6">Admin Dashboard</h2>
        
        <nav className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-400 hover:text-white transition-colors py-2"
              >
                <span>{group.title}</span>
                {expandedGroups[group.title.toLowerCase()] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {expandedGroups[group.title.toLowerCase()] && (
                <div className="space-y-1 pl-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === item.id
                          ? 'bg-white text-black font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;