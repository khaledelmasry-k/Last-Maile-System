import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Warehouse as WarehouseIcon, Package, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Warehouse = () => {
  const { shipments } = useLogistics();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const atStation = shipments.filter((s) => s.status === 'AtStation');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return atStation;
    return atStation.filter((s) => [s.trackingNumber, s.customerName, s.address, s.phone].some((v) => String(v).toLowerCase().includes(q)));
  }, [atStation, query]);

  return (
    <div className="p-8 text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Warehouse Management')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Manage Shipments At Station')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Total In Warehouse')}</p>
            <WarehouseIcon size={20} className="text-orange-600 dark:text-orange-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-orange-600 dark:text-orange-500">{atStation.length}</p>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Awaiting Dispatch')}</p>
            <Package size={20} className="text-blue-600 dark:text-blue-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-500">{atStation.filter((s) => !s.assignedTo).length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package size={20} className="text-gray-500 dark:text-gray-400" />
            {t('Inventory List')}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Scan barcode...')} className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-orange-500 transition-colors text-gray-900 dark:text-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a]">
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Tracking #')}</th>
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Customer')}</th>
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Zone')}</th>
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shipment) => (
                <tr key={shipment.id} className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-4 font-mono text-sm font-bold text-orange-600 dark:text-orange-400">{shipment.trackingNumber}</td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{shipment.customerName}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{shipment.address.split(',')[0]}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-200 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500/30">{shipment.assignedTo ? t('Assigned (Pending Pickup)') : t('Unassigned')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length ? <p className="text-center text-sm text-gray-500 py-6">No matching shipments.</p> : null}
        </div>
      </div>
    </div>
  );
};
