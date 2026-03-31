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

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="dispatch" element={<DispatchPortal />} />
          <Route path="courier" element={<CourierApp />} />
          <Route path="receive" element={<ReceiveReturns />} />
          <Route path="finance" element={<Finance />} />
          <Route path="cs" element={<CustomerService />} />
          <Route path="performance" element={<Performance />} />
          <Route path="warehouse" element={<Warehouse />} />
          <Route path="roles" element={<RolesPermissions />} />
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
