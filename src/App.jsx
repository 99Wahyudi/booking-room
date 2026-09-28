import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import GlobalNav from './components/GlobalNav.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import AdminRoute from './components/routing/AdminRoute.jsx';

import Beranda from './pages/Beranda.jsx';
import HasilPencarian from './pages/HasilPencarian.jsx';
import DetailKamar from './pages/DetailKamar.jsx';
import KonfirmasiBooking from './pages/KonfirmasiBooking.jsx';
import BookingSaya from './pages/BookingSaya.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Support from './pages/Support.jsx';
import NotFound from './pages/NotFound.jsx';

import LoginAdmin from './pages/admin/LoginAdmin.jsx';
import DashboardAdmin from './pages/admin/DashboardAdmin.jsx';
import KelolaBooking from './pages/admin/KelolaBooking.jsx';
import KelolaKamar from './pages/admin/KelolaKamar.jsx';
import KelolaFasilitas from './pages/admin/KelolaFasilitas.jsx';
import KelolaTipeKamar from './pages/admin/KelolaTipeKamar.jsx';
import KalenderOkupansi from './pages/admin/KalenderOkupansi.jsx';
import Laporan from './pages/admin/Laporan.jsx';
import TambahKamar from './pages/admin/TambahKamar.jsx';
import EditKamar from './pages/admin/EditKamar.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <GlobalNav />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Beranda />} />
          <Route path="/search" element={<HasilPencarian />} />
          <Route path="/rooms/:slug" element={<DetailKamar />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/support" element={<PublicLayout><Support /></PublicLayout>} />

          {/* Customer (butuh login) */}
          <Route path="/booking/confirm" element={<ProtectedRoute><KonfirmasiBooking /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><BookingSaya /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/login" element={<LoginAdmin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<DashboardAdmin />} />
            <Route path="rooms" element={<KelolaKamar />} />
            <Route path="rooms/new" element={<TambahKamar />} />
            <Route path="rooms/:id/edit" element={<EditKamar />} />
            <Route path="bookings" element={<KelolaBooking />} />
            <Route path="calendar" element={<KalenderOkupansi />} />
            <Route path="reports" element={<Laporan />} />
            <Route path="facilities" element={<KelolaFasilitas />} />
            <Route path="room-types" element={<KelolaTipeKamar />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}