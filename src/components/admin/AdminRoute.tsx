import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[]; // Can be a single role or array of roles
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  requiredRole = ['admin', 'editor'] // Default to both admin and editor
}) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    checkUserRoles();
  }, [user]);

  const checkUserRoles = async () => {
    if (!user) {
      setHasRequiredRole(false);
      setLoading(false);
      return;
    }

    try {
      console.log('Checking roles for user:', user.email);
      
      // Convert requiredRole to array if it's a string
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      // Check each required role
      for (const role of requiredRoles) {
        let hasRole = false;
        
        if (role === 'admin') {
          const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
            user_uuid: user.id
          });
          
          if (adminError) {
            throw adminError;
          }
          
          hasRole = isAdmin === true;
        } else if (role === 'editor') {
          const { data: isEditor, error: editorError } = await supabase.rpc('is_editor', {
            user_uuid: user.id
          });
          
          if (editorError) {
            throw editorError;
          }
          
          hasRole = isEditor === true;
        } else {
          // For other roles, use the has_role function
          const { data: hasRoleResult, error: roleError } = await supabase.rpc('has_role', {
            p_user_id: user.id,
            p_role_name: role
          });
          
          if (roleError) {
            throw roleError;
          }
          
          hasRole = hasRoleResult === true;
        }
        
        // If user has any of the required roles, grant access
        if (hasRole) {
          console.log(`User has required role: ${role}`);
          setHasRequiredRole(true);
          setLoading(false);
          return;
        }
      }
      
      // If we get here, user doesn't have any of the required roles
      console.log('User does not have any required roles:', requiredRoles);
      setHasRequiredRole(false);
    } catch (err) {
      console.error('Error checking user roles:', err);
      setError(err instanceof Error ? err : new Error('Unknown error checking user roles'));
      setHasRequiredRole(false);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRequiredRole) {
    console.log('Access denied - user does not have required role(s)');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You don't have permission to access the admin panel.</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;