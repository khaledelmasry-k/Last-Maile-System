# Execution Checklist — LastMile (Closeout)

Status legend:
- [ ] pending
- [~] in progress
- [x] done

## Phase 1 — Backend/API Lock
- [x] Laravel API scaffolded
- [x] Sanctum auth active
- [x] Core RBAC middleware active
- [x] Shipments/Couriers/Finance settlement endpoints implemented
- [ ] Add any missing UI-required endpoints (gap verification pass)
- [ ] Freeze final API contract (request/response schema)

## Phase 2 — Frontend Integration Lock
- [x] AuthContext connected to Laravel API base
- [x] LogisticsContext connected to Laravel API base
- [x] `VITE_API_BASE` support documented
- [ ] Remove legacy dependency assumptions on Firebase Functions `/api` path
- [ ] Add strict API error UX states (403/401/422 friendly messages)

## Phase 3 — Access Control Finalization
- [x] Route-level RBAC matrix applied
- [x] Action-level RBAC on major screens applied
- [x] Server-side RBAC for core mutation endpoints
- [ ] Run full role-by-role test matrix and export report
- [ ] Verify forbidden-path handling UX (redirect + messaging)

## Phase 4 — Quality & Regression
- [ ] Full E2E suite (Admin/Dispatcher/Courier/Finance/CS/Warehouse)
- [ ] Data integrity checks for status transitions
- [ ] Finance settlement reconciliation check
- [ ] Smoke test in production-hosted frontend

## Phase 5 — Deployment & Go-Live
- [x] Firebase frontend deployment pipeline in use
- [x] Render deployment blueprint prepared
- [ ] Publish Laravel API to persistent public host (pending platform/account)
- [ ] Set production `VITE_API_BASE` to public Laravel URL
- [ ] Final release tag + release notes

## Immediate Next 3 Actions (Now)
1. [ ] RBAC role-by-role runtime test (manual + script) and capture failures
2. [ ] Close missing endpoint/contract gaps discovered in test
3. [ ] Ship stabilization patch and re-run final regression
