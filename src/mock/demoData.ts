import { Courier, Shipment } from '../types';

export const demoCouriers: Courier[] = [
  { id: 'DRV-001', name: 'Mahmoud Saeed', phone: '01099998888', vehicle: 'Van - ABC 123', active: true, location: { lat: 30.0444, lng: 31.2357 } },
  { id: 'DRV-002', name: 'Tarek Youssef', phone: '01188887777', vehicle: 'Motorcycle - XYZ 987', active: true, location: { lat: 31.2001, lng: 29.9187 } },
  { id: 'DRV-003', name: 'Omar Kamal', phone: '01277776666', vehicle: 'Van - DEF 456', active: false, location: { lat: 30.05, lng: 31.25 } },
];

export const demoShipments: Shipment[] = [
  {
    id: 'SHP-1001',
    trackingNumber: 'TRK987654321',
    status: 'AtStation',
    customerName: 'Ahmed Ali',
    phone: '01012345678',
    address: 'Cairo, Nasr City, Makram Ebeid St.',
    destination: { lat: 30.0626, lng: 31.3242 },
    codAmount: 450,
    assignedTo: null,
    timeline: [{ status: 'AtStation', timestamp: new Date().toISOString(), note: 'Received at main hub' }],
  },
  {
    id: 'SHP-1002',
    trackingNumber: 'TRK987654322',
    status: 'Assigned',
    customerName: 'Mona Hassan',
    phone: '01112345678',
    address: 'Giza, Dokki, Tahrir St.',
    destination: { lat: 30.038, lng: 31.211 },
    codAmount: 1200,
    assignedTo: 'DRV-001',
    timeline: [{ status: 'Assigned', timestamp: new Date().toISOString(), note: 'Assigned to driver DRV-001' }],
  },
  {
    id: 'SHP-1003',
    trackingNumber: 'TRK987654323',
    status: 'OutForDelivery',
    customerName: 'Khaled Elmasry',
    phone: '01212345678',
    address: 'Alexandria, Smouha',
    destination: { lat: 31.2156, lng: 29.9553 },
    codAmount: 0,
    assignedTo: 'DRV-002',
    timeline: [{ status: 'OutForDelivery', timestamp: new Date().toISOString(), note: 'Driver is on the way' }],
  },
];
