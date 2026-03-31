import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const initialRoles: Role[] = [
  { id: '1', name: 'Admin', description: 'Full access to all portals and settings', permissions: ['All Portals', 'Manage Users', 'System Settings'] },
  { id: '2', name: 'Dispatcher', description: 'Access to Dispatch Portal & Live Map', permissions: ['Live Map', 'Dispatch Portal', 'Assign Couriers'] },
  { id: '3', name: 'Finance', description: 'Access to Finance & COD settlement', permissions: ['Finance Portal', 'Settle COD', 'View Reports'] },
  { id: '4', name: 'Customer Service', description: 'Access to CS Portal & Tracking', permissions: ['CS Portal', 'Track Shipments', 'Create Tickets'] },
  { id: '5', name: 'Warehouse', description: 'Access to Receive & Warehouse', permissions: ['Warehouse Portal', 'Receive Returns', 'Inventory'] },
];

const availablePermissions = [
  'All Portals', 'Manage Users', 'System Settings', 'Live Map', 'Dispatch Portal', 'Assign Couriers',
  'Finance Portal', 'Settle COD', 'View Reports', 'CS Portal', 'Track Shipments', 'Create Tickets',
  'Warehouse Portal', 'Receive Returns', 'Inventory'
];

export const RolesPermissions = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveRole = (role: Role) => {
    if (roles.find(r => r.id === role.id)) {
      setRoles(roles.map(r => r.id === role.id ? role : r));
    } else {
      setRoles([...roles, { ...role, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
  };

  return (
    <div className="p-8 text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Roles & Permissions')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Access Control')}</p>
        </div>
        <button
          onClick={() => { setEditingRole({ id: '', name: '', description: '', permissions: [] }); setIsModalOpen(true); }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          {t('Add Role')}
        </button>
      </header>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] flex items-center gap-2">
          <Shield size={20} className="text-orange-500" />
          <h2 className="text-lg font-semibold">{t('System Roles & Permissions')}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {roles.map(role => (
              <div key={role.id} className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl p-5 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t(role.name)}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingRole(role); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteRole(role.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">{t(role.description)}</p>
                
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">{t('Permissions')}</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(perm => (
                      <span key={perm} className="text-[10px] font-mono uppercase tracking-wider bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-[#333]">
                        {t(perm)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {editingRole.id ? t('Edit Role') : t('Create New Role')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Role Name')}</label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Description')}</label>
                <input
                  type="text"
                  value={editingRole.description}
                  onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Permissions')}</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availablePermissions.map(perm => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        editingRole.permissions.includes(perm) 
                          ? 'bg-orange-500 border-orange-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] group-hover:border-orange-500'
                      }`}>
                        {editingRole.permissions.includes(perm) && <Check size={14} />}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t(perm)}</span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={editingRole.permissions.includes(perm)}
                        onChange={(e) => {
                          const newPerms = e.target.checked
                            ? [...editingRole.permissions, perm]
                            : editingRole.permissions.filter(p => p !== perm);
                          setEditingRole({ ...editingRole, permissions: newPerms });
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-[#333]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={() => handleSaveRole(editingRole)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                {t('Save Role')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
