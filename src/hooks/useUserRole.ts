import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to check if a user has a specific role
 * 
 * @param roleName - The name of the role to check for
 * @returns A boolean indicating whether the user has the specified role
 */
export const useUserRole = (roleName: string): boolean => {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Call the has_role RPC function
        const { data, error } = await supabase.rpc('has_role', {
          p_user_id: user.id,
          p_role_name: roleName
        });

        if (error) {
          console.error(`Error checking for role ${roleName}:`, error);
          setHasRole(false);
          return;
        }

        setHasRole(data === true);
      } catch (err) {
        console.error(`Failed to check for role ${roleName}:`, err);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, roleName]);

  return hasRole;
};

export default useUserRole;