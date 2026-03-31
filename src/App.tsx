/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LogisticsProvider } from './context/LogisticsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { AdminDashboard } from './pages/AdminDashboard';
import { DispatchPortal } from './pages/DispatchPortal';
import { CourierApp } from './pages/CourierApp';
import { LiveMap } from './pages/LiveMap';
import { ReceiveReturns } from './pages/ReceiveReturns';
import { Finance } from './pages/Finance';
import { CustomerService } from './pages/CustomerService';
import { Performance } from './pages/Performance';
import { Warehouse } from './pages/Warehouse';
import { RolesPermissions } from './pages/RolesPermissions';
import { Login } from './pages/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
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
