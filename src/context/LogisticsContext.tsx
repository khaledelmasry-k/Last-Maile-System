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
  const { token } = useAuth();

  const authedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(url, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Request failed');
    }
    return payload;
  };

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
      const [shipmentsData, couriersData] = await Promise.all([authedFetch('/api/shipments'), authedFetch('/api/couriers')]);
      setShipments(shipmentsData);
      setCouriers(couriersData);
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
        const couriersData = await authedFetch('/api/couriers');
        setCouriers(couriersData);
      } catch {
        // silent polling failure
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const assignShipment = async (shipmentId: string, courierId: string) => {
    try {
      const updatedShipment = await authedFetch(`/api/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId }),
      });
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
      const updatedShipment = await authedFetch(`/api/shipments/${shipmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
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
