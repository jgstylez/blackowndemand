import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  User as UserIcon, 
  Key, 
  Search,
  Shield,
  AlertTriangle,
  Mail,
  Calendar,
  Clock
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: Role[];
}

const UserRoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Reduced from default to 12

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Fetch all users with their roles
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_roles');
      if (usersError) throw usersError;
      setUsers((usersData as unknown as User[]) || []);

      // Fetch all available roles
      const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*').order('name');
      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load users or roles. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId: string, roleName: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Get current user ID for assigned_by_user_id parameter
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to assign roles');
      }

      const { data, error } = await supabase.rpc('assign_user_role', {
        assigned_by_user_id: user.id,
        role_name: roleName,
        target_user_id: userId,
      });

      if (error) throw error;

      if (data) {
        setSuccess(`Role '${roleName}' assigned successfully.`);
        fetchData(); // Refresh data
      } else {
        setError(`Failed to assign role '${roleName}'. It might already be assigned or the role does not exist.`);
      }
    } catch (err) {
      console.error('Error assigning role:', err);
      setError(`Failed to assign role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to remove the '${roleName}' role from this user?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Get current user ID for assigned_by_user_id parameter
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to remove roles');
      }

      const { data, error } = await supabase.rpc('remove_user_role', {
        removed_by_user_id: user.id,
        role_name: roleName,
        target_user_id: userId,
      });

      if (error) throw error;

      if (data) {
        setSuccess(`Role '${roleName}' removed successfully.`);
        fetchData(); // Refresh data
      } else {
        setError(`Failed to remove role '${roleName}'. It might not be assigned.`);
      }
    } catch (err) {
      console.error('Error removing role:', err);
      setError(`Failed to remove role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoleDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoleName.trim()) {
      setError('Role name cannot be empty.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await supabase.from('roles').insert({ 
        name: newRoleName.trim(),
        description: newRoleDescription.trim() || null
      });
      
      if (error) {
        if (error.code === '23505') { // Unique violation
          setError('Role with this name already exists.');
        } else {
          throw error;
        }
      } else {
        setSuccess(`Role '${newRoleName}' added successfully.`);
        setNewRoleName('');
        setNewRoleDescription('');
        setShowRoleForm(false);
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error adding role definition:', err);
      setError(`Failed to add role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoleDefinition = async (roleId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the role '${roleName}'? This will remove it from all users.`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await supabase.from('roles').delete().eq('id', roleId);
      if (error) throw error;
      
      setSuccess(`Role '${roleName}' deleted successfully.`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error deleting role definition:', err);
      setError(`Failed to delete role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Role Management</h2>
          <p className="text-gray-400">Manage user roles and permissions</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Role Definitions */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="h-6 w-6" />
            Role Definitions
          </h3>
          <button
            onClick={() => setShowRoleForm(!showRoleForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showRoleForm ? (
              <>
                <X className="h-5 w-5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                New Role
              </>
            )}
          </button>
        </div>

        {showRoleForm && (
          <form onSubmit={handleAddRoleDefinition} className="mb-6 bg-gray-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., editor, moderator"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Brief description of this role"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !newRoleName.trim()}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Role'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {roles.length === 0 && !loading ? (
            <div className="text-center py-6">
              <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No roles defined yet.</p>
              <p className="text-gray-500 text-sm mt-2">Create your first role to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => (
                <div key={role.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-400" />
                      <h4 className="text-white font-medium">{role.name}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteRoleDefinition(role.id, role.name)}
                      disabled={loading}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      title={`Delete role ${role.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {role.description && (
                    <p className="text-gray-400 text-sm">{role.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Search */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <UserIcon className="h-6 w-6" />
            Users and Their Roles
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>
        </div>

        {loading && paginatedUsers.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
            {searchTerm && (
              <p className="text-gray-500 text-sm mt-2">
                Try a different search term
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedUsers.map(user => (
              <div key={user.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <h4 className="text-white font-medium">{user.email || 'No email'}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(user.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last sign in: {formatDate(user.last_sign_in_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.roles.map(role => (
                      <span key={role.id} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                        {role.name}
                        <button
                          onClick={() => handleRemoveRole(user.id, role.name)}
                          disabled={loading}
                          className="ml-1 text-blue-300 hover:text-white transition-colors disabled:opacity-50"
                          title={`Remove ${role.name} from ${user.email || user.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
                      className="p-1 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                      title="Assign new role"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {selectedUserId === user.id && (
                  <div className="flex gap-2 mt-2 bg-gray-700 p-3 rounded-lg">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignRole(user.id, e.target.value);
                          e.target.value = ''; // Reset select after assigning
                        }
                      }}
                      className="flex-grow px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      defaultValue=""
                      disabled={loading}
                    >
                      <option value="" disabled>Select role to assign</option>
                      {roles
                        .filter(role => !user.roles.some(ur => ur.id === role.id))
                        .map(role => (
                          <option key={role.id} value={role.name}>
                            {role.name}{role.description ? ` - ${role.description}` : ''}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRoleManagement;