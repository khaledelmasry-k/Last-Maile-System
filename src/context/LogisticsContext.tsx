import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shipment, Courier, ShipmentStatus } from '../types';
import { useAuth } from './AuthContext';
import { demoCouriers, demoShipments } from '../mock/demoData';

interface LogisticsContextType {
  shipments: Shipment[];
  couriers: Courier[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  assignShipment: (shipmentId: string, courierId: string) => Promise<{ ok: boolean; error?: string }>;
  updateShipmentStatus: (shipmentId: string, status: ShipmentStatus, note?: string) => Promise<{ ok: boolean; error?: string }>;
  importShipmentsFromSheet: (rows: Record<string, unknown>[]) => Promise<{ ok: boolean; added: number; skipped: number; errors: string[] }>;
  settleCourierDeliveries: (courierId: string) => Promise<{ ok: boolean; settled: number; error?: string }>;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);
const DEMO_TOKEN = 'demo-token';
const STATE_KEY = 'lm-logistics-state-v1';

const allowedStatuses: ShipmentStatus[] = ['AtStation', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost'];

const mapExcelRowToShipment = (row: Record<string, unknown>): Shipment | null => {
  const awb = String(row['AWB Number'] || '').trim();
  if (!awb) return null;

  const statusRaw = String(row['Status'] || 'AtStation').trim();
  const status = (allowedStatuses.includes(statusRaw as ShipmentStatus) ? statusRaw : 'AtStation') as ShipmentStatus;
  const codAmount = Number(row['COD'] || 0) || 0;
  const address = String(row['Final Destination'] || row['Consignee Address'] || '').trim();

  return {
    id: awb,
    trackingNumber: awb,
    status,
    customerName: String(row['Consignee Name'] || '').trim() || 'Unknown Customer',
    phone: String(row['Consignee Phone'] || '').trim() || '-',
    address: address || '-',
    codAmount,
    assignedTo: String(row['Driver'] || '').trim() || null,
    timeline: [{ status, timestamp: new Date().toISOString(), note: 'Imported from Excel' }],
    meta: {
      shipperName: row['Shipper Name'] || '',
      shipperPhone: row['Shipper Phone'] || '',
      shipperEmail: row['Shipper Email'] || '',
      consigneeEmail: row['Consignee Email'] || '',
      shipmentReference: row['Shipment Reference'] || '',
      receivedDate: row['Received Date'] || '',
      currentLocation: row['Current Location'] || '',
      currentWarehouse: row['Current Warehouse'] || '',
      finalWarehouse: row['Final Warehouse'] || '',
      numberOfAttempts: row['Number of Attempts'] || '',
      lastAttemptDate: row['Last Attempt Date'] || '',
      daysOnSystem: row['days Number On System'] || '',
      lastUpdate: row['Last Update'] || '',
      declaredValue: row['Declared Value'] || '',
      productsTypes: row['Products types'] || '',
      serviceType: row['Service Type'] || '',
      returnDate: row['Return date'] || '',
      deliveredOn: row['Delivered On'] || '',
      returnSource: row['Return Source'] || '',
    },
  };
};

export const LogisticsProvider = ({ children }: { children: ReactNode }) => {
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { shipments?: Shipment[] };
      return parsed.shipments || [];
    } catch {
      return [];
    }
  });
  const [couriers, setCouriers] = useState<Courier[]>(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { couriers?: Courier[] };
      return parsed.couriers || [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, apiFetch } = useAuth();

  const fetchData = async () => {
    if (!token) {
      setShipments([]);
      setCouriers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (token === DEMO_TOKEN) {
      setShipments(demoShipments);
      setCouriers(demoCouriers);
      setLoading(false);
      return;
    }

    try {
      const [shipmentsPayload, couriersPayload] = await Promise.all([
        apiFetch('/api/shipments'),
        apiFetch('/api/couriers'),
      ]);

      const mappedShipments = ((shipmentsPayload as any[]) || []).map((s) => ({
        id: String(s.id),
        trackingNumber: s.trackingNumber || s.tracking_number,
        customerName: s.customerName || s.customer_name,
        phone: s.phone,
        address: s.address,
        codAmount: Number(s.codAmount ?? s.cod_amount ?? 0),
        status: s.status,
        assignedTo: s.assignedTo || s.assigned_to || null,
        timeline: s.timeline || [],
        meta: s.meta || {},
      })) as Shipment[];

      const mappedCouriers = ((couriersPayload as any[]) || []).map((c) => ({
        id: c.code || c.id,
        name: c.name,
        phone: c.phone,
        vehicle: c.vehicle,
        active: !!c.active,
      })) as Courier[];

      setShipments(mappedShipments);
      setCouriers(mappedCouriers);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
      console.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ shipments, couriers, updatedAt: Date.now() }));
    } catch {
      // ignore quota errors
    }
  }, [shipments, couriers]);

  useEffect(() => {
    if (!token || token === DEMO_TOKEN) return;
    const interval = setInterval(async () => {
      try {
        const couriersData = await apiFetch('/api/couriers');
        const mappedCouriers = ((couriersData as any[]) || []).map((c) => ({
          id: c.code || c.id,
          name: c.name,
          phone: c.phone,
          vehicle: c.vehicle,
          active: !!c.active,
        })) as Courier[];
        setCouriers(mappedCouriers);
      } catch {
        // silent polling failure
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, apiFetch]);

  const assignShipment = async (shipmentId: string, courierId: string) => {
    if (token === DEMO_TOKEN) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipmentId
            ? {
                ...s,
                assignedTo: courierId,
                status: 'Assigned',
                timeline: [...s.timeline, { status: 'Assigned', timestamp: new Date().toISOString(), note: `Assigned to driver ${courierId}` }],
              }
            : s,
        ),
      );
      return { ok: true };
    }

    try {
      await apiFetch(`/api/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId }),
      });
      await fetchData();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign shipment';
      setError(msg);
      return { ok: false, error: msg };
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: ShipmentStatus, note?: string) => {
    if (token === DEMO_TOKEN) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipmentId
            ? {
                ...s,
                status,
                assignedTo: status === 'AtStation' || status === 'ReturnedToStation' ? null : s.assignedTo,
                timeline: [...s.timeline, { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` }],
              }
            : s,
        ),
      );
      return { ok: true };
    }

    try {
      await apiFetch(`/api/shipments/${shipmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      await fetchData();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update shipment status';
      setError(msg);
      return { ok: false, error: msg };
    }
  };

  const importShipmentsFromSheet = async (rows: Record<string, unknown>[]) => {
    const errors: string[] = [];
    const mapped: Shipment[] = [];

    rows.forEach((row, idx) => {
      const shipment = mapExcelRowToShipment(row);
      if (!shipment) {
        errors.push(`Row ${idx + 1}: missing AWB Number`);
        return;
      }
      mapped.push(shipment);
    });

    const existing = new Set(shipments.map((s) => s.trackingNumber.toLowerCase()));
    const fresh = mapped.filter((s) => !existing.has(s.trackingNumber.toLowerCase()));
    const skipped = mapped.length - fresh.length;

    if (!fresh.length) {
      return { ok: true, added: 0, skipped, errors };
    }

    setShipments((prev) => [...fresh, ...prev]);

    return { ok: true, added: fresh.length, skipped, errors };
  };

  const settleCourierDeliveries = async (courierId: string) => {
    try {
      if (token && token !== DEMO_TOKEN) {
        const result = (await apiFetch(`/api/finance/settle/${courierId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })) as { ok: boolean; settled: number };
        await fetchData();
        return { ok: true, settled: result.settled || 0 };
      }

      let settled = 0;
      setShipments((prev) =>
        prev.map((s) => {
          const isTarget = s.assignedTo === courierId && s.status === 'Delivered' && !(s.meta?.settled as boolean);
          if (!isTarget) return s;
          settled += 1;
          return {
            ...s,
            meta: {
              ...(s.meta || {}),
              settled: true,
              settledAt: new Date().toISOString(),
            },
          };
        }),
      );
      return { ok: true, settled };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Settle failed';
      setError(msg);
      return { ok: false, settled: 0, error: msg };
    }
  };

  return <LogisticsContext.Provider value={{ shipments, couriers, loading, error, fetchData, assignShipment, updateShipmentStatus, importShipmentsFromSheet, settleCourierDeliveries }}>{children}</LogisticsContext.Provider>;
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (context === undefined) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
