'use client';

import { useState, useEffect } from 'react';
import RolesTab from './RolesTab';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

const UsersIcon = GroupsIcon;
const Search = SearchIcon;
const Filter = FilterListIcon;
const Plus = AddIcon;
const Edit = EditIcon;
const Trash2 = DeleteIcon;
const Shield = SecurityIcon;
const ShieldCheck = VerifiedUserIcon;
const Calendar = CalendarTodayIcon;
const Eye = VisibilityIcon;
const EyeOff = VisibilityOffIcon;
const Download = CloudDownloadIcon;
const X = CloseIcon;
const PersonAvatar = PersonIcon;

const MODULE_OPTIONS = [
  { key: 'customers', label: 'Customers' },
  { key: 'orders', label: 'Orders' },
  { key: 'products', label: 'Products' },
  { key: 'vouchers', label: 'Vouchers' },
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'founders', label: 'Founders Circle' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'communications', label: 'Communications' },
  { key: 'users', label: 'Admin Users' },
  { key: 'roles', label: 'Roles' },
  { key: 'settings', label: 'Settings' },
];

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
}

interface UserFilters {
  role: string;
  status: string;
  search: string;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  operations_admin: 'bg-blue-100 text-blue-800',
  customer_support_admin: 'bg-teal-100 text-teal-800',
  finance_admin: 'bg-green-100 text-green-800',
  marketing_admin: 'bg-orange-100 text-orange-800',
  product_tech_admin: 'bg-indigo-100 text-indigo-800',
  fulfilment_admin: 'bg-amber-100 text-amber-800',
  user: 'bg-gray-100 text-gray-800',
};

const RolesIcon = Shield;

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filters, setFilters] = useState<UserFilters>({ role: '', status: '', search: '' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formStatus, setFormStatus] = useState('active');
  const [formModules, setFormModules] = useState<string[]>([]);

  useEffect(() => {
    // Parallel: users + roles are independent (saves ~300-500ms)
    Promise.all([fetchUsers(), fetchRoles()]);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const openEditModal = async (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormModules([]);
    setShowUserModal(true);

    // Fetch user's current module access
    try {
      const res = await fetch(`/api/admin/users/${user.id}/modules`);
      if (res.ok) {
        const data = await res.json();
        setFormModules(data.modules || []);
      }
    } catch {
      // Non-fatal
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('user');
    setFormStatus('active');
    setFormModules([]);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingUser) {
        // Update existing user — assign role
        const roleRes = await fetch(`/api/admin/users/${editingUser.id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_name: formRole, modules: formModules }),
        });

        if (!roleRes.ok) {
          const data = await roleRes.json();
          setError(data.error || 'Failed to update role');
          return;
        }

        setSuccess(`Role updated for ${formEmail}`);
      } else {
        // Create new user
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            phone: formPhone,
            role: formRole,
            status: formStatus,
            modules: formModules,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to create user');
          return;
        }

        setSuccess('User created successfully');
      }

      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess(`User "${userName}" deleted`);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch {
      setError('Network error');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesSearch = !filters.search ||
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  const getRoleColor = (role: string) => ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';
  const getRoleDisplay = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role?.display_name || roleName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'roles'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <RolesIcon className="h-4 w-4" />
            <span>Roles</span>
          </button>
        </div>

        {/* Roles Tab Content */}
        {activeTab === 'roles' && <RolesTab />}

        {/* Users Tab Content */}
        {activeTab === 'users' && <>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-500">Manage users, assign roles, and control access</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
            {error}
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex justify-between items-center">
            {success}
            <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ role: '', status: '', search: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : []);
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                        <span className="ml-2 text-gray-500">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            setSelectedUsers(e.target.checked
                              ? [...selectedUsers, user.id]
                              : selectedUsers.filter(id => id !== user.id));
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <PersonAvatar className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {(user.role === 'super_admin' || user.role === 'admin') && <Shield className="w-3 h-3 mr-1" />}
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit user & role"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Modal — Create / Edit with Role Assignment */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingUser ? 'Edit User & Assign Role' : 'Add New User'}
                  </h2>
                  <button
                    onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSaveUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="John Doe"
                        required={!editingUser}
                        disabled={!!editingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="user@example.com"
                        required={!editingUser}
                        disabled={!!editingUser}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="+91 98765 43210"
                        required={!editingUser}
                        disabled={!!editingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.name}>{role.display_name}</option>
                        ))}
                        {/* Fallback if roles haven't loaded */}
                        {roles.length === 0 && (
                          <>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </>
                        )}
                      </select>
                      {/* Role description */}
                      {roles.find(r => r.name === formRole)?.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {roles.find(r => r.name === formRole)?.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Module Access Checkboxes */}
                  {formRole !== 'user' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Module Access</label>
                      <p className="text-xs text-gray-500 mb-3">
                        Select which admin modules this user can access. Dashboard is always visible.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {MODULE_OPTIONS.map((mod) => {
                          const isSuperAdmin = formRole === 'super_admin';
                          return (
                            <label key={mod.key} className="flex items-center space-x-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSuperAdmin || formModules.includes(mod.key)}
                                disabled={isSuperAdmin}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormModules([...formModules, mod.key]);
                                  } else {
                                    setFormModules(formModules.filter(m => m !== mod.key));
                                  }
                                }}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
                              />
                              <span className={isSuperAdmin ? 'text-gray-400' : 'text-gray-700'}>
                                {mod.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {formRole === 'super_admin' && (
                        <p className="text-xs text-gray-400 mt-2">Super Admin has access to all modules.</p>
                      )}
                    </div>
                  )}

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      )}
                      {saving
                        ? (editingUser ? 'Updating...' : 'Creating...')
                        : (editingUser ? 'Update Role' : 'Create User')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        </>}
      </div>
    </>
  );
}
