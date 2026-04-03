# Project Understanding — Last-Maile-System (2026-04-03)

## 1) Product Summary
LastMileLogistics is a multi-portal operations system for last-mile delivery workflows.

Main portals:
- Admin Overview
- Live Tracking (Map)
- Dispatch Portal
- Courier App
- Receive & Returns
- Finance & COD
- Customer Service
- Performance & SLA
- Warehouse
- Roles & Permissions

---

## 2) Current Technical Architecture

### Frontend
- Stack: React + TypeScript + Vite
- Routing: `src/App.tsx` with protected routes + role route guards
- State:
  - `AuthContext` for auth/session and API calls
  - `LogisticsContext` for shipments/couriers operations
- UI Hosting: Firebase Hosting (`lastmile-logistics.web.app`)

### Backend (in progress)
- Stack: Laravel 13 + Sanctum
- Location: `laravel-api/`
- API routes: `laravel-api/routes/api.php`
- Role middleware: `EnsureUserRole` alias `role`
- DB: SQLite (local) with seeders

---

## 3) Access Control Status

### Frontend RBAC
Defined in `src/config/rbac.ts`:
- Route-level access matrix per role ✅
- Permission-level action checks (`hasPermission`) ✅

Applied action-level guards (implemented):
- Dispatch actions (`dispatch.manage`) ✅
- Courier status actions (`courier.execute`) ✅
- Returns actions (`returns.manage`) ✅
- Finance settlement (`finance.manage`) ✅
- Customer service actions (`cs.manage`) ✅
- Admin role-management buttons (`roles.manage`) ✅

### Backend RBAC (Laravel)
Implemented server-side checks on core endpoints ✅:
- `POST /api/couriers` → Admin, Dispatcher
- `POST /api/shipments/{id}/assign` → Admin, Dispatcher
- `POST /api/shipments/{id}/status` → role-based transition validation
- `POST /api/finance/settle/{courierCode}` → Admin, Finance

Important: Server-side RBAC is now present for sensitive mutation endpoints.

---

## 4) API Coverage (Laravel)
Implemented endpoints:
- `POST /api/login`
- `GET /api/me`
- `POST /api/logout`
- `GET /api/couriers`
- `POST /api/couriers`
- `GET /api/shipments`
- `POST /api/shipments/{id}/assign`
- `POST /api/shipments/{id}/status`
- `POST /api/finance/settle/{courierCode}`

Seed users:
- admin@express.com / Admin@123
- dispatcher@express.com / Dispatch@123
- finance@express.com / Finance@123

---

## 5) Deployment Status

### GitHub
- Latest code (frontend + laravel backend) pushed to `main` ✅

### Firebase
- Frontend deployed and live ✅
- Functions/API on Firebase not active because project is not on Blaze plan ⚠️

### Laravel Production Hosting
- Render blueprint + Docker setup is prepared in repo (`render.yaml`, `laravel-api/Dockerfile`) ✅
- Actual cloud deployment pending because payment/verification on hosted platforms is blocked (no card) ⚠️

---

## 6) Key Gaps / Risks
1. **Production Laravel URL is not available yet**
   - Frontend can target Laravel locally via `VITE_API_BASE`, but no always-on cloud API yet.

2. **Dual-backend transition risk**
   - Legacy `/api/*` behavior via Firebase rewrites is still possible in hosting config.
   - Need final cutover decision: Laravel-only API target.

3. **End-to-end regression run after full backend cutover still needed**
   - Login, dispatch, courier updates, finance settlement, returns, CS flows.

---

## 7) Recommended Finish Plan (Practical)
1. Lock API target strategy:
   - Local/dev: `VITE_API_BASE=http://127.0.0.1:8000`
   - Production: set to final Laravel URL once available.

2. Complete backend parity for remaining endpoints used by UI (if any missing).

3. Run full role-by-role E2E matrix:
   - Admin / Dispatcher / Courier / Finance / CS / Warehouse
   - Validate routes + actions + forbidden cases.

4. Final stabilization release:
   - tag version
   - publish release notes
   - freeze RBAC matrix doc.

---

## 8) My Current Understanding in One Line
The project is now structurally solid on RBAC and frontend workflows; the main remaining blocker to “fully finished production” is publishing Laravel API on a persistent public host, then completing one final full regression pass after that cutover.
