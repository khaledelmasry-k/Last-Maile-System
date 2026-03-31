import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Package, Truck, CheckCircle, AlertCircle, Clock, Users, ShieldAlert, Warehouse } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export const AdminDashboard = () => {
  const { shipments, couriers, loading } = useLogistics();
  const { t } = useTranslation();

  if (loading) return <div className="p-8 text-gray-900 dark:text-white font-mono">{t('Loading system data...')}</div>;

  const stats = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === 'Delivered').length,
    outForDelivery: shipments.filter(s => s.status === 'OutForDelivery').length,
    atStation: shipments.filter(s => s.status === 'AtStation').length,
    exceptions: shipments.filter(s => ['Failed', 'Lost', 'ReturnedToStation'].includes(s.status)).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
      case 'OutForDelivery': return 'text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'AtStation': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20';
      case 'Assigned': return 'text-purple-600 dark:text-purple-500 bg-purple-100 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20';
      default: return 'text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    }
  };

  return (
    <div className="p-8 text-gray-900 dark:text-white transition-colors duration-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('System Overview')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Real-time Last-Mile Metrics')}</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard title={t('Total Shipments')} value={stats.total} icon={Package} color="text-gray-900 dark:text-white" />
        <StatCard title={t('At Station')} value={stats.atStation} icon={Warehouse} color="text-gray-500 dark:text-gray-400" />
        <StatCard title={t('Out for Delivery')} value={stats.outForDelivery} icon={Truck} color="text-blue-500" />
        <StatCard title={t('Delivered')} value={stats.delivered} icon={CheckCircle} color="text-green-500" />
        <StatCard title={t('Exceptions')} value={stats.exceptions} icon={AlertCircle} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a]">
            <h2 className="text-lg font-semibold">{t('Recent Shipments')}</h2>
            <span className="text-xs font-mono text-gray-600 dark:text-gray-500 bg-white dark:bg-[#2a2a2a] px-2 py-1 rounded border border-gray-200 dark:border-transparent">{t('LIVE')}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a]">
                  <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Tracking #')}</th>
                  <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Customer')}</th>
                  <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                  <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Courier')}</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => {
                  const courier = couriers.find(c => c.id === shipment.assignedTo);
                  
                  return (
                    <tr key={shipment.id} className="border-b border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-mono text-sm">{shipment.trackingNumber}</td>
                      <td className="p-4">
                        <div className="font-medium">{shipment.customerName}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(shipment.status)}`}>
                          {t(shipment.status)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                        {courier ? courier.name : <span className="text-gray-400 dark:text-gray-600 italic">{t('Unassigned')}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles & Permissions Management */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert size={18} className="text-orange-500" />
              {t('Access Control')}
            </h2>
            <button className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              + {t('Add Role')}
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono uppercase tracking-wider">{t('System Roles & Permissions')}</p>
            <div className="space-y-3">
              <RoleCard name="Admin" desc="Full access to all portals and settings" users={2} color="bg-orange-500" permissions={['All Portals', 'Manage Users', 'System Settings']} />
              <RoleCard name="Dispatcher" desc="Access to Dispatch Portal & Live Map" users={5} color="bg-blue-500" permissions={['Live Map', 'Dispatch Portal', 'Assign Couriers']} />
              <RoleCard name="Finance" desc="Access to Finance & COD settlement" users={3} color="bg-green-500" permissions={['Finance Portal', 'Settle COD', 'View Reports']} />
              <RoleCard name="Customer Service" desc="Access to CS Portal & Tracking" users={8} color="bg-purple-500" permissions={['CS Portal', 'Track Shipments', 'Create Tickets']} />
              <RoleCard name="Warehouse" desc="Access to Receive & Warehouse" users={4} color="bg-yellow-500" permissions={['Warehouse Portal', 'Receive Returns', 'Inventory']} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleCard = ({ name, desc, users, color, permissions }: any) => {
  const { t } = useTranslation();
  return (
  <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-4 rounded-lg flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t(name)}</h3>
      </div>
      <div className="flex items-center gap-1 text-xs font-mono bg-white dark:bg-[#2a2a2a] px-2 py-1 rounded text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-transparent">
        <Users size={12} /> {users} {t('Users')}
      </div>
    </div>
    <p className="text-xs text-gray-500">{t(desc)}</p>
    <div className="flex flex-wrap gap-2 mt-1">
      {permissions.map((perm: string) => (
        <span key={perm} className="text-[10px] font-mono uppercase tracking-wider bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 px-2 py-1 rounded border border-gray-200 dark:border-[#333]">
          {t(perm)}
        </span>
      ))}
    </div>
    <div className="flex justify-end gap-2 mt-2 border-t border-gray-200 dark:border-[#333] pt-3">
      <button className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('Edit')}</button>
      <button className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('Manage Users')}</button>
    </div>
  </div>
)};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3 shadow-sm">
    <div className="flex justify-between items-start">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <Icon size={20} className={color} />
    </div>
    <p className="text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">{value}</p>
  </div>
);
