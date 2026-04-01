import React, { useRef, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Search, MapPin, User, CheckCircle2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/rbac';

export const DispatchPortal = () => {
  const { shipments, couriers, assignShipment, importShipmentsFromSheet } = useLogistics();
  const { t } = useTranslation();
  const { user } = useAuth();
  const canDispatch = hasPermission(user?.role, 'dispatch.manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const term = searchTerm.trim().toLowerCase();
  const unassignedShipments = shipments.filter((s) => {
    if (!(s.status === 'AtStation' && !s.assignedTo)) return false;
    if (!term) return true;
    return [s.trackingNumber, s.customerName, s.address].some((v) => String(v).toLowerCase().includes(term));
  });
  const assignedShipments = shipments.filter(s => s.assignedTo && s.status === 'Assigned');

  const handleAssign = async (shipmentId: string) => {
    setError('');
    if (!canDispatch) return setError('Not allowed for your role');
    if (!selectedCourier) return setError(t('Please select a courier first'));
    const result = await assignShipment(shipmentId, selectedCourier);
    if (!result.ok) setError(result.error || 'Assign failed');
  };

  const handleExcelUpload = async (file: File) => {
    try {
      setError('');
      setImportResult('');
      if (!canDispatch) return setError('Not allowed for your role');

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

      const result = await importShipmentsFromSheet(rows);
      setImportResult(`Imported: ${result.added}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`);
      if (result.errors.length) setError(result.errors.slice(0, 3).join(' | '));
    } catch {
      setError('Failed to import file');
    }
  };

  return (
    <div className="p-8 text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Dispatch Portal')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Assign Shipments to Couriers')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleExcelUpload(file);
              e.currentTarget.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!canDispatch}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
          >
            <Upload size={16} /> Upload Excel
          </button>
        </div>
      </header>

      {importResult ? <p className="mb-2 text-sm text-green-600 dark:text-green-400">{importResult}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-500">{error}</p> : null}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Left Column: Unassigned Shipments */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-orange-500 text-white dark:text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {unassignedShipments.length}
              </span>
              {t('Unassigned Shipments')}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder={t('Search tracking or zone...')} 
                className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-orange-500 transition-colors text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {unassignedShipments.map(shipment => (
              <div key={shipment.id} className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4 flex items-center justify-between hover:border-orange-500/50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-orange-500 dark:text-orange-400">{shipment.trackingNumber}</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">{t('COD')}: {shipment.codAmount} {t('EGP')}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1"><User size={14} /> {shipment.customerName}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {shipment.address}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleAssign(shipment.id)}
                  disabled={!canDispatch}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {t('Assign')}
                </button>
              </div>
            ))}
            {unassignedShipments.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-mono">
                {t('No unassigned shipments at the station.')}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Couriers & Active Assignments */}
        <div className="flex flex-col gap-6">
          {/* Courier Selection */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('Select Courier')}</h2>
            <div className="space-y-2">
              {couriers.map(courier => (
                <label 
                  key={courier.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCourier === courier.id 
                      ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-500' 
                      : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="courier" 
                      value={courier.id}
                      checked={selectedCourier === courier.id}
                      onChange={() => setSelectedCourier(courier.id)}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedCourier === courier.id ? 'border-orange-500' : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {selectedCourier === courier.id && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{courier.name}</p>
                      <p className="text-xs opacity-70 font-mono">{courier.vehicle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{shipments.filter(s => s.assignedTo === courier.id && s.status !== 'Delivered').length}</p>
                    <p className="text-[10px] uppercase tracking-wider opacity-70">{t('Active')}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Recently Assigned */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a]">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('Recently Assigned')}</h2>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {assignedShipments.slice(0, 5).map(shipment => {
                const courier = couriers.find(c => c.id === shipment.assignedTo);
                return (
                  <div key={shipment.id} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-mono text-gray-700 dark:text-gray-300">{shipment.trackingNumber}</p>
                      <p className="text-xs text-gray-500">{t('Assigned to')} <span className="text-orange-500 dark:text-orange-400">{courier?.name}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
