import React from "react";
import { Link } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Helmet } from "react-helmet-async";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = "Admin Dashboard",
}) => {
  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>{title} | BlackOWNDemand</title>
      </Helmet>

      {/* Admin Header */}
      <header className="bg-gray-900 border-b border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">BlackOWNDemand</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              <span>Back to Site</span>
            </Link>

            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
};

export default AdminLayout;
