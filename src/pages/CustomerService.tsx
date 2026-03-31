import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { HeadphonesIcon, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CustomerService = () => {
  const { shipments } = useLogistics();
  const { t } = useTranslation();
  
  const exceptions = shipments.filter(s => ['Failed', 'Lost', 'Rescheduled'].includes(s.status));

  return (
    <div className="p-8 text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Customer Service')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Manage Exceptions & Tickets')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600 dark:text-red-500" />
              {t('Active Exceptions')}
            </h2>
            <span className="bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-500 text-xs font-bold px-2 py-1 rounded-full border border-red-200 dark:border-red-500/30">
              {exceptions.length} {t('Issues')}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {exceptions.map(shipment => (
              <div key={shipment.id} className="bg-gray-50 dark:bg-[#1a1a1a] border border-red-200 dark:border-red-500/30 rounded-lg p-5 hover:border-red-400 dark:hover:border-red-500/60 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400 mr-3">{shipment.trackingNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      shipment.status === 'Failed' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500' : 
                      shipment.status === 'Lost' ? 'bg-gray-200 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
                    }`}>
                      {t(shipment.status)}
                    </span>
                  </div>
                  <button className="bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] text-gray-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                    <MessageSquare size={14} /> {t('Contact')}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <p className="text-gray-500 mb-1">{t('Customer')}</p>
                    <p className="font-medium">{shipment.customerName}</p>
                    <p className="text-gray-500 dark:text-gray-400">{shipment.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">{t('Last Note')}</p>
                    <p className="text-gray-600 dark:text-gray-300 italic">
                      "{shipment.timeline[shipment.timeline.length - 1]?.note || t('No notes provided')}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {exceptions.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-mono flex flex-col items-center">
                <CheckCircle2 size={48} className="mb-4 opacity-20 text-green-500" />
                {t('No active exceptions. Great job!')}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 flex flex-col shadow-sm">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <HeadphonesIcon size={20} className="text-blue-600 dark:text-blue-500" />
            {t('Quick Actions')}
          </h2>
          
          <div className="space-y-3 flex-1">
            <button className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:border-blue-500 p-4 rounded-lg text-left transition-colors group">
              <h3 className="font-bold text-blue-600 dark:text-blue-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 mb-1">{t('Create Ticket')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Open a new support ticket for a customer inquiry.')}</p>
            </button>
            <button className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:border-orange-500 p-4 rounded-lg text-left transition-colors group">
              <h3 className="font-bold text-orange-600 dark:text-orange-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 mb-1">{t('Track Shipment')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Search by tracking number or phone number.')}</p>
            </button>
            <button className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:border-green-500 p-4 rounded-lg text-left transition-colors group">
              <h3 className="font-bold text-green-600 dark:text-green-500 group-hover:text-green-500 dark:group-hover:text-green-400 mb-1">{t('Send SMS Update')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Manually notify customer of delay or status change.')}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
