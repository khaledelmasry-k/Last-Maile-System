# Laravel API Setup (Backend only)

## 1) Run Laravel API locally

```bash
cd laravel-api
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

API base: `http://127.0.0.1:8000/api`

## 2) Default login

- email: `admin@express.com`
- password: `Admin@123`

## 3) Implemented endpoints

- `POST /api/login`
- `GET /api/me` (Bearer token)
- `POST /api/logout` (Bearer token)
- `GET /api/couriers` (Bearer token)
- `POST /api/couriers` (Bearer token, Admin/Dispatcher)

## 4) Connect React app

In frontend, set API base to `http://127.0.0.1:8000` and call `/api/*` from Laravel.

## 5) Notes

- Sanctum token auth is enabled.
- CORS is open by default in `config/cors.php`.
- If needed in production, restrict `allowed_origins`.
