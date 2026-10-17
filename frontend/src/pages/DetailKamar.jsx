import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import * as roomService from '../services/roomService';
import { resolveImageUrl } from '../lib/apiClient';

// 1:1 port of detail_kamar_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function DetailKamar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { slug } = useParams();
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
  const location = useLocation();
  const routeState = location.state || {};

  const [room, setRoom] = useState(routeState.room || null);
  const [isLoading, setIsLoading] = useState(!routeState.room);
  const [error, setError] = useState(null);

  const [checkIn, setCheckIn] = useState(routeState.checkIn || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(routeState.checkOut || format(new Date(Date.now() + 3 * 86400000), 'yyyy-MM-dd'));
  const [guests, setGuests] = useState(Number(routeState.guests) || 2);

  // Cek ketersediaan ulang saat tanggal berubah (reuse endpoint search)
  const [isAvailable, setIsAvailable] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    roomService
      .getRoomDetail(slug)
      .then((data) => {
        if (!cancelled) setRoom(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Gagal memuat detail kamar.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    setCheckingAvailability(true);
    roomService
      .searchRooms({ check_in: checkIn, check_out: checkOut, guests })
      .then((result) => {
        if (!cancelled) setIsAvailable(result.rooms.some((r) => r.id === Number(slug)));
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [room, checkIn, checkOut, guests, slug]);

  const nights = Math.max(
    1,
    Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
  );
  const price = Number(room?.price_per_night || 0);
  const total = price * nights;
  const rupiah = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`;

  const handleBooking = () => {
    navigate('/booking/confirm', {
      state: { room, checkIn, checkOut, guests, nights, total },
    });
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const photos = room?.photos || [];
  const galleryUrl = (i) => resolveImageUrl(photos[i]?.url) || '/img/placeholder.svg';
  const totalSlides = Math.max(photos.length, 1);

  const handlePrevSlide = () => setCurrentSlide((s) => (s === 0 ? totalSlides - 1 : s - 1));
  const handleNextSlide = () => setCurrentSlide((s) => (s === totalSlides - 1 ? 0 : s + 1));
  const handleSlideSelect = (index) => setCurrentSlide(index);

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
      )}</div></div></div></div></header><main className="w-full pt-20 bg-background min-h-[calc(100vh-80px)] flex flex-col justify-between"><div><div className="flex flex-col w-full">
{/* Content Area */}
<div className="max-w-[1240px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-md lg:py-space-xl">
{/* 1. Top Navigation & Action Row */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
<div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
<a className="hover:text-primary-container transition-colors flex items-center gap-1 font-label-md text-label-md" data-path="beranda" href="#">
<span className="material-symbols-outlined text-[18px]">arrow_back</span>
<span>Kembali ke hasil pencarian</span>
</a>
<span className="text-outline-variant">/</span>
<span className="hidden md:inline text-on-surface-variant font-label-md text-label-md">Hasil Pencarian</span>
<span className="hidden md:inline text-outline-variant">/</span>
<span className="text-on-surface font-title-md text-title-md truncate max-w-[200px] sm:max-w-xs">{room?.name || 'Kamar'}</span>
</div>
</div>
{/* 2. Hero Room Gallery Section */}
<section className="mb-space-2xl">
{/* Main Photo Showcase with Badges and Arrows */}
<div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[560px] rounded-2xl overflow-hidden shadow-md bg-surface-container">
{/* Floating Status Pills */}
<div className="absolute top-space-md left-space-md z-20 flex flex-wrap items-center gap-space-xs pointer-events-none">
<span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm shadow-sm backdrop-blur-sm">
<span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            Paling Populer
          </span>
<span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm shadow-sm backdrop-blur-sm">
<span className="material-symbols-outlined text-[16px]">wb_twilight</span>
            Balkon Menghadap Laut
          </span>
</div>
{/* Slider Image Container */}
<div className="w-full h-full relative" id="galleryContainer">
<img alt="Deluxe Ocean Balcony Room" className="w-full h-full object-cover transition-opacity duration-300" data-alt="Deluxe ocean balcony hotel room interior" src={galleryUrl(currentSlide)} id="mainGalleryImage" />
<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
</div>
{/* Floating Navigation Prev / Next Buttons */}
<button aria-label="Foto Sebelumnya" className="absolute left-space-md top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-surface-container-lowest/90 text-on-surface hover:bg-surface-container-lowest flex items-center justify-center shadow-lg transition-transform hover:scale-105 backdrop-blur-sm" onClick={handlePrevSlide} type="button">
<span className="material-symbols-outlined text-[24px]">chevron_left</span>
</button>
<button aria-label="Foto Selanjutnya" className="absolute right-space-md top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-surface-container-lowest/90 text-on-surface hover:bg-surface-container-lowest flex items-center justify-center shadow-lg transition-transform hover:scale-105 backdrop-blur-sm" onClick={handleNextSlide} type="button">
<span className="material-symbols-outlined text-[24px]">chevron_right</span>
</button>
{/* Image Counter Overlay Pill */}
<div className="absolute bottom-space-md right-space-md z-20 px-space-sm py-1 rounded-full bg-inverse-surface/80 text-inverse-on-surface font-label-sm text-label-sm backdrop-blur-md flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">photo_library</span>
<span className="font-medium tabular-nums">{currentSlide + 1} / {totalSlides}</span>
</div>
</div>
{/* Thumbnail Strip & Dots */}
<div className="mt-space-sm flex flex-col md:flex-row items-center justify-between gap-space-sm">
<div className="grid grid-cols-4 gap-space-xs sm:gap-space-sm w-full md:w-auto flex-1 max-w-2xl">
{photos.slice(0, 4).map((photo, i) => (
<button className="thumb-btn relative aspect-[16/10] rounded-xl overflow-hidden shadow-sm transition-all outline-none focus:outline-none" data-index={i} onClick={() => handleSlideSelect(i)} type="button">
<img alt={`Foto ${i + 1}`} className="w-full h-full object-cover" data-alt={photo?.caption || ''} src={galleryUrl(i)}/>
<div className={`thumb-overlay absolute inset-0 rounded-xl transition-all ${currentSlide === i ? 'bg-primary-container/20 ring-4 ring-primary-container' : 'bg-transparent ring-0 hover:bg-black/10'}`}></div>
</button>
))}
</div>
{/* Carousel Indicator Dots */}
<div className="flex items-center gap-space-2xs py-space-2xs">
{[...Array(totalSlides)].map((_, i) => (
<button aria-label={`Slide ${i + 1}`} className={`rounded-full transition-all ${currentSlide === i ? 'w-7 h-2 bg-primary-container' : 'w-2 h-2 bg-outline-variant hover:bg-outline'}`} onClick={() => handleSlideSelect(i)} type="button"></button>
))}
</div>
</div>
</section>
{/* 3. Two-Column Main Layout: Details (65%) vs Sticky Booking Form (35%) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
{/* LEFT COLUMN: Room Specifications & Info (65% width = 8 cols on desktop) */}
<div className="lg:col-span-8 flex flex-col gap-space-2xl">
{/* Room Header & Meta Section */}
<div className="flex flex-col gap-space-sm">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px]">verified</span>
              Terverifikasi StayEasy
            </span>
<span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px]">smoke_free</span>
              Bebas Rokok
            </span>
<span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px]">visibility</span>
              Pemandangan Laut
            </span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-space-2xs">
            {room?.name || 'Kamar'}
          </h1>
<div className="flex flex-wrap items-center gap-y-1 gap-x-space-sm text-on-surface-variant font-body-md text-body-md">
<span>{room?.room_type?.name || 'Kamar'}</span>
<span className="text-outline-variant">•</span>
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[18px]">group</span>
              Kapasitas {room?.capacity || 2} tamu
            </span>
</div>

</div>
{/* Room Description */}
<div className="flex flex-col gap-space-xs">
<h2 className="font-headline-sm text-headline-sm text-on-surface">Tentang Kamar Ini</h2>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {room?.description || 'Rasakan kenyamanan menginap terbaik di kamar ini. Detail fasilitas dan kebijakan dapat Anda lihat pada ringkasan di bawah ini.'}
          </p>
</div>
{/* Highlight Amenities Visual Grid */}
<div className="flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<h2 className="font-headline-sm text-headline-sm text-on-surface">Fasilitas Kamar Lengkap</h2>
<span className="font-label-sm text-label-sm text-primary font-semibold">{room?.facilities?.length ?? 0} Fasilitas Utama</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-space-sm">
{room?.facilities?.length ? room.facilities.map((f) => (
<div className="flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-sm" key={f.id}>
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[22px]">{f.icon}</span>
</div>
<div>
<p className="font-title-md text-title-md text-on-surface">{f.name}</p>
</div>
</div>
)) : (
<div className="flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<div>
<p className="font-body-md text-body-md text-on-surface-variant">Tidak ada fasilitas tambahan yang tercantum untuk kamar ini.</p>
</div>
</div>
)}
</div>
</div>
{/* Room Regulations & Cancellation Policy Card */}
<div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center gap-space-xs mb-space-sm">
<span className="material-symbols-outlined text-primary text-[24px]">policy</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Kebijakan &amp; Peraturan Menginap</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md text-on-surface-variant font-body-sm text-body-sm">
<div className="flex flex-col gap-1 p-space-sm rounded-xl bg-surface-container-low">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-1">
<span className="material-symbols-outlined text-[18px] text-primary">login</span>
                Check-in
              </span>
<span>Mulai pukul 14:00 WIB</span>
<span className="text-tertiary">Early check-in tergantung ketersediaan</span>
</div>
<div className="flex flex-col gap-1 p-space-sm rounded-xl bg-surface-container-low">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-1">
<span className="material-symbols-outlined text-[18px] text-primary">logout</span>
                Check-out
              </span>
<span>Sebelum pukul 12:00 WIB</span>
<span className="text-tertiary">Penitipan bagasi gratis tersedia</span>
</div>
<div className="flex flex-col gap-1 p-space-sm rounded-xl bg-primary-fixed/50">
<span className="font-title-md text-title-md text-on-primary-fixed flex items-center gap-1">
<span className="material-symbols-outlined text-[18px] text-primary">free_cancellation</span>
                Bebas Pembatalan
              </span>
<span className="text-on-surface">Gratis pembatalan s/d 11 Sep 23:59</span>
<span className="text-primary font-semibold">Pengembalian dana 100%</span>
</div>
</div>
</div>
</div>
{/* RIGHT COLUMN: Sticky Booking Calculation Card (35% width = 4 cols on desktop) */}
<div className="lg:col-span-4 sticky top-24 z-30">
<div className="w-full bg-surface-container-lowest rounded-2xl p-space-lg shadow-xl relative overflow-hidden">
{/* Card Header: Pricing & Discount Pill */}
<div className="flex items-start justify-between gap-space-xs mb-space-md">
<div>
<div className="flex items-baseline gap-1">
<span className="font-headline-lg text-headline-lg text-primary tracking-tight" id="priceDisplay">{rupiah(price)}</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">/ malam</span>
</div>
<div className="flex items-center gap-space-2xs mt-0.5">
<span className="text-outline font-body-sm text-body-sm">Harga asli sesuai sistem</span>
</div>
</div>
<div className="flex flex-col items-end text-right">
<span className="px-space-xs py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">Termasuk Sarapan</span>
<span className="text-[11px] text-tertiary mt-1">Pajak sudah termasuk</span>
</div>
</div>
{/* Interactive Date & Guest Inputs */}
<div className="flex flex-col gap-space-xs mb-space-md">
{/* Dates Block */}
<div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-1 cursor-pointer hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span className="uppercase tracking-wider">Jadwal Menginap</span>
<span className="text-primary font-semibold">{nights} Malam</span>
</div>
<div className="grid grid-cols-2 gap-space-xs items-center pt-1">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Check-in</span>
<input className="font-title-md text-title-md text-on-surface bg-transparent focus:outline-none cursor-pointer" id="checkInField" min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setCheckIn(e.target.value)} type="date" value={checkIn}/>
<span className="text-[12px] text-tertiary">Mulai 14:00</span>
</div>
<div className="flex flex-col pl-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">Check-out</span>
<input className="font-title-md text-title-md text-on-surface bg-transparent focus:outline-none cursor-pointer" min={checkIn} onChange={(e) => setCheckOut(e.target.value)} type="date" value={checkOut}/>
<span className="text-[12px] text-tertiary">Sebelum 12:00</span>
</div>
</div>
</div>
{/* Guest Selector Block */}
<div className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Jumlah Tamu &amp; Kamar</span>
<input className="w-20 font-title-md text-title-md text-on-surface bg-transparent focus:outline-none" max={room?.capacity || 10} min={1} onChange={(e) => setGuests(Number(e.target.value))} type="number" value={guests}/>
</div>
<span className="material-symbols-outlined text-on-surface-variant text-[20px]">expand_more</span>
</div>
</div>
{/* Cost Calculation Breakdown */}
<div className="flex flex-col gap-space-2xs py-space-sm mb-space-md text-on-surface-variant font-body-sm text-body-sm">
<div className="flex items-center justify-between">
<span>{rupiah(price)} × {nights} malam</span>
<span className="text-on-surface font-medium">{rupiah(total)}</span>
</div>
<div className="flex items-center justify-between">
<span className="flex items-center gap-1">
                Biaya Layanan &amp; Fasilitas
                <span className="material-symbols-outlined text-[14px] text-primary" title="Fasilitas StayEasy bebas biaya admin">info</span>
</span>
<span className="text-primary font-semibold">Gratis (Rp 0)</span>
</div>
<div className="flex items-center justify-between">
<span>Sarapan Prasmanan 2 Orang</span>
<span className="text-primary font-semibold">Termasuk</span>
</div>
<div className="my-space-xs h-[1px] bg-surface-container"></div>
<div className="flex items-center justify-between pt-space-2xs">
<span className="font-title-md text-title-md text-on-surface font-semibold">Total Biaya</span>
<div className="text-right">
<span className="font-headline-sm text-headline-sm text-primary" id="totalPriceDisplay">{rupiah(total)}</span>
<p className="text-[11px] text-on-surface-variant">Sudah termasuk PPN &amp; Servis</p>
</div>
</div>
</div>
{/* Availability Alert Banner (Hidden by default, shown when unavailable) */}
<div className={`mb-space-sm p-space-sm rounded-xl bg-error-container text-on-error-container font-label-md text-label-md items-center gap-space-xs ${!isAvailable && !checkingAvailability ? 'flex' : 'hidden'}`} id="unavailabilityAlert">
<span className="material-symbols-outlined text-[20px] text-error">warning</span>
<span>Kamar penuh untuk tanggal {checkIn} - {checkOut}.</span>
</div>
{/* Primary CTA Button Group */}
<div className="flex flex-col gap-space-xs">
<button className={`w-full py-3.5 px-space-lg rounded-xl font-headline-sm text-title-md flex items-center justify-center gap-space-xs transition-all shadow-md hover:shadow-lg active:scale-[0.99] ${isAvailable ? 'bg-secondary-container hover:bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'}`} disabled={!isAvailable || checkingAvailability} id="bookingCtaBtn" onClick={handleBooking} type="button">
<span className="material-symbols-outlined text-[20px]">{checkingAvailability ? 'progress_activity' : 'lock'}</span>
<span id="bookingCtaText">{checkingAvailability ? 'Memeriksa ketersediaan...' : isAvailable ? 'Pesan Kamar Ini' : 'Tidak Tersedia'}</span>
<span className="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
{/* Alternative Action Button when unavailable */}
<button className={`w-full py-2.5 px-space-md rounded-xl bg-surface-container text-on-surface font-label-md text-label-md items-center justify-center gap-space-2xs hover:bg-surface-container-high transition-colors ${isAvailable ? 'hidden' : 'flex'}`} id="altDateBtn" onClick={() => document.getElementById('checkInField')?.focus()} type="button">
<span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Pilih Tanggal Lain
            </button>
</div>
{/* Trust Badges & Guarantee */}
<div className="mt-space-md pt-space-xs flex items-center justify-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm text-center">
<span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
<span>Reservasi tanpa biaya di muka — pembayaran dilakukan di hotel saat check-in</span>
</div>
{/* Accumulated price info */}
<div className="mt-space-lg pt-space-sm bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Reservasi dilindungi jaminan harga &amp; kenyamanan StayEasy</span>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div><footer className="w-full bg-surface-container-low mt-space-2xl"><div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl"><div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl"><div className="space-y-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Platform reservasi hotel dan penginapan terpercaya dengan jaminan kenyamanan dan penawaran terbaik di seluruh Indonesia.</p></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Navigasi</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="beranda" href="#">Beranda</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="booking-saya" href="#">Booking Saya</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Pusat Bantuan</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Akun &amp; Keanggotaan</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="profil-akun" href="#">Profil Akun</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pengaturan" href="#">Pengaturan</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Kebijakan Privasi</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Hubungi Kami</h4><p className="font-body-sm text-body-sm text-on-surface-variant">Email: support@stayeasy.id</p><p className="font-body-sm text-body-sm text-on-surface-variant">WhatsApp: +62 812-3456-7890</p><p className="font-body-sm text-body-sm text-on-surface-variant">Senin - Minggu: 24 Jam Nonstop</p></div></div><div className="mt-space-xl pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm"><p>© 2025 StayEasy Indonesia. Seluruh hak cipta dilindungi.</p><p className="font-label-sm text-label-sm text-tertiary">Warm Modern Hospitality</p></div></div></footer></main>
    </>
  );
}
