import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ProfileModal from '../utils/ProfileModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchUserProfile();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_admin', {
        user_uuid: user.id
      });

      if (!error && data === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Failed to check admin status:', err);
      setIsAdmin(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_profile');
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const handleProfileUpdate = () => {
    fetchUserProfile();
  };

  // Get display name for the user
  const getDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    
    return user?.email?.split('@')[0] || 'Account';
  };

  return (
    <header className="bg-black border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              BLACKOWNDEMAND
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/browse" className="text-gray-300 hover:text-white">Search</Link>
            <Link to="/categories" className="text-gray-300 hover:text-white">Categories</Link>
            <Link to="/collaboration" className="text-gray-300 hover:text-white">Collaboration</Link>
            <Link to="/resources" className="text-gray-300 hover:text-white">Resources</Link>
            <Link to="/members" className="text-gray-300 hover:text-white">Members</Link>
            <Link to="/pricing" className="text-gray-300 hover:text-white">Pricing</Link>
            <Link to="/claim-business" className="hidden text-gray-300 hover:text-white">Claim Business</Link>
          </div>

          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden relative group">
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center text-gray-300 hover:text-white px-3 py-2"
                  >
                    <span className="mr-2">{getDisplayName()}</span>
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-300" />
                    </div>
                  </button>
                </div>
                <Link 
                  to="/dashboard" 
                  className="text-gray-300 hover:text-white px-3 py-2"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="text-yellow-400 hover:text-yellow-300 px-3 py-2 font-medium"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white px-3 py-2"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-gray-300 hover:text-white p-2"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div 
          className={`fixed inset-y-0 right-0 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <Link 
                to="/browse" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Search
              </Link>
              <Link 
                to="/categories" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                to="/collaboration" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Collaboration
              </Link>
              <Link 
                to="/resources" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Resources
              </Link>
              <Link 
                to="/members" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Members
              </Link>
              <Link 
                to="/pricing" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
               <Link 
                to="/contact" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                to="/claim-business" 
                className="block text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Claim Business
              </Link>

              <div className="pt-6 border-t border-gray-800">
                {user ? (
                  <>
                    {userProfile?.first_name && (
                      <div className="block text-white font-medium mb-4">
                        Hello, {userProfile.first_name}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="hidden block text-gray-300 hover:text-white mb-4 w-full text-left"
                    >
                      Edit Profile
                    </button>
                    <Link 
                      to="/dashboard" 
                      className="block text-gray-300 hover:text-white mb-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="block text-yellow-400 hover:text-yellow-300 mb-4 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="block text-gray-300 hover:text-white mb-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/signup" 
                      className="block w-full bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </header>
  );
};

export default Header;