// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Katalog from './pages/Katalog';
import GudangBB from './pages/GudangBB';
import GudangProduk from './pages/GudangProduk';
import ReturSupplier from './pages/ReturSupplier';
import ReturVendor from './pages/ReturVendor';
import SuratPesanan from './pages/SuratPesanan';
import Penerimaan from './pages/Penerimaan';
import OrderPenjualan from './pages/OrderPenjualan';
import ReturCustomer from './pages/ReturCustomer';
import Laporan from './pages/Laporan';
import MasterData from './pages/MasterData';
import Pengaturan from './pages/Pengaturan';
import Users from './pages/Users';

// Protected Route — redirect ke login kalau belum login
function ProtectedRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

// Super Admin Only Route
function SuperAdminRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'superadmin') return <Navigate to="/" replace />;
  return children;
}

// Public Route — redirect ke home kalau sudah login
function PublicRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser);
  if (currentUser) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected — pakai Layout (sidebar + topbar) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="katalog" element={<Katalog />} />
            <Route path="gudang-bb" element={<GudangBB />} />
            <Route path="gudang-produk" element={<GudangProduk />} />
            <Route path="retur-supplier" element={<ReturSupplier />} />
            <Route path="retur-vendor" element={<ReturVendor />} />
            <Route path="sp" element={<SuratPesanan />} />
            <Route path="penerimaan" element={<Penerimaan />} />
            <Route path="order" element={<OrderPenjualan />} />
            <Route path="retur-customer" element={<ReturCustomer />} />
            <Route path="laporan" element={<Laporan />} />
            <Route path="master" element={<MasterData />} />
            <Route path="pengaturan" element={<Pengaturan />} />
            <Route
              path="users"
              element={
                <SuperAdminRoute>
                  <Users />
                </SuperAdminRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
