import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'last-maile-dev-secret';
const DATA_FILE = path.join(process.cwd(), 'server-data.json');

type Role = 'Admin' | 'Dispatcher' | 'Courier' | 'Finance' | 'CS' | 'Warehouse';
type ShipmentStatus = 'AtStation' | 'Assigned' | 'OutForDelivery' | 'Delivered' | 'Failed' | 'Rescheduled' | 'ReturnedToStation' | 'Lost';

type User = { id: string; name: string; email: string; password: string; role: Role };
type Courier = { id: string; name: string; phone: string; vehicle: string; active: boolean; location?: { lat: number; lng: number } };
type Shipment = {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  customerName: string;
  phone: string;
  address: string;
  destination?: { lat: number; lng: number };
  codAmount: number;
  assignedTo: string | null;
  timeline: { status: ShipmentStatus; timestamp: string; note: string }[];
};
type AuditLog = { id: string; at: string; actorId: string; actorEmail: string; action: string; targetType: string; targetId: string; payload?: unknown };

interface DB {
  users: User[];
  couriers: Courier[];
  shipments: Shipment[];
  auditLogs: AuditLog[];
}

const initialDB: DB = {
  users: [
    { id: 'U-1', name: 'Admin User', email: 'admin@express.com', password: 'Admin@123', role: 'Admin' },
    { id: 'U-2', name: 'Dispatcher User', email: 'dispatcher@express.com', password: 'Dispatch@123', role: 'Dispatcher' },
    { id: 'U-3', name: 'Courier User', email: 'courier@express.com', password: 'Courier@123', role: 'Courier' },
    { id: 'U-4', name: 'Finance User', email: 'finance@express.com', password: 'Finance@123', role: 'Finance' },
    { id: 'U-5', name: 'CS User', email: 'cs@express.com', password: 'CS@123', role: 'CS' },
    { id: 'U-6', name: 'Warehouse User', email: 'warehouse@express.com', password: 'Warehouse@123', role: 'Warehouse' },
  ],
  shipments: [
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
      timeline: [
        { status: 'AtStation', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Received at main hub' },
        { status: 'Assigned', timestamp: new Date().toISOString(), note: 'Assigned to driver DRV-001' },
      ],
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
      timeline: [
        { status: 'AtStation', timestamp: new Date(Date.now() - 172800000).toISOString(), note: 'Received at main hub' },
        { status: 'Assigned', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Assigned to driver DRV-002' },
        { status: 'OutForDelivery', timestamp: new Date().toISOString(), note: 'Driver is on the way' },
      ],
    },
  ],
  couriers: [
    { id: 'DRV-001', name: 'Mahmoud Saeed', phone: '01099998888', vehicle: 'Van - ABC 123', active: true, location: { lat: 30.0444, lng: 31.2357 } },
    { id: 'DRV-002', name: 'Tarek Youssef', phone: '01188887777', vehicle: 'Motorcycle - XYZ 987', active: true, location: { lat: 31.2001, lng: 29.9187 } },
    { id: 'DRV-003', name: 'Omar Kamal', phone: '01277776666', vehicle: 'Van - DEF 456', active: false, location: { lat: 30.05, lng: 31.25 } },
  ],
  auditLogs: [],
};

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialDB, null, 2));
}

function readDB(): DB {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw) as DB;
  } catch {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
}

function writeDB(db: DB) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const allowedTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  AtStation: ['Assigned'],
  Assigned: ['OutForDelivery', 'AtStation'],
  OutForDelivery: ['Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost'],
  Delivered: [],
  Failed: ['ReturnedToStation', 'AtStation'],
  Rescheduled: ['Assigned', 'OutForDelivery', 'AtStation'],
  ReturnedToStation: ['AtStation'],
  Lost: [],
};

