import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shipment, Courier, ShipmentStatus } from '../types';

interface LogisticsContextType {
  shipments: Shipment[];
  couriers: Courier[];
  loading: boolean;
  fetchData: () => Promise<void>;
  assignShipment: (shipmentId: string, courierId: string) => Promise<void>;
  updateShipmentStatus: (shipmentId: string, status: ShipmentStatus, note?: string) => Promise<void>;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider = ({ children }: { children: ReactNode }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shipmentsRes, couriersRes] = await Promise.all([
        fetch('/api/shipments'),
        fetch('/api/couriers')
      ]);
      const shipmentsData = await shipmentsRes.json();
      const couriersData = await couriersRes.json();
      
      setShipments(shipmentsData);
      setCouriers(couriersData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for real-time courier locations
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/couriers');
        const couriersData = await res.json();
        setCouriers(couriersData);
      } catch (error) {
        console.error("Failed to fetch couriers", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const assignShipment = async (shipmentId: string, courierId: string) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId })
      });
      const updatedShipment = await res.json();
      setShipments(prev => prev.map(s => s.id === shipmentId ? updatedShipment : s));
    } catch (error) {
      console.error("Failed to assign shipment", error);
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: ShipmentStatus, note?: string) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      const updatedShipment = await res.json();
      setShipments(prev => prev.map(s => s.id === shipmentId ? updatedShipment : s));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  return (
    <LogisticsContext.Provider value={{ shipments, couriers, loading, fetchData, assignShipment, updateShipmentStatus }}>
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (context === undefined) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
