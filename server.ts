import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'last-maile-dev-secret';
const ACCESS_TOKEN_TTL = '20m';
const REFRESH_TOKEN_TTL = '14d';
const RUNTIME_DIR = path.join(process.cwd(), '.runtime');
const DATA_FILE = path.join(RUNTIME_DIR, 'server-data.json');

type Role = 'Admin' | 'Dispatcher' | 'Courier' | 'Finance' | 'CS' | 'Warehouse';
type ShipmentStatus = 'AtStation' | 'Assigned' | 'OutForDelivery' | 'Delivered' | 'Failed' | 'Rescheduled' | 'ReturnedToStation' | 'Lost';

type User = { id: string; name: string; email: string; passwordHash: string; role: Role; active: boolean };
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
  meta?: Record<string, unknown>;
  deletedAt?: string | null;
};
type AuditLog = { id: string; at: string; actorId: string; actorEmail: string; action: string; targetType: string; targetId: string; payload?: unknown };
type RefreshSession = { id: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string; revokedAt?: string | null };

interface DB {
  users: User[];
  couriers: Courier[];
  shipments: Shipment[];
  auditLogs: AuditLog[];
  refreshSessions: RefreshSession[];
}

const plainSeedUsers = [
  { id: 'U-1', name: 'Admin User', email: 'admin@express.com', password: 'Admin@123', role: 'Admin' as Role, active: true },
  { id: 'U-2', name: 'Dispatcher User', email: 'dispatcher@express.com', password: 'Dispatch@123', role: 'Dispatcher' as Role, active: true },
  { id: 'U-3', name: 'Courier User', email: 'courier@express.com', password: 'Courier@123', role: 'Courier' as Role, active: true },
  { id: 'U-4', name: 'Finance User', email: 'finance@express.com', password: 'Finance@123', role: 'Finance' as Role, active: true },
  { id: 'U-5', name: 'CS User', email: 'cs@express.com', password: 'CS@123', role: 'CS' as Role, active: true },
  { id: 'U-6', name: 'Warehouse User', email: 'warehouse@express.com', password: 'Warehouse@123', role: 'Warehouse' as Role, active: true },
];

const initialDB: DB = {
  users: plainSeedUsers.map((u) => ({ ...u, passwordHash: bcrypt.hashSync(u.password, 10) } as User)),
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
  refreshSessions: [],
};

if (!fs.existsSync(RUNTIME_DIR)) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialDB, null, 2));
}

function readDB(): DB {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const users = ((parsed.users as Array<Record<string, unknown>>) || []).map((u) => {
      if (typeof u.passwordHash === 'string') return u as User;
      const fallback = typeof u.password === 'string' ? u.password : 'ChangeMe@123';
      return {
        id: String(u.id),
        name: String(u.name || ''),
        email: String(u.email || ''),
        role: String(u.role || 'Courier') as Role,
        active: u.active === false ? false : true,
        passwordHash: bcrypt.hashSync(fallback, 10),
      } as User;
    });

    return {
      users,
      couriers: (parsed.couriers || []) as Courier[],
      shipments: (parsed.shipments || []) as Shipment[],
      auditLogs: (parsed.auditLogs || []) as AuditLog[],
      refreshSessions: (parsed.refreshSessions || []) as RefreshSession[],
    };
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
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 240, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

function isValidRole(value: unknown): value is Role {
  return ['Admin', 'Dispatcher', 'Courier', 'Finance', 'CS', 'Warehouse'].includes(String(value));
}

function isValidStatus(value: unknown): value is ShipmentStatus {
  return ['AtStation', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost'].includes(String(value));
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['Admin', 'Dispatcher', 'Courier', 'Finance', 'CS', 'Warehouse']),
});

