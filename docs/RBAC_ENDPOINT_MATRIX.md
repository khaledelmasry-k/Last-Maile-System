# RBAC Endpoint Matrix

| Endpoint | Method | Admin | Dispatcher | Courier | Finance | CS | Warehouse |
|---|---|---:|---:|---:|---:|---:|---:|
| `/api/auth/login` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/refresh` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/logout` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/me` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/shipments` | GET | ✅ | ✅ | ✅ (assigned only) | ✅ | ✅ | ✅ |
| `/api/couriers` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/shipments/:id/assign` | POST | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/api/shipments/:id/status` | POST | ✅ | ✅* | ✅* | ❌ | ❌ | ✅* |
| `/api/shipments/:id` | DELETE (soft) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/api/audit-logs` | GET | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

`*` Status transitions are additionally constrained by status transition rules and per-status allowed role map in `server.ts`.
