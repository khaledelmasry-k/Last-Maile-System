# RBAC Action Audit — 2026-04-03

## Scope
- Route-level access (`src/config/rbac.ts`)
- Action-level controls in UI pages
- Roles: Admin, Dispatcher, Courier, Finance, CS, Warehouse

## Route-Level Matrix

| Route | Allowed Roles |
|---|---|
| /admin | Admin |
| /map | Admin, Dispatcher |
| /dispatch | Admin, Dispatcher |
| /courier | Admin, Courier |
| /receive | Admin, Warehouse |
| /finance | Admin, Finance |
| /cs | Admin, CS |
| /performance | Admin |
| /warehouse | Admin, Warehouse |
| /roles | Admin |

## Action-Level Checks

### Dispatch Portal (`dispatch.manage`)
- ✅ Assign shipment button is permission-gated
- ✅ Upload Excel button is permission-gated
- ✅ Download Template button is permission-gated
- ✅ Courier selection radio is permission-gated

### Courier App (`courier.execute`)
- ✅ Status update actions (Start/Delivered/Failed/Reschedule) are permission-gated
- ✅ Shipment card action expansion is permission-gated
- ✅ Delivery note input is permission-gated

### Finance (`finance.manage`)
- ✅ Settle action is permission-gated

### Receive & Returns (`returns.manage`)
- ✅ Process Return action is permission-gated
- ✅ Re-Dispatch action is permission-gated

### Customer Service (`cs.manage`)
- ✅ Contact action is permission-gated
- ✅ Create Ticket action is permission-gated
- ✅ Send SMS Update action is permission-gated

### Admin / Roles (`roles.manage`)
- ✅ Add Role button is permission-gated
- ✅ Role card actions (Edit / Manage Users) are permission-gated

## Result
RBAC is now consistently enforced at:
1) Route-level
2) Core action-level buttons in main modules

## Remaining Notes
- Some pages are read-only dashboards by design (Performance, Warehouse stats/table), so no mutation actions exist there.
- Backend-side authorization is still required for full security (UI checks are not sufficient alone). Laravel API migration is already scaffolded and should enforce server-side role checks per endpoint.
