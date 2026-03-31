const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const app = express();
app.use(cors({ origin: true }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'lastmile-firebase-secret';

const seedUsers = [
  { id: 'U-1', name: 'Admin User', email: 'admin@express.com', role: 'Admin', passwordHash: bcrypt.hashSync('Admin@123', 10), active: true },
  { id: 'U-2', name: 'Dispatcher User', email: 'dispatcher@express.com', role: 'Dispatcher', passwordHash: bcrypt.hashSync('Dispatch@123', 10), active: true },
  { id: 'U-3', name: 'Courier User', email: 'courier@express.com', role: 'Courier', passwordHash: bcrypt.hashSync('Courier@123', 10), active: true },
  { id: 'U-4', name: 'Finance User', email: 'finance@express.com', role: 'Finance', passwordHash: bcrypt.hashSync('Finance@123', 10), active: true },
  { id: 'U-5', name: 'CS User', email: 'cs@express.com', role: 'CS', passwordHash: bcrypt.hashSync('CS@123', 10), active: true },
  { id: 'U-6', name: 'Warehouse User', email: 'warehouse@express.com', role: 'Warehouse', passwordHash: bcrypt.hashSync('Warehouse@123', 10), active: true },
];

const seedCouriers = [
  { id: 'DRV-001', name: 'Mahmoud Saeed', phone: '01099998888', vehicle: 'Van - ABC 123', active: true, location: { lat: 30.0444, lng: 31.2357 } },
  { id: 'DRV-002', name: 'Tarek Youssef', phone: '01188887777', vehicle: 'Motorcycle - XYZ 987', active: true, location: { lat: 31.2001, lng: 29.9187 } },
  { id: 'DRV-003', name: 'Omar Kamal', phone: '01277776666', vehicle: 'Van - DEF 456', active: false, location: { lat: 30.05, lng: 31.25 } },
];

const seedShipments = [
  { id: 'SHP-1001', trackingNumber: 'TRK987654321', status: 'AtStation', customerName: 'Ahmed Ali', phone: '01012345678', address: 'Cairo, Nasr City', codAmount: 450, assignedTo: null, timeline: [{ status: 'AtStation', timestamp: new Date().toISOString(), note: 'Received at hub' }] },
  { id: 'SHP-1002', trackingNumber: 'TRK987654322', status: 'Assigned', customerName: 'Mona Hassan', phone: '01112345678', address: 'Giza, Dokki', codAmount: 1200, assignedTo: 'DRV-001', timeline: [{ status: 'Assigned', timestamp: new Date().toISOString(), note: 'Assigned' }] },
  { id: 'SHP-1003', trackingNumber: 'TRK987654323', status: 'OutForDelivery', customerName: 'Khaled Elmasry', phone: '01212345678', address: 'Alexandria, Smouha', codAmount: 0, assignedTo: 'DRV-002', timeline: [{ status: 'OutForDelivery', timestamp: new Date().toISOString(), note: 'On the way' }] },
];

const db = {
  users: [...seedUsers],
  couriers: [...seedCouriers],
  shipments: [...seedShipments],
  auditLogs: [],
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['Admin', 'Dispatcher', 'Courier', 'Finance', 'CS', 'Warehouse']),
});

const assignSchema = z.object({ courierId: z.string().min(3) });
const statusSchema = z.object({
  status: z.enum(['AtStation', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost']),
  note: z.string().max(250).optional(),
});

const allowedTransitions = {
  AtStation: ['Assigned'],
  Assigned: ['OutForDelivery', 'AtStation'],
  OutForDelivery: ['Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost'],
  Delivered: [],
  Failed: ['ReturnedToStation', 'AtStation'],
  Rescheduled: ['Assigned', 'OutForDelivery', 'AtStation'],
  ReturnedToStation: ['AtStation'],
  Lost: [],
};

const statusActionRoles = {
  AtStation: ['Dispatcher', 'Warehouse', 'Admin'],
  Assigned: ['Dispatcher', 'Admin'],
  OutForDelivery: ['Courier', 'Dispatcher', 'Admin'],
  Delivered: ['Courier', 'Admin'],
  Failed: ['Courier', 'Admin'],
  Rescheduled: ['Courier', 'Dispatcher', 'Admin'],
  ReturnedToStation: ['Warehouse', 'Dispatcher', 'Admin'],
  Lost: ['Dispatcher', 'Admin'],
};

function parseOrThrow(schema, input) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((i) => i.message).join('; '));
    err.status = 400;
    throw err;
  }
  return parsed.data;
}

function auth(req, _res, next) {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) {
      const e = new Error('Unauthorized');
      e.status = 401;
      throw e;
    }
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    const e = new Error('Unauthorized');
    e.status = 401;
    next(e);
  }
}

function requireRole(roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const e = new Error('Forbidden');
      e.status = 403;
      return next(e);
    }
    return next();
  };
}

