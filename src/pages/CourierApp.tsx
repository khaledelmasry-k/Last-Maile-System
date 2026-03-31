import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MapPin, Phone, Package, CheckCircle, XCircle, Clock, Navigation, User } from 'lucide-react';
import { ShipmentStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/rbac';

export const CourierApp = () => {
  const { shipments, couriers, updateShipmentStatus } = useLogistics();
  const { t } = useTranslation();
  const { user } = useAuth();
  const canExecuteCourierActions = hasPermission(user?.role, 'courier.execute');
  const [activeCourierId, setActiveCourierId] = useState<string>('DRV-001'); // Mock login
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const activeCourier = couriers.find(c => c.id === activeCourierId);
  const myShipments = shipments.filter(s => s.assignedTo === activeCourierId);
  
  const pending = myShipments.filter(s => ['Assigned', 'OutForDelivery'].includes(s.status));
  const completed = myShipments.filter(s => ['Delivered', 'Failed', 'Rescheduled'].includes(s.status));

  const handleStatusUpdate = (status: ShipmentStatus) => {
    if (!selectedShipment || !canExecuteCourierActions) return;
    updateShipmentStatus(selectedShipment, status, note);
    setSelectedShipment(null);
    setNote('');
  };

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen text-gray-900 dark:text-white font-sans flex justify-center transition-colors duration-200">
      {/* Mobile Container */}
      <div className="w-full max-w-md bg-white dark:bg-[#111] min-h-screen shadow-2xl flex flex-col relative overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <header className="bg-orange-500 text-white dark:text-black p-5 pt-8 rounded-b-3xl shadow-lg z-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">{t('Courier Portal')}</p>
              <h1 className="text-2xl font-black tracking-tight">{activeCourier?.name || user?.name}</h1>
            </div>
            <div className="w-12 h-12 bg-white dark:bg-black rounded-full flex items-center justify-center text-orange-500 font-bold text-xl">
              {(activeCourier?.name || user?.name || 'C').charAt(0)}
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/20 dark:bg-black/10 rounded-xl p-3 flex-1">
              <p className="text-xs font-bold uppercase opacity-80 mb-1">{t('Pending')}</p>
              <p className="text-2xl font-black">{pending.length}</p>
            </div>
            <div className="bg-white/20 dark:bg-black/10 rounded-xl p-3 flex-1">
              <p className="text-xs font-bold uppercase opacity-80 mb-1">{t('Completed')}</p>
              <p className="text-2xl font-black">{completed.length}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
          <h2 className="text-lg font-bold tracking-tight mb-2 text-gray-900 dark:text-white">{t("Today's Route")}</h2>
          
          {pending.map(shipment => (
            <div 
              key={shipment.id} 
              className={`bg-gray-50 dark:bg-[#1a1a1a] border rounded-2xl p-4 transition-all ${
                selectedShipment === shipment.id ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 dark:border-[#333]'
              }`}
              onClick={() => setSelectedShipment(shipment.id === selectedShipment ? null : shipment.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-mono bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md mb-2 inline-block">
                    {shipment.trackingNumber}
                  </span>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{shipment.customerName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('Collect')}</p>
                  <p className="font-mono font-bold text-orange-500 dark:text-orange-400">{shipment.codAmount} {t('EGP')}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-orange-500" />
                  <span>{shipment.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={16} className="text-orange-500" />
                  <span>{shipment.phone}</span>
                </p>
              </div>

              {/* Action Area - Expands when selected */}
              {selectedShipment === shipment.id && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#333] mt-4 animate-in fade-in slide-in-from-top-2">
                  {shipment.status === 'Assigned' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate('OutForDelivery'); }}
                      disabled={!canExecuteCourierActions}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation size={18} />
                      {t('Start Delivery')}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder={t('Add delivery note (optional)...')} 
                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-[#333] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate('Delivered'); }}
                          disabled={!canExecuteCourierActions}
                          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle size={18} />
                          {t('Delivered')}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate('Failed'); }}
                          disabled={!canExecuteCourierActions}
                          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle size={18} />
                          {t('Failed')}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate('Rescheduled'); }}
                          disabled={!canExecuteCourierActions}
                          className="col-span-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          <Clock size={18} />
                          {t('Reschedule')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {pending.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-mono">{t('No pending deliveries.')}</p>
              <p className="text-sm mt-2">{t("You're all caught up!")}</p>
            </div>
          )}
        </div>

        {/* Bottom Nav Mock */}
        <nav className="absolute bottom-0 w-full bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#333] flex justify-around p-4 pb-6 transition-colors duration-200">
          <button className="text-orange-500 flex flex-col items-center gap-1">
            <Package size={24} />
            <span className="text-[10px] uppercase font-bold tracking-wider">{t('Route')}</span>
          </button>
          <button className="text-gray-400 dark:text-gray-500 flex flex-col items-center gap-1">
            <CheckCircle size={24} />
            <span className="text-[10px] uppercase font-bold tracking-wider">{t('Done')}</span>
          </button>
          <button className="text-gray-400 dark:text-gray-500 flex flex-col items-center gap-1">
            <User size={24} />
            <span className="text-[10px] uppercase font-bold tracking-wider">{t('Profile')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
