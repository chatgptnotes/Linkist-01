'use client';

import { useState, useEffect, useCallback } from 'react';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import LockIcon from '@mui/icons-material/Lock';

const Shield = SecurityIcon;
const Plus = AddIcon;
const Trash = DeleteIcon;
const Save = SaveIcon;
const X = CloseIcon;
const Checked = CheckBoxIcon;
const Unchecked = CheckBoxOutlineBlankIcon;
const Lock = LockIcon;

interface Permission {
  id: string;
  module: string;
  action: string;
  key: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  permissions: Permission[];
}

interface GroupedPermissions {
  [module: string]: Permission[];
}

const MODULE_LABELS: Record<string, string> = {
  orders: 'Orders', products: 'Products & Plans', customers: 'Customers',
  analytics: 'Analytics & Dashboard', vouchers: 'Vouchers', founders: 'Founders Program',
  cards: 'NFC Cards', profiles: 'Digital Profiles', communications: 'Communications',
  subscribers: 'Subscribers', users: 'Users', roles: 'Roles & Permissions', settings: 'Settings',
};

const ACTION_ORDER = ['create', 'read', 'update', 'delete', 'manage', 'approve', 'export'];

export default function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', display_name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
        if (!selectedRole && data.length > 0) {
          setSelectedRole(data[0]);
          setEditingPermissions(new Set(data[0].permissions.map((p: Permission) => p.key)));
        }
      }
    } catch (err) { console.error('Failed to fetch roles:', err); }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/permissions');
      if (res.ok) {
        const data = await res.json();
        setAllPermissions(data.permissions || []);
        setGroupedPermissions(data.grouped || {});
      }
    } catch (err) { console.error('Failed to fetch permissions:', err); }
  }, []);

  useEffect(() => {
    Promise.all([fetchRoles(), fetchPermissions()]).finally(() => setLoading(false));
  }, [fetchRoles, fetchPermissions]);

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setEditingPermissions(new Set(role.permissions.map(p => p.key)));
    setError(''); setSuccess('');
  };

  const togglePermission = (key: string) => {
    setEditingPermissions(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    const modulePerms = groupedPermissions[module] || [];
    const moduleKeys = modulePerms.map(p => p.key);
    const allChecked = moduleKeys.every(k => editingPermissions.has(k));
    setEditingPermissions(prev => {
      const next = new Set(prev);
      moduleKeys.forEach(k => allChecked ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}/permissions`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: Array.from(editingPermissions) }),
      });
      if (res.ok) { setSuccess('Permissions saved'); fetchRoles(); }
      else { const data = await res.json(); setError(data.error || 'Failed to save'); }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const createRole = async () => {
    if (!newRole.name || !newRole.display_name) { setError('Name and display name required'); return; }
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRole),
      });
      if (res.ok) { setShowCreateModal(false); setNewRole({ name: '', display_name: '', description: '' }); setSuccess('Role created'); fetchRoles(); }
      else { const data = await res.json(); setError(data.error || 'Failed to create role'); }
    } catch { setError('Network error'); }
  };

  const deleteRole = async (role: Role) => {
    if (role.is_system) return;
    if (!confirm(`Delete role "${role.display_name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/roles?id=${role.id}`, { method: 'DELETE' });
      if (res.ok) { setSuccess('Role deleted'); if (selectedRole?.id === role.id) setSelectedRole(null); fetchRoles(); }
      else { const data = await res.json(); setError(data.error || 'Failed to delete'); }
    } catch { setError('Network error'); }
  };

  const allActions = ACTION_ORDER.filter(action =>
    Object.values(groupedPermissions).some(perms => perms.some(p => p.action === action))
  );
  const moduleOrder = Object.keys(MODULE_LABELS).filter(m => groupedPermissions[m]);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage roles and assign fine-grained permissions</p>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800">
          <Plus className="h-4 w-4" /><span>Create Role</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
          {error}<button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex justify-between items-center">
          {success}<button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-500">Loading roles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Role List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Roles</h3></div>
              <div className="divide-y divide-gray-100">
                {roles.map(role => (
                  <div key={role.id} onClick={() => selectRole(role)}
                    className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${selectedRole?.id === role.id ? 'bg-red-50 border-l-4 border-red-600' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {role.is_system && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                        <span className="font-medium text-sm text-gray-900 truncate">{role.display_name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{role.permissions.length} permissions</p>
                    </div>
                    {!role.is_system && (
                      <button onClick={(e) => { e.stopPropagation(); deleteRole(role); }} className="text-gray-400 hover:text-red-600 ml-2">
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="lg:col-span-3">
            {selectedRole ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedRole.display_name}</h3>
                    <p className="text-sm text-gray-500">{selectedRole.description || 'No description'}</p>
                  </div>
                  <button onClick={savePermissions} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50">
                    <Save className="h-4 w-4" /><span>{saving ? 'Saving...' : 'Save Permissions'}</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">Module</th>
                        {allActions.map(action => (
                          <th key={action} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{action}</th>
                        ))}
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">All</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {moduleOrder.map(module => {
                        const modulePerms = groupedPermissions[module] || [];
                        const moduleKeys = modulePerms.map(p => p.key);
                        const allModuleChecked = moduleKeys.length > 0 && moduleKeys.every(k => editingPermissions.has(k));
                        const someModuleChecked = moduleKeys.some(k => editingPermissions.has(k));
                        return (
                          <tr key={module} className="hover:bg-gray-50">
                            <td className="px-4 py-3"><span className="font-medium text-sm text-gray-900">{MODULE_LABELS[module] || module}</span></td>
                            {allActions.map(action => {
                              const perm = modulePerms.find(p => p.action === action);
                              if (!perm) return <td key={action} className="px-3 py-3 text-center text-gray-300">—</td>;
                              const isChecked = editingPermissions.has(perm.key);
                              return (
                                <td key={action} className="px-3 py-3 text-center">
                                  <button onClick={() => togglePermission(perm.key)} className={`transition-colors ${isChecked ? 'text-red-600 hover:text-red-800' : 'text-gray-300 hover:text-gray-500'}`} title={perm.description}>
                                    {isChecked ? <Checked className="w-5 h-5" /> : <Unchecked className="w-5 h-5" />}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="px-3 py-3 text-center">
                              <button onClick={() => toggleModule(module)} className={`transition-colors ${allModuleChecked ? 'text-red-600 hover:text-red-800' : someModuleChecked ? 'text-orange-400 hover:text-orange-600' : 'text-gray-300 hover:text-gray-500'}`}>
                                {allModuleChecked ? <Checked className="w-5 h-5" /> : <Unchecked className="w-5 h-5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                  {editingPermissions.size} of {allPermissions.length} permissions selected
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a role to view and edit its permissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Role</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name (system key)</label>
                  <input type="text" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. lab_technician" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input type="text" value={newRole.display_name} onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. Lab Technician" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="What this role is responsible for..." />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={createRole} className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800">Create Role</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