function audit(user, action, targetType, targetId, payload) {
  db.auditLogs.unshift({ id: `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), actorId: user.id, actorEmail: user.email, action, targetType, targetId, payload });
  db.auditLogs = db.auditLogs.slice(0, 500);
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'functions-api' }));

app.post('/auth/login', (req, res, next) => {
  try {
    const { email, password, role } = parseOrThrow(loginSchema, req.body || {});
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role && u.active);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      const e = new Error('Invalid credentials');
      e.status = 401;
      throw e;
    }
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });
    audit(payload, 'LOGIN', 'auth', user.id);
    res.json({ accessToken, refreshToken: 'firebase-functions-demo', user: payload });
  } catch (err) {
    next(err);
  }
});

app.get('/auth/me', auth, (req, res) => res.json({ user: req.user }));

app.post('/auth/refresh', (_req, res) => res.json({ ok: true }));
app.post('/auth/logout', auth, (req, res) => {
  audit(req.user, 'LOGOUT', 'auth', req.user.id);
  res.json({ ok: true });
});

app.get('/shipments', auth, (req, res) => {
  const status = String(req.query.status || '');
  const search = String(req.query.search || '').toLowerCase();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  let rows = db.shipments.filter((s) => !s.deletedAt);
  if (req.user.role === 'Courier') rows = rows.filter((s) => !!s.assignedTo);
  if (status) rows = rows.filter((s) => s.status === status);
  if (search) rows = rows.filter((s) => [s.id, s.trackingNumber, s.customerName, s.address].join(' ').toLowerCase().includes(search));

  const total = rows.length;
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit);
  res.json({ data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: start + limit < total, hasPrev: page > 1 } });
});

app.get('/couriers', auth, (_req, res) => res.json(db.couriers));

app.post('/shipments/:id/assign', auth, requireRole(['Admin', 'Dispatcher']), (req, res, next) => {
  try {
    const { courierId } = parseOrThrow(assignSchema, req.body || {});
    const shipment = db.shipments.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!shipment) {
      const e = new Error('Shipment not found');
      e.status = 404;
      throw e;
    }
    const courier = db.couriers.find((c) => c.id === courierId && c.active);
    if (!courier) {
      const e = new Error('Courier not found or inactive');
      e.status = 400;
      throw e;
    }
    shipment.assignedTo = courierId;
    shipment.status = 'Assigned';
    shipment.timeline.push({ status: 'Assigned', timestamp: new Date().toISOString(), note: `Assigned to ${courierId}` });
    audit(req.user, 'ASSIGN_SHIPMENT', 'shipment', shipment.id, { courierId });
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

app.post('/shipments/:id/status', auth, (req, res, next) => {
  try {
    const { status, note } = parseOrThrow(statusSchema, req.body || {});
    if (!statusActionRoles[status].includes(req.user.role)) {
      const e = new Error('Forbidden');
      e.status = 403;
      throw e;
    }
    const shipment = db.shipments.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!shipment) {
      const e = new Error('Shipment not found');
      e.status = 404;
      throw e;
    }
    if (!allowedTransitions[shipment.status].includes(status)) {
      const e = new Error(`Invalid transition ${shipment.status} -> ${status}`);
      e.status = 409;
      throw e;
    }
    const from = shipment.status;
    shipment.status = status;
    if (status === 'AtStation' || status === 'ReturnedToStation') shipment.assignedTo = null;
    shipment.timeline.push({ status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` });
    audit(req.user, 'UPDATE_SHIPMENT_STATUS', 'shipment', shipment.id, { from, to: status });
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

app.delete('/shipments/:id', auth, requireRole(['Admin']), (req, res, next) => {
  try {
    const shipment = db.shipments.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!shipment) {
      const e = new Error('Shipment not found');
      e.status = 404;
      throw e;
    }
    shipment.deletedAt = new Date().toISOString();
    audit(req.user, 'SOFT_DELETE_SHIPMENT', 'shipment', shipment.id);
    res.json({ ok: true, shipmentId: shipment.id, deletedAt: shipment.deletedAt });
  } catch (err) {
    next(err);
  }
});

app.get('/audit-logs', auth, requireRole(['Admin']), (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
  const action = String(req.query.action || '');
  const actorId = String(req.query.actorId || '');
  let rows = [...db.auditLogs];
  if (action) rows = rows.filter((r) => r.action === action);
  if (actorId) rows = rows.filter((r) => r.actorId === actorId);
  res.json(rows.slice(0, limit));
});

app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const requestId = `${Date.now()}-${Math.random()}`;
  console.error(`[${requestId}] ${req.method} ${req.path} -> ${status}`, err.message);
  res.status(status).json({ ok: false, error: err.message || 'Internal error', requestId });
});

exports.api = functions.https.onRequest(app);
