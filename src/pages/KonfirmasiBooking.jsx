import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { resolveImageUrl } from '../lib/apiClient';
import * as bookingService from '../services/bookingService';

export default function KonfirmasiBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
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

  const routeState = location.state || {};
  const room = routeState.room || null;
  const checkIn = routeState.checkIn || '';
  const checkOut = routeState.checkOut || '';
  const guests = Number(routeState.guests || 2);
  const nights = routeState.nights || 1;
  const price = Number(room?.price_per_night || 0);
  const total = routeState.total || price * nights;
  const rupiah = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`;
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formatID = (d) => {
    const dt = new Date(d);
    return `${dayNames[dt.getDay()]}, ${dt.getDate()} ${monthNames[dt.getMonth()]} ${dt.getFullYear()}`;
  };
  const primaryPhotoUrl =
    (room?.photos?.find((p) => p.is_primary) || room?.photos?.[0])?.url || null;

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState(false); // 409
  const [successBooking, setSuccessBooking] = useState(null);
  const [formError, setFormError] = useState('');

  const handleConfirm = async () => {
    if (!room) return;
    setSubmitting(true);
    setFormError('');
    setConflict(false);
    try {
      const booking = await bookingService.createBooking({
        room_id: room.id,
        check_in_date: checkIn, // format YYYY-MM-DD
        check_out_date: checkOut, // format YYYY-MM-DD
        guests,
        notes,
      });
      setSuccessBooking(booking);
    } catch (err) {
      if (err.isConflict) {
        // Kamar sudah dipesan orang lain untuk tanggal ini (race condition)
        setConflict(true);
      } else {
        setFormError(err.message || 'Gagal membuat booking. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConflictBackToSearch = () => {
    setConflict(false);
    navigate('/search');
  };
  return (
    <>
<header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-lg"><div className="flex items-center gap-space-xl"><a className="flex items-center gap-space-xs" data-path="beranda" href="#"><svg className="h-8 w-8 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect fill="#FD7549" height="10" rx="2" width="10" x="8" y="18"/><circle cx="34" cy="18" fill="#FFFFFF" r="4.5"/><path d="M8 32C14 32 18 24 24 24C30 24 34 30 40 26" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5"/></svg><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></a><nav className="hidden md:flex items-center gap-space-lg h-20" data-active-classes="text-primary-container font-title-md text-title-md border-b-2 border-primary-container"><a className="h-full flex items-center text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors" data-path="beranda" href="#">Beranda</a><a className="h-full flex items-center text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors" data-path="booking-saya" href="#">Booking Saya</a></nav></div><div className="flex items-center gap-space-md"><div ref={menuRef} className="relative group"><button aria-haspopup="menu" aria-expanded={menuOpen} className="flex items-center gap-space-sm pl-space-xs pr-space-sm py-space-xs rounded-full hover:bg-surface-container-low transition-colors" type="button" onClick={() => setMenuOpen(!menuOpen)}><div className="w-8 h-8 rounded-full bg-surface-container-low ring-1 ring-outline-variant flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-base text-on-surface-variant">person</span></div><div className="text-left hidden sm:flex flex-col"><span className="font-label-md text-label-md text-on-surface leading-tight">{user?.name || 'Masuk / Daftar'}</span></div><span className="material-symbols-outlined text-on-surface-variant text-base">{menuOpen ? 'expand_less' : 'expand_more'}</span></button><div className={`absolute right-0 top-full pt-space-2xs w-56 bg-surface-container-lowest rounded-xl shadow-[0_16px_36px_-6px_rgba(44,44,42,0.12),0_6px_16px_-4px_rgba(44,44,42,0.06)] py-space-xs transition-all duration-150 z-50 ${menuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}><div className="px-space-md py-space-xs sm:hidden border-b border-surface-variant mb-space-2xs"><p className="font-label-md text-label-md text-on-surface">{user?.name || 'Masuk / Daftar'}</p></div>{isAuthenticated ? (
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
      )}</div></div></div></div></header><main className="w-full pt-20 bg-background flex-1"><div className="flex flex-col w-full py-space-xl px-gutter-mobile lg:px-gutter-desktop">
{/* Main Booking Confirmation Card Container */}
<div className="max-w-[700px] mx-auto w-full">
{/* Back Navigation Breadcrumb */}
    <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-space-2xs font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors mb-space-md group">
      <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
      <span>Kembali ke Detail Kamar</span>
    </button>
{/* Primary Card Canvas */}
<div className="bg-surface-container-lowest rounded-2xl shadow-md p-space-md sm:p-space-xl space-y-space-xl">
{/* Header Section */}
<div className="space-y-space-2xs">
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm uppercase tracking-wider">Langkah Terakhir</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">• Konfirmasi Instan</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Konfirmasi Booking Anda</h1>
<p className="font-body-md text-body-md text-on-surface-variant">Periksa kembali detail pesanan Anda sebelum melanjutkan reservasi.</p>
</div>
{/* Room Summary Card */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row gap-space-md items-center sm:items-start">
<div className="w-full sm:w-44 h-36 shrink-0 overflow-hidden rounded-lg bg-surface-container shadow-inner">
<img alt={room?.name || 'Foto kamar'} className="w-full h-full object-cover" src={primaryPhotoUrl ? resolveImageUrl(primaryPhotoUrl) : '/img/placeholder.svg'}/>
</div>
<div className="flex flex-col flex-1 min-w-0 space-y-space-xs w-full">
<div className="flex items-center justify-between gap-space-xs flex-wrap">
<span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">
              {room?.room_type?.name || 'Kamar'}
            </span>
</div>
<h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{room?.name || 'Kamar'}</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
            {room?.description || 'Kamar dengan fasilitas lengkap untuk kenyamanan menginap Anda.'}
          </p>
<div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm pt-space-2xs">
<span className="material-symbols-outlined text-base text-primary">bed</span>
<span>{room?.facilities?.length ? room.facilities.map((f) => f.name).join(' • ') : 'Fasilitas lengkap'}</span>
</div>
</div>
</div>
{/* Dates & Duration Section */}
<div className="bg-surface rounded-xl p-space-md space-y-space-md">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
            Jadwal Menginap
          </span>
<span className="px-space-sm py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">
            {nights} Malam
          </span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
<p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Check-in</p>
<p className="font-title-md text-title-md text-on-surface">{formatID(checkIn)}</p>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Mulai 14:00 WIB</p>
</div>
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
<p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Check-out</p>
<p className="font-title-md text-title-md text-on-surface">{formatID(checkOut)}</p>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Sebelum 12:00 WIB</p>
</div>
</div>
</div>
{/* Guest & Booker Details */}
<div className="bg-surface rounded-xl p-space-md space-y-space-sm">
<div className="flex items-center gap-space-xs text-on-surface font-title-md text-title-md">
<span className="material-symbols-outlined text-primary text-xl">group</span>
<span>Detail Tamu &amp; Pemesan</span>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-space-xs">
<div className="flex items-center justify-between text-on-surface">
<span className="font-label-md text-label-md">Kapasitas Reservasi</span>
<span className="font-title-md text-title-md">{guests} Tamu Dewasa, 1 Kamar</span>
</div>
<div className="pt-space-xs flex flex-col sm:flex-row sm:items-center justify-between text-on-surface-variant text-body-sm font-body-sm gap-1">
<span className="flex items-center gap-1.5 text-on-surface font-medium">
<span className="material-symbols-outlined text-base text-tertiary">badge</span>
              {user?.name || 'Tamu'}
            </span>
<span className="text-tertiary">{user?.email || '-'} {user?.phone ? `• ${user.phone}` : ''}</span>
</div>
</div>
</div>
{/* Special Requests Form */}
<div className="space-y-space-xs">
<label className="block font-title-md text-title-md text-on-surface" htmlFor="catatan-tambahan">
          Catatan Tambahan (Opsional)
        </label>
<textarea className="w-full bg-surface-container-lowest p-space-sm rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none" id="catatan-tambahan" onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Mohon kamar di lantai tinggi, check-in lebih awal jika memungkinkan, atau kasur non-smoking..." rows="3" value={notes}></textarea>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-tertiary">info</span>
          Permintaan khusus tergantung ketersediaan pihak hotel saat kedatangan.
        </p>
</div>
{/* Price Breakdown Panel */}
<div className="bg-surface-container rounded-xl p-space-lg space-y-space-md shadow-sm">
<h3 className="font-title-md text-title-md text-on-surface flex items-center justify-between">
<span>Rincian Pembayaran</span>
<span className="px-2 py-0.5 bg-surface-container-highest text-tertiary font-label-sm text-label-sm rounded-full">IDR</span>
</h3>
<div className="space-y-space-xs font-body-md text-body-md">
<div className="flex justify-between items-center text-on-surface-variant">
<span>{rupiah(price)} × {nights} malam</span>
<span className="font-medium text-on-surface">{rupiah(total)}</span>
</div>
<div className="flex justify-between items-center text-on-surface-variant">
<span>Biaya Layanan &amp; Sarapan {guests} Tamu</span>
<span className="text-primary font-medium">Gratis (Termasuk)</span>
</div>
<div className="flex justify-between items-center text-on-surface-variant">
<span>Pajak &amp; Biaya Pemerintah (PPN)</span>
<span className="text-on-surface-variant">Sudah Termasuk</span>
</div>
</div>
<div className="h-[1px] bg-outline-variant/40 my-space-xs"></div>
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
<div>
<p className="font-label-md text-label-md text-on-surface-variant">Total Pembayaran</p>
<p className="font-label-sm text-label-sm text-secondary font-medium">Pembayaran dilakukan saat check-in di hotel</p>
</div>
<div className="text-left sm:text-right">
<p className="font-price-display text-price-display text-primary font-bold">{rupiah(total)}</p>
</div>
</div>
<div className="bg-surface-container-lowest/80 rounded-lg p-space-sm flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
<span className="material-symbols-outlined text-primary text-base shrink-0">verified_user</span>
<span>Tanpa biaya di muka. Pembayaran dilakukan saat check-in sesuai kebijakan hotel.</span>
</div>
</div>
{/* Action Buttons */}
{formError && (
<div className="p-3 rounded-lg bg-error-container border border-outline-variant/40 text-on-error-container font-body-sm text-body-sm text-center" role="alert">
          {formError}
        </div>
)}
<div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-space-md pt-space-xs">
<a className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-md text-title-md transition-colors text-center" data-path="detail-kamar" href="#">
          Kembali
        </a>
<button className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-title-md text-title-md flex items-center justify-center gap-space-xs shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-60" disabled={submitting} onClick={handleConfirm} type="button">
{submitting ? (
<span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
) : (
<>
<span>Konfirmasi Booking</span>
<span className="material-symbols-outlined text-lg">arrow_forward</span>
</>
)}
</button>
</div>
</div>
</div>
{/* Conflict Modal (409: kamar sudah dipesan orang lain) */}
{conflict && (
<div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-gutter-mobile bg-black/60 backdrop-blur-sm" role="dialog">
<div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-xl shadow-2xl text-center space-y-space-md">
<span className="material-symbols-outlined text-5xl text-error">event_busy</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Maaf, kamar baru saja dipesan orang lain</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">
          Kamar <strong>{room?.name}</strong> sudah tidak tersedia untuk tanggal {checkIn} - {checkOut}. Silakan pilih tanggal lain atau kamar lain dari hasil pencarian.
        </p>
<div className="space-y-space-xs pt-space-2xs">
<button className="w-full block py-3.5 px-space-md rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-title-md text-title-md shadow-md transition-all text-center" onClick={handleConflictBackToSearch} type="button">
            Kembali ke Hasil Pencarian
          </button>
<button className="w-full block py-2 px-space-md text-on-surface-variant hover:text-primary font-label-md text-label-md transition-colors text-center" onClick={() => setConflict(false)} type="button">
            Tetap di Halaman Ini
          </button>
</div>
</div>
</div>
)}
{/* Success Modal (setelah booking berhasil dibuat) */}
{successBooking && (
<div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-gutter-mobile bg-black/60 backdrop-blur-sm" role="dialog">
<div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-xl shadow-2xl text-center space-y-space-md">
<span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Booking Berhasil Dibuat!</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">
          Pesanan Anda menunggu konfirmasi admin. Bukti reservasi dikirim ke email Anda.
        </p>
<div className="bg-surface-container-low rounded-xl p-space-sm flex items-center justify-between gap-space-xs">
<div className="text-left">
<p className="font-label-sm text-label-sm text-on-surface-variant">Nomor Booking ID</p>
<p className="font-title-md text-title-md text-primary font-mono tracking-tight font-bold">#SE-{String(successBooking.id).padStart(6, '0')}</p>
</div>
</div>
<div className="py-space-2xs bg-surface rounded-lg text-label-sm font-label-sm text-tertiary">
          {room?.name} • {checkIn} - {checkOut}
        </div>
<div className="space-y-space-xs pt-space-2xs">
<button className="w-full block py-3.5 px-space-md rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-title-md text-title-md shadow-md transition-all text-center" onClick={() => { toast.success('Booking berhasil dibuat!'); navigate('/bookings'); }} type="button">
            Lihat Booking Saya
          </button>
<button className="w-full block py-2 px-space-md text-on-surface-variant hover:text-primary font-label-md text-label-md transition-colors text-center" onClick={() => navigate('/')} type="button">
            Kembali ke Beranda
          </button>
</div>
</div>
</div>
)}
</div></main><footer className="w-full bg-surface-container-low"><div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl"><div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl"><div className="space-y-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Platform reservasi hotel dan penginapan terpercaya dengan jaminan kenyamanan dan penawaran terbaik di seluruh Indonesia.</p></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Navigasi</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="beranda" href="#">Beranda</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="booking-saya" href="#">Booking Saya</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Pusat Bantuan</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Akun &amp; Keanggotaan</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="profil-akun" href="#">Profil Akun</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pengaturan" href="#">Pengaturan</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Kebijakan Privasi</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Hubungi Kami</h4><p className="font-body-sm text-body-sm text-on-surface-variant">Email: support@stayeasy.id</p><p className="font-body-sm text-body-sm text-on-surface-variant">WhatsApp: +62 812-3456-7890</p><p className="font-body-sm text-body-sm text-on-surface-variant">Senin - Minggu: 24 Jam Nonstop</p></div></div><div className="mt-space-xl pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm"><p>© 2025 StayEasy Indonesia. Seluruh hak cipta dilindungi.</p><p className="font-label-sm text-label-sm text-tertiary">Warm Modern Hospitality</p></div></div></footer>
    </>
  );
}