const statusActionRoles: Record<ShipmentStatus, Role[]> = {
  AtStation: ['Dispatcher', 'Warehouse', 'Admin'],
  Assigned: ['Dispatcher', 'Admin'],
  OutForDelivery: ['Courier', 'Dispatcher', 'Admin'],
  Delivered: ['Courier', 'Admin'],
  Failed: ['Courier', 'Admin'],
  Rescheduled: ['Courier', 'Dispatcher', 'Admin'],
  ReturnedToStation: ['Warehouse', 'Dispatcher', 'Admin'],
  Lost: ['Dispatcher', 'Admin'],
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

function isValidRole(value: unknown): value is Role {
  return ['Admin', 'Dispatcher', 'Courier', 'Finance', 'CS', 'Warehouse'].includes(String(value));
}

function isValidStatus(value: unknown): value is ShipmentStatus {
  return ['AtStation', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost'].includes(String(value));
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function assert(condition: boolean, code: number, message: string) {
  if (!condition) {
    const err = new Error(message) as Error & { status?: number };
    err.status = code;
    throw err;
  }
}

type AuthedRequest = express.Request & { user?: { id: string; email: string; role: Role; name: string } };

function auth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  try {
    const h = req.headers.authorization || '';
    assert(h.startsWith('Bearer '), 401, 'Missing bearer token');
    const token = h.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role; name: string };
    req.user = payload;
    next();
  } catch {
    next(Object.assign(new Error('Unauthorized'), { status: 401 }));
  }
}

function requireRole(roles: Role[]) {
  return (req: AuthedRequest, _res: express.Response, next: express.NextFunction) => {
    if (!req.user) return next(Object.assign(new Error('Unauthorized'), { status: 401 }));
    if (!roles.includes(req.user.role)) return next(Object.assign(new Error('Forbidden'), { status: 403 }));
    return next();
  };
}

function pushAudit(db: DB, user: NonNullable<AuthedRequest['user']>, action: string, targetType: string, targetId: string, payload?: unknown) {
  db.auditLogs.unshift({
    id: randomUUID(),
    at: new Date().toISOString(),
    actorId: user.id,
    actorEmail: user.email,
    action,
    targetType,
    targetId,
    payload,
  });
  db.auditLogs = db.auditLogs.slice(0, 1000);
}

setInterval(() => {
  const db = readDB();
  db.couriers.forEach((c) => {
    if (c.active && c.location) {
      c.location.lat += (Math.random() - 0.5) * 0.002;
      c.location.lng += (Math.random() - 0.5) * 0.002;
    }
  });
  writeDB(db);
}, 3000);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), now: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    assert(typeof email === 'string' && validateEmail(email), 400, 'Valid email is required');
    assert(typeof password === 'string' && password.length >= 6, 400, 'Password must be at least 6 chars');
    assert(isValidRole(role), 400, 'Invalid role');

    const db = readDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role);
    assert(!!user, 401, 'Invalid credentials');

    const payload = { id: user!.id, email: user!.email, role: user!.role, name: user!.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/me', auth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

app.get('/api/shipments', auth, (req: AuthedRequest, res) => {
  const db = readDB();
  if (req.user?.role === 'Courier') {
    return res.json(db.shipments.filter((s) => s.assignedTo));
  }
  return res.json(db.shipments);
});

app.get('/api/couriers', auth, (_req, res) => {
  const db = readDB();
  res.json(db.couriers);
});

app.post('/api/shipments/:id/assign', auth, requireRole(['Dispatcher', 'Admin']), (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { courierId } = req.body || {};
    assert(typeof courierId === 'string' && !!courierId.trim(), 400, 'courierId is required');

    const db = readDB();
    const shipment = db.shipments.find((s) => s.id === id);
    assert(!!shipment, 404, 'Shipment not found');
    const courier = db.couriers.find((c) => c.id === courierId && c.active);
    assert(!!courier, 400, 'Courier not found or inactive');
    assert(['AtStation', 'Assigned'].includes(shipment!.status), 409, 'Shipment is not assignable now');

    shipment!.assignedTo = courierId;
    shipment!.status = 'Assigned';
    shipment!.timeline.push({ status: 'Assigned', timestamp: new Date().toISOString(), note: `Assigned to driver ${courierId}` });

    pushAudit(db, req.user!, 'ASSIGN_SHIPMENT', 'shipment', shipment!.id, { courierId });
    writeDB(db);
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

app.post('/api/shipments/:id/status', auth, (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body || {};

    assert(isValidStatus(status), 400, 'Invalid shipment status');
    assert(statusActionRoles[status].includes(req.user!.role), 403, `Role ${req.user!.role} cannot set status ${status}`);
    if (note !== undefined) assert(typeof note === 'string' && note.length <= 250, 400, 'note must be a short string');

    const db = readDB();
    const shipment = db.shipments.find((s) => s.id === id);
    assert(!!shipment, 404, 'Shipment not found');

    const from = shipment!.status;
    assert(allowedTransitions[from].includes(status), 409, `Invalid transition ${from} -> ${status}`);

    shipment!.status = status;
    if (status === 'AtStation' || status === 'ReturnedToStation') shipment!.assignedTo = null;
    shipment!.timeline.push({ status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` });

    pushAudit(db, req.user!, 'UPDATE_SHIPMENT_STATUS', 'shipment', shipment!.id, { from, to: status, note: note || '' });
    writeDB(db);

    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

app.get('/api/audit-logs', auth, requireRole(['Admin']), (_req, res) => {
  const db = readDB();
  res.json(db.auditLogs);
});

app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500;
  const requestId = randomUUID();
  console.error(`[${requestId}] ${req.method} ${req.path} -> ${status}:`, err.message);
  res.status(status).json({
    ok: false,
    error: err.message || 'Internal server error',
    requestId,
  });
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
