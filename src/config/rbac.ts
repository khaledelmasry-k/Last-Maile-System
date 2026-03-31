import { UserRole } from '../context/AuthContext';

export type AppPermission =
  | 'dashboard.view'
  | 'map.view'
  | 'dispatch.manage'
  | 'courier.execute'
  | 'returns.manage'
  | 'finance.manage'
  | 'cs.manage'
  | 'performance.view'
  | 'warehouse.manage'
  | 'roles.manage';

export const rolePermissions: Record<UserRole, AppPermission[]> = {
  Admin: [
    'dashboard.view',
    'map.view',
    'dispatch.manage',
    'courier.execute',
    'returns.manage',
    'finance.manage',
    'cs.manage',
    'performance.view',
    'warehouse.manage',
    'roles.manage',
  ],
  Dispatcher: ['map.view', 'dispatch.manage'],
  Courier: ['courier.execute'],
  Finance: ['finance.manage'],
  CS: ['cs.manage'],
  Warehouse: ['returns.manage', 'warehouse.manage'],
};

export const routeAccess: Record<string, UserRole[]> = {
  '/admin': ['Admin'],
  '/map': ['Admin', 'Dispatcher'],
  '/dispatch': ['Admin', 'Dispatcher'],
  '/courier': ['Admin', 'Courier'],
  '/receive': ['Admin', 'Warehouse'],
  '/finance': ['Admin', 'Finance'],
  '/cs': ['Admin', 'CS'],
  '/performance': ['Admin'],
  '/warehouse': ['Admin', 'Warehouse'],
  '/roles': ['Admin'],
};

export function canAccessRoute(role: UserRole | undefined, path: string) {
  if (!role) return false;
  const allowed = routeAccess[path];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function hasPermission(role: UserRole | undefined, permission: AppPermission) {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) || false;
}
