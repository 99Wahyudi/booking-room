import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-6 shadow-sm">
        <Icon name="search_off" size={32} />
      </div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">404 — Halaman Tidak Ditemukan</h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-2">
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan. Silakan kembali ke beranda untuk melanjutkan pencarian kamar.
      </p>
      <div className="flex items-center gap-3 mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-space-lg py-2.5 rounded-xl bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors shadow-sm"
        >
          <Icon name="home" size={18} />
          <span>Kembali ke Beranda</span>
        </Link>
        <Link
          to="/support"
          className="inline-flex items-center gap-2 px-space-lg py-2.5 rounded-xl bg-surface-container-low text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-colors"
        >
          <Icon name="support_agent" size={18} />
          <span>Pusat Bantuan</span>
        </Link>
      </div>
    </main>
  );
}