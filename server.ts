import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock Database
let shipments = [
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
    timeline: [
      { status: 'AtStation', timestamp: new Date().toISOString(), note: 'Received at main hub' }
    ]
  },
  {
    id: 'SHP-1002',
    trackingNumber: 'TRK987654322',
    status: 'Assigned',
    customerName: 'Mona Hassan',
    phone: '01112345678',
    address: 'Giza, Dokki, Tahrir St.',
    destination: { lat: 30.0380, lng: 31.2110 },
    codAmount: 1200,
    assignedTo: 'DRV-001',
    timeline: [
      { status: 'AtStation', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Received at main hub' },
      { status: 'Assigned', timestamp: new Date().toISOString(), note: 'Assigned to driver DRV-001' }
    ]
  },
  {
    id: 'SHP-1003',
    trackingNumber: 'TRK987654323',
    status: 'OutForDelivery',
    customerName: 'Khaled Elmasry',
    phone: '01212345678',
    address: 'Alexandria, Smouha',
    destination: { lat: 31.2156, lng: 29.9553 },
    codAmount: 0, // Prepaid
    assignedTo: 'DRV-002',
    timeline: [
      { status: 'AtStation', timestamp: new Date(Date.now() - 172800000).toISOString(), note: 'Received at main hub' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Assigned to driver DRV-002' },
      { status: 'OutForDelivery', timestamp: new Date().toISOString(), note: 'Driver is on the way' }
    ]
  }
];

let couriers = [
  { id: 'DRV-001', name: 'Mahmoud Saeed', phone: '01099998888', vehicle: 'Van - ABC 123', active: true, location: { lat: 30.0444, lng: 31.2357 } },
  { id: 'DRV-002', name: 'Tarek Youssef', phone: '01188887777', vehicle: 'Motorcycle - XYZ 987', active: true, location: { lat: 31.2001, lng: 29.9187 } },
  { id: 'DRV-003', name: 'Omar Kamal', phone: '01277776666', vehicle: 'Van - DEF 456', active: false, location: { lat: 30.0500, lng: 31.2500 } }
];

// Simulate Courier Movement
setInterval(() => {
  couriers.forEach(c => {
    if (c.active && c.location) {
      // Move slightly randomly
      c.location.lat += (Math.random() - 0.5) * 0.002;
      c.location.lng += (Math.random() - 0.5) * 0.002;
    }
  });
}, 3000);

// API Routes
app.get('/api/shipments', (req, res) => {
  res.json(shipments);
});

app.get('/api/couriers', (req, res) => {
  res.json(couriers);
});

app.post('/api/shipments/:id/assign', (req, res) => {
  const { id } = req.params;
  const { courierId } = req.body;
  
  const shipment = shipments.find(s => s.id === id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  shipment.assignedTo = courierId;
  shipment.status = 'Assigned';
  shipment.timeline.push({
    status: 'Assigned',
    timestamp: new Date().toISOString(),
    note: `Assigned to driver ${courierId}`
  });

  res.json(shipment);
});

app.post('/api/shipments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  
  const shipment = shipments.find(s => s.id === id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  shipment.status = status;
  if (status === 'AtStation' || status === 'ReturnedToStation') {
    shipment.assignedTo = null;
  }
  
  shipment.timeline.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status}`
  });

  res.json(shipment);
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
