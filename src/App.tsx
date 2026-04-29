/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Layout from './components/Layout';

// Lazy load pages for better performance (optional, but good practice)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Slots from './pages/Slots';
import Records from './pages/Records';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            } />
            <Route path="/cars" element={
              <PrivateRoute><Cars /></PrivateRoute>
            } />
            <Route path="/slots" element={
              <PrivateRoute><Slots /></PrivateRoute>
            } />
            <Route path="/records" element={
              <PrivateRoute><Records /></PrivateRoute>
            } />
            <Route path="/payments" element={
              <PrivateRoute><Payments /></PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute><Reports /></PrivateRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
