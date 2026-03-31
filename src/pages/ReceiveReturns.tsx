import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { PackageX, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ReceiveReturns = () => {
  const { shipments, updateShipmentStatus } = useLogistics();
  const { t } = useTranslation();
  
  const returns = shipments.filter(s => ['Failed', 'Rescheduled', 'ReturnedToStation'].includes(s.status));

  const handleProcessReturn = (id: string) => {
    updateShipmentStatus(id, 'ReturnedToStation', 'Processed return at station');
  };

  const handleReDispatch = (id: string) => {
    updateShipmentStatus(id, 'AtStation', 'Ready for re-dispatch');
  };

  return (
    <div className="p-8 text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Receive & Returns')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Manage Failed & Returned Shipments')}</p>
      </header>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] flex gap-4 bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20">
            <PackageX size={16} /> {t('Failed')}: {returns.filter(r => r.status === 'Failed').length}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-200 dark:border-yellow-500/20">
            <RefreshCcw size={16} /> {t('Rescheduled')}: {returns.filter(r => r.status === 'Rescheduled').length}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {returns.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <AlertTriangle size={48} className="mb-4 opacity-20" />
              <p className="font-mono">{t('No returns to process.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {returns.map(shipment => (
                <div key={shipment.id} className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono font-bold text-orange-500 dark:text-orange-400">{shipment.trackingNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      shipment.status === 'Failed' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
                    }`}>
                      {t(shipment.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-300 mb-1">{shipment.customerName}</p>
                  <p className="text-xs text-gray-500 mb-4">{shipment.address}</p>
                  
                  <div className="flex gap-2">
                    {shipment.status !== 'ReturnedToStation' && (
                      <button 
                        onClick={() => handleProcessReturn(shipment.id)}
                        className="flex-1 bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] text-gray-900 dark:text-white text-xs font-bold py-2 rounded transition-colors"
                      >
                        {t('Process Return')}
                      </button>
                    )}
                    <button 
                      onClick={() => handleReDispatch(shipment.id)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white dark:text-black text-xs font-bold py-2 rounded transition-colors"
                    >
                      {t('Re-Dispatch')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
