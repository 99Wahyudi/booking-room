import React from 'react';
import Icon from '../../components/ui/Icon';

export default function PlaceholderPage({ title, description }) {
  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-primary uppercase mb-2">
        <span className="w-2 h-2 rounded-full bg-primary"></span>
        <span>Ringkasan Operasional Properti</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant">{title}</span>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{title}</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {description ||
            'Halaman ini sedang disiapkan dan akan segera tersedia pada portal admin StayEasy.'}
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-fixed/40 text-primary flex items-center justify-center">
          <Icon name="construction" size={32} />
        </div>
        <h2 className="mt-5 text-lg font-bold text-on-surface">Segera Hadir</h2>
        <p className="mt-1.5 max-w-md text-sm text-on-surface-variant">
          Fitur <strong className="text-on-surface">{title}</strong> sedang dalam pengembangan.
          Silakan kembali lagi nanti atau gunakan menu lain yang sudah aktif.
        </p>
      </div>
    </main>
  );
}