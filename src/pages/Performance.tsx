import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Performance = () => {
  const { shipments, couriers } = useLogistics();
  const { t } = useTranslation();
  
  const total = shipments.length;
  const delivered = shipments.filter(s => s.status === 'Delivered').length;
  const failed = shipments.filter(s => ['Failed', 'Lost'].includes(s.status)).length;
  
  const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0;

  return (
    <div className="page-wrap text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Performance & SLA')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Key Performance Indicators')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Delivery Success Rate')}</p>
            <TrendingUp size={20} className="text-green-600 dark:text-green-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-green-600 dark:text-green-500">{successRate}%</p>
          <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-green-600 dark:bg-green-500 h-full" style={{ width: `${successRate}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Failure Rate')}</p>
            <TrendingDown size={20} className="text-red-600 dark:text-red-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-red-600 dark:text-red-500">{failureRate}%</p>
          <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-red-600 dark:bg-red-500 h-full" style={{ width: `${failureRate}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Active Couriers')}</p>
            <Activity size={20} className="text-blue-600 dark:text-blue-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-500">
            {couriers.filter(c => c.active).length} <span className="text-lg text-gray-400 dark:text-gray-500">/ {couriers.length}</span>
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={20} className="text-orange-600 dark:text-orange-500" />
            {t('Courier Leaderboard')}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a]">
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Courier')}</th>
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Total Assigned')}</th>
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Delivered')}</th>
                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider">{t('Success Rate')}</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((courier) => {
                const assigned = shipments.filter(s => s.assignedTo === courier.id);
                const deliveredCount = assigned.filter(s => s.status === 'Delivered').length;
                const rate = assigned.length > 0 ? Math.round((deliveredCount / assigned.length) * 100) : 0;
                
                return (
                  <tr key={courier.id} className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{courier.name}</td>
                    <td className="p-4 font-mono text-sm text-gray-500 dark:text-gray-400">{assigned.length}</td>
                    <td className="p-4 font-mono text-sm text-green-600 dark:text-green-500">{deliveredCount}</td>
                    <td className="p-4 font-mono text-sm">
                      <span className={`px-2 py-1 rounded ${
                        rate >= 90 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500' : 
                        rate >= 70 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
