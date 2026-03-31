import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shipment, Courier, ShipmentStatus } from '../types';
import { useAuth } from './AuthContext';

interface LogisticsContextType {
  shipments: Shipment[];
  couriers: Courier[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  assignShipment: (shipmentId: string, courierId: string) => Promise<{ ok: boolean; error?: string }>;
  updateShipmentStatus: (shipmentId: string, status: ShipmentStatus, note?: string) => Promise<{ ok: boolean; error?: string }>;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider = ({ children }: { children: ReactNode }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
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
    try {
      const [shipmentsPayload, couriersPayload] = await Promise.all([
        apiFetch('/api/shipments?limit=500'),
        apiFetch('/api/couriers'),
      ]);
      setShipments((shipmentsPayload as { data: Shipment[] }).data || []);
      setCouriers((couriersPayload as Courier[]) || []);
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
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const couriersData = await apiFetch('/api/couriers');
        setCouriers((couriersData as Courier[]) || []);
      } catch {
        // silent polling failure
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, apiFetch]);

  const assignShipment = async (shipmentId: string, courierId: string) => {
    try {
      const updatedShipment = (await apiFetch(`/api/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId }),
      })) as Shipment;
      setShipments((prev) => prev.map((s) => (s.id === shipmentId ? updatedShipment : s)));
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign shipment';
      setError(msg);
      return { ok: false, error: msg };
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: ShipmentStatus, note?: string) => {
    try {
      const updatedShipment = (await apiFetch(`/api/shipments/${shipmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      })) as Shipment;
      setShipments((prev) => prev.map((s) => (s.id === shipmentId ? updatedShipment : s)));
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update shipment status';
      setError(msg);
      return { ok: false, error: msg };
    }
  };

  return <LogisticsContext.Provider value={{ shipments, couriers, loading, error, fetchData, assignShipment, updateShipmentStatus }}>{children}</LogisticsContext.Provider>;
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (context === undefined) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
