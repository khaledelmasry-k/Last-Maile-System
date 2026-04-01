export type ShipmentStatus = 'AtStation' | 'Assigned' | 'OutForDelivery' | 'Delivered' | 'Failed' | 'Rescheduled' | 'ReturnedToStation' | 'Lost';

export interface TimelineEvent {
  status: ShipmentStatus;
  timestamp: string;
  note: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  customerName: string;
  phone: string;
  address: string;
  destination?: Location;
  codAmount: number;
  assignedTo: string | null;
  timeline: TimelineEvent[];
  meta?: Record<string, unknown>;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  active: boolean;
  location?: Location;
}
