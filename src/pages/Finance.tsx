import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Finance = () => {
  const { shipments, couriers } = useLogistics();
  const { t } = useTranslation();
  
  const delivered = shipments.filter(s => s.status === 'Delivered');
  const totalCollected = delivered.reduce((sum, s) => sum + s.codAmount, 0);

  return (
    <div className="p-8 text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Finance & COD')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Settle Cash on Delivery')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Total Collected')}</p>
            <DollarSign size={20} className="text-green-600 dark:text-green-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-green-600 dark:text-green-500">{totalCollected} <span className="text-lg">{t('EGP')}</span></p>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Pending Settlement')}</p>
            <FileText size={20} className="text-orange-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-orange-500">{delivered.length} <span className="text-lg">{t('Shipments')}</span></p>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Settled Today')}</p>
            <CheckCircle2 size={20} className="text-blue-600 dark:text-blue-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-500">0 <span className="text-lg">{t('EGP')}</span></p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-semibold">{t('Pending Courier Settlements')}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {couriers.map(courier => {
              const courierShipments = delivered.filter(s => s.assignedTo === courier.id);
              const courierTotal = courierShipments.reduce((sum, s) => sum + s.codAmount, 0);
              
              if (courierShipments.length === 0) return null;

              return (
                <div key={courier.id} className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{courier.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{courierShipments.length} {t('Delivered Shipments')}</p>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('To Collect')}</p>
                      <p className="font-mono font-bold text-2xl text-green-600 dark:text-green-500">{courierTotal} {t('EGP')}</p>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 text-white font-bold px-6 py-3 rounded-lg transition-colors">
                      {t('Settle')}
                    </button>
                  </div>
                </div>
              );
            })}
            {delivered.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-mono">
                {t('No delivered shipments to settle yet.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
