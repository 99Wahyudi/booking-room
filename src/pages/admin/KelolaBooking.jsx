import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import * as adminBookingService from '../../services/adminBookingService';
import Icon from '../../components/ui/Icon';

const TAB_STATUS_MAP = { semua: '', menunggu: 'pending', terkonfirmasi: 'confirmed', selesai: 'completed', dibatalkan: 'cancelled' };

export default function KelolaBooking() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('semua');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('guest_name') || '');
  const PAGE_SIZE = 10;

  const fetchBookings = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const status = TAB_STATUS_MAP[activeTab];
      const result = await adminBookingService.getAllBookings({
        ...(status ? { status } : {}),
        ...(search.trim() ? { guest_name: search.trim() } : {}),
        page,
        limit: PAGE_SIZE,
      });
      setBookings(result.bookings || []);
      setTotalBookings(result.total || 0);
      setTotalPages(Math.max(1, Math.ceil((result.total || 0) / PAGE_SIZE)));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar booking.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    setSearch(searchParams.get('guest_name') || '');
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => fetchBookings(1), 300);
    return () => clearTimeout(t);
  }, [search, fetchBookings]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchBookings(page);
  };

  const handleConfirm = async (id) => {
    try {
      await adminBookingService.confirmBooking(id);
      toast.success(`Booking #BK-${id} dikonfirmasi.`);
      fetchBookings(currentPage);
    } catch (err) {
      toast.error(err.message || 'Gagal mengonfirmasi booking.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Masukkan alasan penolakan booking ini:');
    if (reason === null) return;
    try {
      await adminBookingService.rejectBooking(id, reason || 'Tidak tersedia');
      toast.success(`Booking #BK-${id} ditolak.`);
      fetchBookings(currentPage);
    } catch (err) {
      toast.error(err.message || 'Gagal menolak booking.');
    }
  };

  const handleComplete = async (id) => {
    try {
      await adminBookingService.completeBooking(id);
      toast.success(`Booking #BK-${id} ditandai selesai.`);
      fetchBookings(currentPage);
    } catch (err) {
      toast.error(err.message || 'Gagal menyelesaikan booking.');
    }
  };

  const tabs = [
    { key: 'semua', label: 'Semua' },
    { key: 'menunggu', label: 'Menunggu Konfirmasi' },
    { key: 'terkonfirmasi', label: 'Terkonfirmasi' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'dibatalkan', label: 'Dibatalkan' },
  ];

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      {/* Breadcrumbs & Live Meta */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
          <span className="font-semibold text-primary tracking-wide uppercase text-[11px]">
            Sistem Reservasi & Operasional
          </span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface">Daftar Transaksi Booking</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/40 shadow-sm">
          <Icon name="sync" size={14} className="text-primary" />
          <span>Sinkronisasi otomatis aktif • Diperbarui baru saja</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Kelola Booking</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Kelola dan pantau seluruh reservasi tamu kamar StayEasy, serta atur
            status konfirmasi, check-in, dan check-out.
          </p>
        </div>
        {/* Summary Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-lowest px-3.5 py-2 rounded-xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
              <Icon name="schedule" size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Menunggu</p>
              <p className="text-sm font-bold text-on-surface">{bookings.filter((b) => b.status === 'pending').length} Reservasi</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest px-3.5 py-2 rounded-xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/60 text-on-primary-fixed flex items-center justify-center border border-primary-fixed">
              <Icon name="check" size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Terkonfirmasi</p>
              <p className="text-sm font-bold text-on-surface">{bookings.filter((b) => b.status === 'confirmed').length} Reservasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Horizontal Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`px-4 py-2 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-2 shadow-sm ${
                  activeTab === tab.key
                    ? 'font-bold bg-primary-container text-on-primary'
                    : 'font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <span>{tab.label}</span>
                {tab.key === 'dibatalkan' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-error/10 text-error font-bold">
                    {bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-80 flex-shrink-0">
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              className="w-full pl-9 pr-8 py-2.5 bg-surface-container-low focus:bg-surface-container-lowest text-xs rounded-lg border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface placeholder:text-outline"
              placeholder="Cari nama tamu atau email..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-xs"
              title="Hapus pencarian"
              type="button"
              onClick={() => setSearch('')}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        </div>

        {/* Filter Sub-bar */}
        <div className="pt-3 border-t border-outline-variant/30 flex flex-wrap items-center justify-end text-xs text-on-surface-variant gap-2">
          <p>
            Menampilkan{' '}
            <span className="font-bold text-on-surface">
              {totalBookings === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>
            -<span className="font-bold text-on-surface">{Math.min(currentPage * PAGE_SIZE, totalBookings)}</span>{' '}
            dari <span className="font-bold text-on-surface">{totalBookings}</span> booking
          </p>
        </div>
      </div>

      {/* Main Booking Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/30 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-primary">
                <th className="py-3.5 px-5">Nama Tamu</th>
                <th className="py-3.5 px-4">Kamar</th>
                <th className="py-3.5 px-4">Check-in</th>
                <th className="py-3.5 px-4">Check-out</th>
                <th className="py-3.5 px-4 text-center">Jumlah Tamu</th>
                <th className="py-3.5 px-4">Total Harga</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {isLoading && (
                <tr>
                  <td className="py-8 text-center text-on-surface-variant" colSpan="8">
                    Memuat daftar booking...
                  </td>
                </tr>
              )}
              {!isLoading && !error && bookings.length === 0 && (
                <tr>
                  <td className="py-8 text-center text-on-surface-variant" colSpan="8">
                    Tidak ada booking pada status ini.
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td className="py-8 text-center text-on-surface-variant" colSpan="8">
                    <div className="flex flex-col items-center gap-2">
                      <span>{error}</span>
                      <button
                        className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold"
                        onClick={() => fetchBookings(1)}
                        type="button"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && !error && bookings.map((b) => {
                const statusStyles = {
                  pending: ['bg-amber-50 text-amber-800 border-amber-200', 'schedule', 'Menunggu Konfirmasi'],
                  confirmed: ['bg-primary-fixed text-on-primary-fixed border-primary-fixed', 'check_circle', 'Terkonfirmasi'],
                  completed: ['bg-surface-container-high text-on-surface-variant border-outline-variant', 'task_alt', 'Selesai'],
                  cancelled: ['bg-error/10 text-error border-error/20', 'cancel', 'Dibatalkan'],
                  rejected: ['bg-error/10 text-error border-error/20', 'block', 'Ditolak'],
                };
                const [badgeClass, statusIcon, statusLabel] = statusStyles[b.status] || statusStyles.pending;
                const guestName = b.user?.name || 'Tamu';
                const initials = guestName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr className="bg-surface-container-lowest hover:bg-surface-container/50 transition-colors" key={b.id}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-fixed-dim/60 text-on-primary-fixed font-bold flex items-center justify-center text-xs flex-shrink-0 border border-primary/20">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface leading-tight">{guestName}</p>
                          <p className="text-[11px] text-outline mt-0.5">{b.user?.email || '-'}</p>
                          <span className="text-[10px] text-outline">ID: #BK-{b.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-on-surface">{b.room?.name || '-'}</div>
                      <span className="inline-block mt-0.5 text-[11px] font-medium text-primary bg-primary-fixed/40 px-2 py-0.5 rounded border border-primary-fixed">
                        Kamar R-{b.room_id}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-on-surface">{String(b.check_in_date).slice(0, 10)}</div>
                      <span className="text-[10px] text-outline">14:00 WIB</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-on-surface">{String(b.check_out_date).slice(0, 10)}</div>
                      <span className="text-[10px] text-outline">12:00 WIB</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg">
                        <Icon name="group" size={14} className="text-outline" />
                        {b.guests} Tamu
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-on-surface text-sm font-price-display">
                        Rp {Number(b.total_price || 0).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                        <Icon name={statusIcon} size={14} />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'pending' && (
                          <React.Fragment>
                            <button
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all flex items-center gap-1"
                              onClick={() => handleConfirm(b.id)}
                              title="Setujui Reservasi"
                              type="button"
                            >
                              <Icon name="check" size={14} />
                              <span>Konfirmasi</span>
                            </button>
                            <button
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-error/30 text-error hover:bg-error/10 transition-all flex items-center gap-1"
                              onClick={() => handleReject(b.id)}
                              title="Tolak Reservasi"
                              type="button"
                            >
                              <Icon name="close" size={14} />
                              <span>Tolak</span>
                            </button>
                          </React.Fragment>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all flex items-center gap-1"
                            onClick={() => handleComplete(b.id)}
                            title="Selesaikan Reservasi"
                            type="button"
                          >
                            <Icon name="done_all" size={14} />
                            <span>Selesai</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-on-surface-variant font-medium">
            Menampilkan{' '}
            <span className="font-bold text-on-surface">
              {totalBookings === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>{' '}
            sampai <span className="font-bold text-on-surface">{Math.min(currentPage * PAGE_SIZE, totalBookings)}</span>{' '}
            dari <span className="font-bold text-on-surface">{totalBookings}</span> total reservasi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                currentPage === 1
                  ? 'text-outline bg-surface-container-lowest border border-outline-variant cursor-not-allowed'
                  : 'text-on-surface bg-surface-container-lowest border border-outline-variant hover:bg-surface-container'
              }`}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              type="button"
            >
              <Icon name="chevron_left" size={14} />
              <span>Sebelumnya</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-colors ${
                  page === currentPage
                    ? 'font-bold bg-primary text-on-primary shadow-sm'
                    : 'font-semibold text-on-surface-variant hover:bg-surface-container bg-surface-container-lowest border border-outline-variant'
                }`}
                onClick={() => handlePageChange(page)}
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                currentPage === totalPages
                  ? 'text-outline bg-surface-container-lowest border border-outline-variant cursor-not-allowed'
                  : 'text-on-surface bg-surface-container-lowest border border-outline-variant hover:bg-surface-container'
              }`}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              type="button"
            >
              <span>Selanjutnya</span>
              <Icon name="chevron_right" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tips / Operational Notes Card */}
      <div className="p-4 bg-surface-container rounded-xl flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="info" size={16} />
        </div>
        <div className="text-xs">
          <p className="font-bold text-on-surface">Petunjuk Operasional Konfirmasi Reservasi</p>
          <p className="text-on-surface-variant mt-0.5">
            Konfirmasi menyetujui reservasi tamu. Pastikan detail nama, kamar, dan
            tanggal sudah sesuai sebelum menekan tombol <strong className="text-on-surface">"Konfirmasi"</strong>.
            Pembatalan oleh tamu menandai booking sebagai dibatalkan sesuai ketentuan properti StayEasy.
          </p>
        </div>
      </div>
    </main>
  );
}