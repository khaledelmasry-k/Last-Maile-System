import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/rbac';

export const Finance = () => {
  const { shipments, couriers, settleCourierDeliveries } = useLogistics();
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageFinance = hasPermission(user?.role, 'finance.manage');
  const [message, setMessage] = useState('');

  const delivered = shipments.filter((s) => s.status === 'Delivered');
  const unsettledDelivered = delivered.filter((s) => !(s.meta?.settled as boolean));
  const totalCollected = delivered.reduce((sum, s) => sum + s.codAmount, 0);
  const settledToday = delivered
    .filter((s) => !!s.meta?.settledAt && new Date(String(s.meta?.settledAt)).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.codAmount, 0);

  const onSettleCourier = async (courierId: string) => {
    setMessage('');
    if (!canManageFinance) return;
    const result = await settleCourierDeliveries(courierId);
    if (result.ok) {
      setMessage(`Settled ${result.settled} shipments for courier.`);
    } else {
      setMessage(result.error || 'Failed to settle courier');
    }
  };

  return (
    <div className="page-wrap h-full flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Finance & COD')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Settle Cash on Delivery')}</p>
      </header>

      {message ? <p className="mb-3 text-sm text-blue-600 dark:text-blue-400">{message}</p> : null}

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
          <p className="text-4xl font-bold font-mono tracking-tight text-orange-500">{unsettledDelivered.length} <span className="text-lg">{t('Shipments')}</span></p>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Settled Today')}</p>
            <CheckCircle2 size={20} className="text-blue-600 dark:text-blue-500" />
          </div>
          <p className="text-4xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-500">{settledToday} <span className="text-lg">{t('EGP')}</span></p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-semibold">{t('Pending Courier Settlements')}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {couriers.map((courier) => {
              const courierShipments = unsettledDelivered.filter((s) => s.assignedTo === courier.id);
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
                    <button onClick={() => onSettleCourier(courier.id)} disabled={!canManageFinance} className="bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg transition-colors">
                      {t('Settle')}
                    </button>
                  </div>
                </div>
              );
            })}
            {unsettledDelivered.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-mono">{t('No delivered shipments to settle yet.')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
