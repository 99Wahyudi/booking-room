import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as bookingService from '../services/bookingService';
import { resolveImageUrl } from '../lib/apiClient';

const TAB_STATUS_MAP = {
  semua: '',
  menunggu: 'pending',
  terkonfirmasi: 'confirmed',
  selesai: 'completed',
  dibatalkan: 'cancelled',
};

// 1:1 port of booking_saya_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function BookingSaya() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const menuGo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* token tetap dihapus di context */
    } finally {
      setMenuOpen(false);
      navigate('/', { replace: true });
    }
  };
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('semua');
  const [allBookings, setAllBookings] = useState([]);
  const [counts, setCounts] = useState({ semua: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('Perubahan tanggal perjalanan');
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = [];
      for (let page = 1; page <= 20; page += 1) {
        const result = await bookingService.getMyBookings({ page, limit: 100 });
        all.push(...(result.bookings || []));
        if (!result.total || all.length >= result.total) break;
      }
      setAllBookings(all);
      setCounts({
        semua: all.length,
        pending: all.filter((b) => b.status === 'pending').length,
        confirmed: all.filter((b) => b.status === 'confirmed').length,
        completed: all.filter((b) => b.status === 'completed').length,
        cancelled: all.filter((b) => b.status === 'cancelled').length,
        rejected: all.filter((b) => b.status === 'rejected').length,
      });
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar booking.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const visibleBookings =
    activeTab === 'semua'
      ? allBookings
      : allBookings.filter((b) => b.status === TAB_STATUS_MAP[activeTab]);

  const openCancelModal = (booking) => setCancelTarget(booking);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(cancelTarget.id, cancelReason);
      toast.success('Booking berhasil dibatalkan.');
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Gagal membatalkan booking.');
    } finally {
      setCancelling(false);
    }
  };
  return (
    <>
<header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-lg"><div className="flex items-center gap-space-xl"><a className="flex items-center gap-space-xs" data-path="beranda" href="#"><svg className="h-8 w-8 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect fill="#FD7549" height="10" rx="2" width="10" x="8" y="18"/><circle cx="34" cy="18" fill="#FFFFFF" r="4.5"/><path d="M8 32C14 32 18 24 24 24C30 24 34 30 40 26" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5"/></svg><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></a><nav className="hidden md:flex items-center gap-space-lg h-20" data-active-classes="text-primary-container font-title-md text-title-md border-b-2 border-primary-container"><a className="h-full flex items-center text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors" data-path="beranda" href="#">Beranda</a><a aria-current="page" className="h-full flex items-center transition-colors text-primary-container font-title-md text-title-md border-b-2 border-primary-container" data-path="booking-saya" href="#">Booking Saya</a></nav></div><div className="flex items-center gap-space-md"><div ref={menuRef} className="relative group"><button aria-haspopup="menu" aria-expanded={menuOpen} className="flex items-center gap-space-sm pl-space-xs pr-space-sm py-space-xs rounded-full hover:bg-surface-container-low transition-colors" type="button" onClick={() => setMenuOpen(!menuOpen)}><div className="w-8 h-8 rounded-full bg-surface-container-low ring-1 ring-outline-variant flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-base text-on-surface-variant">person</span></div><div className="text-left hidden sm:flex flex-col"><span className="font-label-md text-label-md text-on-surface leading-tight">{user?.name || 'Masuk / Daftar'}</span></div><span className="material-symbols-outlined text-on-surface-variant text-base">{menuOpen ? 'expand_less' : 'expand_more'}</span></button><div className={`absolute right-0 top-full pt-space-2xs w-56 bg-surface-container-lowest rounded-xl shadow-[0_16px_36px_-6px_rgba(44,44,42,0.12),0_6px_16px_-4px_rgba(44,44,42,0.06)] py-space-xs transition-all duration-150 z-50 ${menuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}><div className="px-space-md py-space-xs sm:hidden border-b border-surface-variant mb-space-2xs"><p className="font-label-md text-label-md text-on-surface">{user?.name || 'Masuk / Daftar'}</p></div>{isAuthenticated ? (
        <>
          <a className="flex items-center gap-space-sm px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="profil-akun" href="#">Profil Akun</a>
          <a className="flex items-center gap-space-sm px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="pengaturan" href="#">Pengaturan</a>
          <button type="button" onClick={() => menuGo('/support')} className="flex items-center gap-space-sm px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors w-full text-left"><span className="material-symbols-outlined text-base">help_center</span>Pusat Bantuan</button>
          <div className="my-space-2xs h-[1px] bg-surface-variant"></div>
          <button type="button" onClick={handleLogout} className="flex items-center gap-space-sm px-space-md py-space-xs font-label-md text-label-md text-error hover:bg-error-container hover:text-on-error-container transition-colors w-full text-left"><span className="material-symbols-outlined text-base">logout</span>Keluar</button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => menuGo('/login')} className="flex items-center gap-space-sm px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors w-full text-left"><span className="material-symbols-outlined text-base">login</span>Masuk</button>
          <button type="button" onClick={() => menuGo('/register')} className="flex items-center gap-space-sm px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors w-full text-left"><span className="material-symbols-outlined text-base">person_add</span>Daftar</button>
        </>
      )}</div></div></div></div></header><main className="w-full pt-20 bg-background"><div className="flex flex-col w-full">
{/* Subtle Header Decor Scrim */}
<div className="w-full bg-gradient-to-b from-surface-container-low to-background py-space-xl">
<div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
{/* Top Title Bar */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
<div className="space-y-space-2xs">
<div className="inline-flex items-center gap-space-xs text-primary font-label-sm tracking-wider uppercase">
<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Manajemen Reservasi Tamu
          </div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Booking Saya</h1>
<p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            Kelola reservasi kamar aktif Anda, pantau status pemesanan, dan telusuri riwayat kenyamanan menginap terdahulu bersama StayEasy.
          </p>
</div>
{/* Simulation & Quick Assist Actions */}
<div className="flex items-center gap-space-xs shrink-0 self-start md:self-auto">
<a className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface-variant transition-colors" data-path="pusat-bantuan" href="#" title="Bantuan Booking">
<span className="material-symbols-outlined text-lg">contact_support</span>
</a>
</div>
</div>
{/* Filter Tabs Container */}
<div className="flex items-center justify-between gap-space-md overflow-x-auto pb-space-xs select-none">
<div className="flex items-center gap-space-xs bg-surface-container-lowest p-1.5 rounded-xl shadow-sm">
<button className={`tab-btn inline-flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md transition-all duration-150 ${activeTab === 'semua' ? 'bg-primary-container text-on-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`} data-filter="semua" onClick={() => setActiveTab('semua')} type="button">
<span>Semua</span>
<span className="px-1.5 py-0.5 text-label-sm rounded-full bg-surface-container-lowest/20 text-on-primary">{counts.semua}</span>
</button>
<button className={`tab-btn inline-flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md transition-all duration-150 ${activeTab === 'menunggu' ? 'bg-primary-container text-on-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`} data-filter="menunggu" onClick={() => setActiveTab('menunggu')} type="button">
<span>Menunggu Konfirmasi</span>
<span className="px-1.5 py-0.5 text-label-sm rounded-full bg-surface-container text-on-surface-variant">{counts.pending}</span>
</button>
<button className={`tab-btn inline-flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md transition-all duration-150 ${activeTab === 'terkonfirmasi' ? 'bg-primary-container text-on-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`} data-filter="terkonfirmasi" onClick={() => setActiveTab('terkonfirmasi')} type="button">
<span>Terkonfirmasi</span>
<span className="px-1.5 py-0.5 text-label-sm rounded-full bg-surface-container text-on-surface-variant">{counts.confirmed}</span>
</button>
<button className={`tab-btn inline-flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md transition-all duration-150 ${activeTab === 'selesai' ? 'bg-primary-container text-on-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`} data-filter="selesai" onClick={() => setActiveTab('selesai')} type="button">
<span>Selesai</span>
<span className="px-1.5 py-0.5 text-label-sm rounded-full bg-surface-container text-on-surface-variant">{counts.completed}</span>
</button>
<button className={`tab-btn inline-flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md transition-all duration-150 ${activeTab === 'dibatalkan' ? 'bg-primary-container text-on-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`} data-filter="dibatalkan" onClick={() => setActiveTab('dibatalkan')} type="button">
<span>Dibatalkan</span>
<span className="px-1.5 py-0.5 text-label-sm rounded-full bg-surface-container text-on-surface-variant">{counts.cancelled}</span>
</button>
</div>
<div className="hidden lg:flex items-center gap-space-2xs text-on-surface-variant font-label-sm">
<span className="material-symbols-outlined text-base">verified_user</span>
<span>Jaminan Layanan 24/7 &amp; Reservasi Aman</span>
</div>
</div>
</div>
</div>
{/* Content Workspace */}
<div className="max-w-[1240px] w-full mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl min-h-[500px]">
{/* LIST OF BOOKINGS CONTAINER */}
<div className="flex flex-col gap-space-lg transition-all duration-300" id="bookings-list">
{isLoading && (
<React.Fragment>
{[1, 2, 3].map((n) => (
<div key={n} className="bg-surface-container-lowest rounded-2xl p-space-lg flex flex-col lg:flex-row gap-space-lg animate-pulse">
<div className="w-full lg:w-64 h-48 bg-surface-container-high rounded-xl shrink-0"></div>
<div className="flex-1 space-y-space-sm">
<div className="h-3 w-1/4 bg-surface-container-high rounded"></div>
<div className="h-5 w-1/2 bg-surface-container-high rounded"></div>
<div className="h-3 w-2/3 bg-surface-container-high rounded"></div>
<div className="h-8 w-32 bg-surface-container-high rounded"></div>
</div>
</div>
))}
</React.Fragment>
)}

{!isLoading && error && (
<div className="bg-surface-container-lowest rounded-2xl p-space-2xl text-center flex flex-col items-center gap-space-md">
<span className="material-symbols-outlined text-5xl text-error">wifi_off</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Gagal memuat booking Anda</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
<button className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary font-title-md text-label-md font-medium" onClick={fetchBookings} type="button">Coba Lagi</button>
</div>
)}

{!isLoading && !error && visibleBookings.length === 0 && (
<div className="flex flex-col items-center justify-center text-center py-space-3xl px-gutter-mobile max-w-lg mx-auto">
<div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center mb-space-lg shadow-inner">
<span className="material-symbols-outlined text-primary text-5xl">hotel</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Belum ada booking pada status ini</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Coba pilih tab status lain atau cari kamar untuk memesan menginap Anda.</p>
<button className="mt-space-md px-space-lg py-3 rounded-xl bg-secondary-container text-on-primary font-title-md text-title-md shadow-md" onClick={() => navigate('/')} type="button">Cari Kamar Sekarang</button>
</div>
)}

{!isLoading && !error && visibleBookings.map((booking) => {
  const room = booking.room || {};
  const primaryPhoto = room.photos?.find((p) => p.is_primary) || room.photos?.[0];
  const photoUrl = resolveImageUrl(primaryPhoto?.url) || '/img/placeholder.svg';
  const statusStyles = {
    pending: ['bg-[#FEF3C7] text-[#B45309]', 'bg-[#B45309]', 'Menunggu Konfirmasi'],
    confirmed: ['bg-[#DCFCE7] text-[#15803D]', 'bg-[#15803D]', 'Terkonfirmasi'],
    completed: ['bg-[#F3F4F6] text-[#4B5563]', 'bg-[#6B7280]', 'Selesai'],
    cancelled: ['bg-[#FEE2E2] text-[#B91C1C]', 'bg-[#B91C1C]', 'Dibatalkan'],
    rejected: ['bg-[#FEE2E2] text-[#B91C1C]', 'bg-[#B91C1C]', 'Ditolak'],
  };
  const [badgeClass, dotClass, statusLabel] = statusStyles[booking.status] || statusStyles.pending;
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  return (
    <article key={booking.id} className="booking-card bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row gap-space-lg items-stretch">
      {/* Thumbnail */}
      <div className="relative w-full lg:w-64 h-48 lg:h-auto shrink-0 rounded-xl overflow-hidden bg-surface-container">
        <img alt={room.name || 'Kamar'} className="w-full h-full object-cover" src={photoUrl}/>
        <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full text-label-sm font-label-sm text-on-surface flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-sm text-outline">panorama</span>
          {room.name || 'Kamar'}
        </div>
      </div>
      {/* Center Information Block */}
      <div className="flex-1 flex flex-col justify-between gap-space-md min-w-0">
        <div className="space-y-space-xs">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Booking #{String(booking.id).padStart(6, '0')}</p>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{room.name || 'Kamar'}</h3>
          <div className="flex flex-wrap items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
              {String(booking.check_in_date).slice(0, 10)} - {String(booking.check_out_date).slice(0, 10)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-primary">group</span>
              {booking.guests} Tamu
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm p-space-xs bg-primary-fixed/20 rounded-xl font-body-sm text-body-sm text-on-surface">
          <span className="material-symbols-outlined text-primary text-base">confirmation_number</span>
          <span>Kode Booking: <strong className="font-title-md text-primary font-mono tracking-wider">BR-{String(booking.id).padStart(6, '0')}</strong></span>
        </div>
      </div>
      {/* Right Side: Status, Pricing, and Actions */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col justify-between items-start lg:items-end bg-surface-container-low lg:bg-transparent p-space-md lg:p-0 rounded-xl lg:rounded-none">
        <div className="w-full flex justify-between lg:justify-end items-center mb-space-sm">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wide ${badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
            {statusLabel}
          </span>
        </div>
        <div className="text-left lg:text-right my-space-xs">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Total Biaya</p>
          <p className="font-price-display text-price-display text-primary-container tracking-tight">Rp {Number(booking.total_price || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="w-full flex flex-col gap-space-2xs mt-space-sm">
          <div className="flex items-center gap-space-xs">
            <button className="flex-1 py-2 px-space-xs rounded-xl bg-surface-container-lowest hover:bg-surface-container font-label-md text-label-md text-on-surface shadow-sm transition-colors text-center" onClick={() => room.id && navigate(`/rooms/${room.id}`)} type="button">Lihat Detail</button>
            {canCancel && (
              <button className="px-space-sm py-2 rounded-xl hover:bg-error-container/30 text-error font-label-md text-label-md transition-colors flex items-center justify-center" onClick={() => openCancelModal(booking)} title="Batalkan Reservasi" type="button">
                <span className="material-symbols-outlined text-base">cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
})}
</div>
{/* EMPTY STATE COMPONENT (Toggleable / Filter Fallback) */}
</div>
{/* Interactive Cancellation Modal Dialog (Client-Side Vanilla JS) */}
<div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-200 ${cancelTarget ? '' : 'hidden'}`} id="cancel-modal">
<div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-xl space-y-space-md">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error">
<span className="material-symbols-outlined">warning</span>
</div>
<button className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" onClick={() => setCancelTarget(null)} type="button">
<span className="material-symbols-outlined">close</span>
</button>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Batalkan Pemesanan?</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Anda akan membatalkan reservasi nomor <strong className="text-on-surface font-mono" id="modal-booking-id">#SE-{cancelTarget ? String(cancelTarget.id).padStart(6, '0') : ''}</strong>. Sesuai kebijakan hotel, Anda berhak menerima pengembalian penuh jika dibatalkan sebelum batas waktu yang ditentukan.
        </p>
</div>
<div className="space-y-space-xs">
<label className="font-label-sm text-label-sm text-on-surface font-semibold">Pilih Alasan Pembatalan:</label>
<select className="w-full h-11 px-space-sm rounded-xl bg-surface-container-low border-0 text-on-surface font-body-sm focus:ring-2 focus:ring-primary outline-none" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
<option>Perubahan tanggal perjalanan</option>
<option>Menemukan akomodasi lain</option>
<option>Keperluan mendesak yang tidak terduga</option>
<option>Lainnya</option>
</select>
</div>
<div className="flex items-center gap-space-xs pt-space-xs">
<button className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors" onClick={() => setCancelTarget(null)} type="button">
          Kembali
        </button>
<button className="flex-1 py-2.5 rounded-xl bg-error hover:bg-on-error-container text-on-error font-label-md text-label-md transition-colors shadow-sm disabled:opacity-60" disabled={cancelling} onClick={handleCancel} type="button">
        {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
        </button>
</div>
</div>
</div>

</div></main><footer className="w-full bg-surface-container-low"><div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl"><div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl"><div className="space-y-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Platform reservasi hotel dan penginapan terpercaya dengan jaminan kenyamanan dan penawaran terbaik di seluruh Indonesia.</p></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Navigasi</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="beranda" href="#">Beranda</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="booking-saya" href="#">Booking Saya</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Pusat Bantuan</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Akun &amp; Keanggotaan</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="profil-akun" href="#">Profil Akun</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pengaturan" href="#">Pengaturan</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Kebijakan Privasi</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Hubungi Kami</h4><p className="font-body-sm text-body-sm text-on-surface-variant">Email: support@stayeasy.id</p><p className="font-body-sm text-body-sm text-on-surface-variant">WhatsApp: +62 812-3456-7890</p><p className="font-body-sm text-body-sm text-on-surface-variant">Senin - Minggu: 24 Jam Nonstop</p></div></div><div className="mt-space-xl pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm"><p>© 2025 StayEasy Indonesia. Seluruh hak cipta dilindungi.</p><p className="font-label-sm text-label-sm text-tertiary">Warm Modern Hospitality</p></div></div></footer>
    </>
  );
}
