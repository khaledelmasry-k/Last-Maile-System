/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LogisticsProvider } from './context/LogisticsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { canAccessRoute } from './config/rbac';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const DispatchPortal = lazy(() => import('./pages/DispatchPortal').then((m) => ({ default: m.DispatchPortal })));
const CourierApp = lazy(() => import('./pages/CourierApp').then((m) => ({ default: m.CourierApp })));
const LiveMap = lazy(() => import('./pages/LiveMap').then((m) => ({ default: m.LiveMap })));
const ReceiveReturns = lazy(() => import('./pages/ReceiveReturns').then((m) => ({ default: m.ReceiveReturns })));
const Finance = lazy(() => import('./pages/Finance').then((m) => ({ default: m.Finance })));
const CustomerService = lazy(() => import('./pages/CustomerService').then((m) => ({ default: m.CustomerService })));
const Performance = lazy(() => import('./pages/Performance').then((m) => ({ default: m.Performance })));
const Warehouse = lazy(() => import('./pages/Warehouse').then((m) => ({ default: m.Warehouse })));
const RolesPermissions = lazy(() => import('./pages/RolesPermissions').then((m) => ({ default: m.RolesPermissions })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));

const RouteFallback = () => <div className="p-8 text-gray-900 dark:text-white font-mono">Loading module...</div>;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-8 text-gray-900 dark:text-white font-mono">Loading session...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RoleRoute = ({ path, children }: { path: string; children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!canAccessRoute(user?.role, path)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const defaultRouteByRole = {
  Admin: '/admin',
  Dispatcher: '/dispatch',
  Courier: '/courier',
  Finance: '/finance',
  CS: '/cs',
  Warehouse: '/warehouse',
} as const;

const AppRoutes = () => {
  const { user } = useAuth();
  const defaultRoute = user?.role ? defaultRouteByRole[user.role] : '/';

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={defaultRoute} replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to={defaultRoute} replace />} />
          <Route path="admin" element={<RoleRoute path='/admin'><AdminDashboard /></RoleRoute>} />
          <Route path="map" element={<RoleRoute path='/map'><LiveMap /></RoleRoute>} />
          <Route path="dispatch" element={<RoleRoute path='/dispatch'><DispatchPortal /></RoleRoute>} />
          <Route path="courier" element={<RoleRoute path='/courier'><CourierApp /></RoleRoute>} />
          <Route path="receive" element={<RoleRoute path='/receive'><ReceiveReturns /></RoleRoute>} />
          <Route path="finance" element={<RoleRoute path='/finance'><Finance /></RoleRoute>} />
          <Route path="cs" element={<RoleRoute path='/cs'><CustomerService /></RoleRoute>} />
          <Route path="performance" element={<RoleRoute path='/performance'><Performance /></RoleRoute>} />
          <Route path="warehouse" element={<RoleRoute path='/warehouse'><Warehouse /></RoleRoute>} />
          <Route path="roles" element={<RoleRoute path='/roles'><RolesPermissions /></RoleRoute>} />
          <Route path="*" element={<div className="p-8 text-gray-900 dark:text-white font-mono">Module under construction...</div>} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LogisticsProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </LogisticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
