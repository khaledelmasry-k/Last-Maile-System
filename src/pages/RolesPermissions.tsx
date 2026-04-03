import React from 'react';
import { Shield, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { rolePermissions } from '../config/rbac';

const allPermissions = [
  'dashboard.view',
  'map.view',
  'dispatch.manage',
  'courier.execute',
  'returns.manage',
  'finance.manage',
  'cs.manage',
  'performance.view',
  'warehouse.manage',
  'roles.manage',
] as const;

const roleLabels: Record<keyof typeof rolePermissions, string> = {
  Admin: 'Admin',
  Dispatcher: 'Dispatcher',
  Courier: 'Courier',
  Finance: 'Finance',
  CS: 'CS',
  Warehouse: 'Warehouse',
};

export const RolesPermissions = () => {
  const { t } = useTranslation();

  return (
    <div className="page-wrap text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">{t('Roles & Permissions')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-xs md:text-sm uppercase">{t('Access Control')} - Applied Matrix</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="panel p-3">
          <p className="text-xs text-gray-500 uppercase">{t('Roles')}</p>
          <p className="text-xl font-bold">{Object.keys(rolePermissions).length}</p>
        </div>
        <div className="panel p-3">
          <p className="text-xs text-gray-500 uppercase">{t('Permissions')}</p>
          <p className="text-xl font-bold">{allPermissions.length}</p>
        </div>
        <div className="panel p-3">
          <p className="text-xs text-gray-500 uppercase">{t('Admin Grants')}</p>
          <p className="text-xl font-bold">{rolePermissions.Admin.length}</p>
        </div>
        <div className="panel p-3">
          <p className="text-xs text-gray-500 uppercase">{t('Restricted Roles')}</p>
          <p className="text-xl font-bold">{Object.values(rolePermissions).filter((x) => x.length < allPermissions.length).length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 md:p-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] flex items-center gap-2">
          <Shield size={20} className="text-orange-500" />
          <h2 className="text-base md:text-lg font-semibold">{t('System Roles & Permissions')}</h2>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-[#2a2a2a]">
                <th className="py-3 px-2">Permission</th>
                {Object.keys(rolePermissions).map((role) => (
                  <th key={role} className="py-3 px-2 text-center">{t(roleLabels[role as keyof typeof roleLabels])}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((perm) => (
                <tr key={perm} className="border-b border-gray-100 dark:border-[#1f1f1f]">
                  <td className="py-3 px-2 font-mono text-xs md:text-sm">{perm}</td>
                  {Object.entries(rolePermissions).map(([role, perms]) => (
                    <td key={`${perm}-${role}`} className="py-3 px-2 text-center">
                      {perms.includes(perm) ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                          <X size={14} />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
