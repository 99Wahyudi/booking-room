import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Proteksi route admin: hanya role "admin" yang boleh masuk.
 * - Customer yang login -> pesan tidak berwenang
 * - Belum login -> redirect ke /admin/login
 */
export default function AdminRoute({ children }) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <span className="material-symbols-outlined text-4xl text-[#c58a5a] animate-pulse">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light px-4">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-error">lock</span>
          <h1 className="mt-4 text-xl font-bold text-[#1c130d]">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-[#1c130d]/70">
            Halaman ini hanya untuk admin. Akun Anda saat ini tidak memiliki
            izin untuk mengakses dashboard admin.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c58a5a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#a9734a] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return children;
}