const refreshSchema = z.object({ refreshToken: z.string().min(20) });
const logoutSchema = z.object({ refreshToken: z.string().min(20).optional() });
const assignSchema = z.object({ courierId: z.string().min(3).max(50) });
const statusSchema = z.object({
  status: z.enum(['AtStation', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost']),
  note: z.string().max(250).optional(),
});
const shipmentsQuerySchema = z.object({
  status: z.enum(['AtStation', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  actorId: z.string().max(64).optional(),
  action: z.string().max(64).optional(),
});

const importShipmentRowSchema = z.object({
  'AWB Number': z.string().min(1),
  'Consignee Name': z.string().optional().default(''),
  'Consignee Phone': z.string().optional().default(''),
  'Consignee Address': z.string().optional().default(''),
  'Final Destination': z.string().optional().default(''),
  COD: z.union([z.string(), z.number()]).optional(),
  Status: z.string().optional().default('AtStation'),
  Driver: z.string().optional().default(''),
}).passthrough();

const importShipmentsSchema = z.object({
  rows: z.array(importShipmentRowSchema).min(1).max(5000),
});

function parseOrThrow<T>(schema: z.ZodSchema<T>, input: unknown, status = 400): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')) as Error & { status?: number };
    err.status = status;
    throw err;
  }
  return parsed.data;
}

function assert(condition: boolean, code: number, message: string) {
  if (!condition) {
    const err = new Error(message) as Error & { status?: number };
    err.status = code;
    throw err;
  }
}

type TokenPayload = { id: string; email: string; role: Role; name: string };
type AuthedRequest = express.Request & { user?: TokenPayload };

function signAccess(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefresh(payload: Pick<TokenPayload, 'id' | 'email' | 'role'>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function auth(req: AuthedRequest, _res: express.Response, next: express.NextFunction) {
  try {
    const h = req.headers.authorization || '';
    assert(h.startsWith('Bearer '), 401, 'Missing bearer token');
    const token = h.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
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
    const { email, password, role } = parseOrThrow(loginSchema, req.body || {});
    assert(validateEmail(email), 400, 'Valid email is required');
    assert(isValidRole(role), 400, 'Invalid role');

    const db = readDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role && u.active);
    assert(!!user, 401, 'Invalid credentials');

    const passwordOk = bcrypt.compareSync(password, user!.passwordHash);
    assert(passwordOk, 401, 'Invalid credentials');

    const payload: TokenPayload = { id: user!.id, email: user!.email, role: user!.role, name: user!.name };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    db.refreshSessions.push({
      id: randomUUID(),
      userId: user!.id,
      tokenHash: bcrypt.hashSync(refreshToken, 10),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      revokedAt: null,
    });
    db.refreshSessions = db.refreshSessions.slice(-2000);

    pushAudit(db, payload, 'LOGIN', 'auth', user!.id);
    writeDB(db);

    res.json({ accessToken, refreshToken, user: payload });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/refresh', (req, res, next) => {
  try {
    const { refreshToken } = parseOrThrow(refreshSchema, req.body || {});

    const payload = jwt.verify(refreshToken, JWT_SECRET) as Pick<TokenPayload, 'id' | 'email' | 'role'>;
    const db = readDB();
    const session = db.refreshSessions
      .filter((s) => s.userId === payload.id && !s.revokedAt && new Date(s.expiresAt).getTime() > Date.now())
      .find((s) => bcrypt.compareSync(refreshToken, s.tokenHash));

    assert(!!session, 401, 'Invalid refresh token');
    const user = db.users.find((u) => u.id === payload.id && u.active);
    assert(!!user, 401, 'User is inactive');

    const nextPayload: TokenPayload = { id: user!.id, email: user!.email, role: user!.role, name: user!.name };
    const accessToken = signAccess(nextPayload);
    res.json({ accessToken, user: nextPayload });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/logout', auth, (req: AuthedRequest, res) => {
  const { refreshToken } = parseOrThrow(logoutSchema, req.body || {});
  const db = readDB();
  if (typeof refreshToken === 'string') {
    for (const s of db.refreshSessions) {
      if (!s.revokedAt && s.userId === req.user!.id && bcrypt.compareSync(refreshToken, s.tokenHash)) {
        s.revokedAt = new Date().toISOString();
      }
    }
  }
  pushAudit(db, req.user!, 'LOGOUT', 'auth', req.user!.id);
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/auth/me', auth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

app.get('/api/shipments', auth, (req: AuthedRequest, res) => {
  const db = readDB();
  const q = parseOrThrow(shipmentsQuerySchema, req.query || {});
  const status = q.status || '';
  const search = String(q.search || '').trim().toLowerCase();
  const page = q.page;
  const limit = q.limit;

  let rows = db.shipments.filter((s) => !s.deletedAt);

  if (req.user?.role === 'Courier') {
    rows = rows.filter((s) => !!s.assignedTo);
  }

  if (status && isValidStatus(status)) {
    rows = rows.filter((s) => s.status === status);
  }

  if (search) {
    rows = rows.filter((s) => [s.id, s.trackingNumber, s.customerName, s.address, s.phone].some((v) => String(v).toLowerCase().includes(search)));
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const paged = rows.slice(start, start + limit);

  res.json({
    data: paged,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: start + limit < total,
      hasPrev: page > 1,
    },
  });
});

app.get('/api/couriers', auth, (_req, res) => {
  const db = readDB();
  res.json(db.couriers);
});

app.post('/api/shipments/:id/assign', auth, requireRole(['Dispatcher', 'Admin']), (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { courierId } = parseOrThrow(assignSchema, req.body || {});

    const db = readDB();
    const shipment = db.shipments.find((s) => s.id === id);
    assert(!!shipment && !shipment.deletedAt, 404, 'Shipment not found');
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
    const { status, note } = parseOrThrow(statusSchema, req.body || {});

    assert(isValidStatus(status), 400, 'Invalid shipment status');
    assert(statusActionRoles[status].includes(req.user!.role), 403, `Role ${req.user!.role} cannot set status ${status}`);

    const db = readDB();
    const shipment = db.shipments.find((s) => s.id === id);
    assert(!!shipment && !shipment.deletedAt, 404, 'Shipment not found');

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

app.post('/api/shipments/import', auth, requireRole(['Admin', 'Dispatcher']), (req: AuthedRequest, res, next) => {
  try {
    const { rows } = parseOrThrow(importShipmentsSchema, req.body || {});
    const db = readDB();
    const existing = new Set(db.shipments.filter((s) => !s.deletedAt).map((s) => s.trackingNumber.toLowerCase()));

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      try {
        const r = rows[i] as Record<string, unknown>;
        const awb = String(r['AWB Number'] || '').trim();
        if (!awb) {
          skipped += 1;
          errors.push(`Row ${i + 1}: missing AWB Number`);
          continue;
        }

        if (existing.has(awb.toLowerCase())) {
          skipped += 1;
          continue;
        }

        const statusRaw = String(r['Status'] || 'AtStation').trim();
        const status = (isValidStatus(statusRaw) ? statusRaw : 'AtStation') as ShipmentStatus;
        const codAmount = Number(r['COD'] || 0) || 0;

        const shipment: Shipment = {
          id: awb,
          trackingNumber: awb,
          status,
          customerName: String(r['Consignee Name'] || '').trim() || 'Unknown Customer',
          phone: String(r['Consignee Phone'] || '').trim() || '-',
          address: String(r['Final Destination'] || r['Consignee Address'] || '').trim() || '-',
          codAmount,
          assignedTo: String(r['Driver'] || '').trim() || null,
          timeline: [{ status, timestamp: new Date().toISOString(), note: 'Imported from Excel' }],
          meta: {
            shipperName: r['Shipper Name'] || '',
            shipperPhone: r['Shipper Phone'] || '',
            shipperEmail: r['Shipper Email'] || '',
            consigneeEmail: r['Consignee Email'] || '',
            shipmentReference: r['Shipment Reference'] || '',
            receivedDate: r['Received Date'] || '',
            currentLocation: r['Current Location'] || '',
            currentWarehouse: r['Current Warehouse'] || '',
            finalDestination: r['Final Destination'] || '',
            finalWarehouse: r['Final Warehouse'] || '',
            numberOfAttempts: r['Number of Attempts'] || '',
            lastAttemptDate: r['Last Attempt Date'] || '',
            daysOnSystem: r['days Number On System'] || '',
            lastUpdate: r['Last Update'] || '',
            declaredValue: r['Declared Value'] || '',
            productsTypes: r['Products types'] || '',
            serviceType: r['Service Type'] || '',
            returnDate: r['Return date'] || '',
            deliveredOn: r['Delivered On'] || '',
            returnSource: r['Return Source'] || '',
          },
        };

        db.shipments.unshift(shipment);
        existing.add(awb.toLowerCase());
        added += 1;
      } catch {
        skipped += 1;
        errors.push(`Row ${i + 1}: invalid row`);
      }
    }

    pushAudit(db, req.user!, 'IMPORT_SHIPMENTS', 'shipment', `batch-${Date.now()}`, { totalRows: rows.length, added, skipped, errors: errors.length });
    writeDB(db);
    res.json({ ok: true, added, skipped, errors });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/shipments/:id', auth, requireRole(['Admin']), (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const shipment = db.shipments.find((s) => s.id === id);
    assert(!!shipment && !shipment.deletedAt, 404, 'Shipment not found');

    shipment!.deletedAt = new Date().toISOString();
    pushAudit(db, req.user!, 'SOFT_DELETE_SHIPMENT', 'shipment', shipment!.id, { status: shipment!.status });
    writeDB(db);

    res.json({ ok: true, shipmentId: shipment!.id, deletedAt: shipment!.deletedAt });
  } catch (err) {
    next(err);
  }
});

app.get('/api/audit-logs', auth, requireRole(['Admin']), (req, res) => {
  const db = readDB();
  const q = parseOrThrow(auditQuerySchema, req.query || {});
  let rows = [...db.auditLogs];
  if (q.actorId) rows = rows.filter((r) => r.actorId === q.actorId);
  if (q.action) rows = rows.filter((r) => r.action === q.action);
  res.json(rows.slice(0, q.limit));
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
