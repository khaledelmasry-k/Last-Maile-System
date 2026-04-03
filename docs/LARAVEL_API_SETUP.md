# Laravel API Setup (Backend only)

## 1) Run Laravel API locally

```bash
cd laravel-api
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

API base: `http://127.0.0.1:8000/api`

## 2) Default login

- Admin: `admin@express.com` / `Admin@123`
- Dispatcher: `dispatcher@express.com` / `Dispatch@123`
- Finance: `finance@express.com` / `Finance@123`

## 3) Implemented endpoints

- `POST /api/login`
- `GET /api/me` (Bearer token)
- `POST /api/logout` (Bearer token)
- `GET /api/couriers` (Bearer token)
- `POST /api/couriers` (Bearer token, Admin/Dispatcher)
- `GET /api/shipments` (Bearer token)
- `POST /api/shipments/{id}/assign` (Bearer token, Admin/Dispatcher)
- `POST /api/shipments/{id}/status` (Bearer token, role-based transition check)
- `POST /api/finance/settle/{courierCode}` (Bearer token, Admin/Finance)

## 4) Connect React app

Create `.env` in project root (frontend) and set:

```env
VITE_API_BASE=http://127.0.0.1:8000
```

Then run frontend as usual; it will call Laravel `/api/*` endpoints through this base.

## 5) Access Control (Server-side)

- Sanctum token auth is enabled.
- Role middleware alias: `role` (`app/Http/Middleware/EnsureUserRole.php`).
- Example applied:
  - `POST /api/couriers` → `role:Admin,Dispatcher`

## 6) Deploy on Render

This repo includes `render.yaml` and `laravel-api/Dockerfile`.

1. In Render dashboard: **New + → Blueprint**
2. Select this GitHub repo and branch `main`
3. Render will detect `render.yaml` and create service `lastmile-laravel-api`
4. After deploy, copy API URL (example: `https://lastmile-laravel-api.onrender.com`)
5. In frontend env set:

```env
VITE_API_BASE=https://lastmile-laravel-api.onrender.com
```

Then redeploy frontend to Firebase.

## 7) Notes

- CORS is open by default in `config/cors.php`.
- If needed in production, restrict `allowed_origins`.
