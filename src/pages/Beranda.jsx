import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { getRooms } from '../services/roomService';
import { resolveImageUrl } from '../lib/apiClient';

// 1:1 port of beranda_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function Beranda() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const defaultCheckIn = new Date(today.getTime() + 86400000);
  const defaultCheckOut = new Date(today.getTime() + 3 * 86400000);

  const [checkIn, setCheckIn] = useState(format(defaultCheckIn, 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(defaultCheckOut, 'yyyy-MM-dd'));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    setRoomsLoading(true);
    getRooms()
      .then((res) => {
        if (active) {
          setRooms(res || []);
          setRoomsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setRooms([]);
          setRoomsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const rupiah = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`;

  const handleSearch = (e) => {
    e.preventDefault();
    // Format tanggal HARUS YYYY-MM-DD saat dikirim ke backend
    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      guests: String(guests),
    });
    navigate(`/search?${params.toString()}`);
  };

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
  return (
    <>
<header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-lg"><div className="flex items-center gap-space-xl"><a className="flex items-center gap-space-xs" data-path="beranda" href="#"><svg className="h-8 w-8 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect fill="#FD7549" height="10" rx="2" width="10" x="8" y="18"/><circle cx="34" cy="18" fill="#FFFFFF" r="4.5"/><path d="M8 32C14 32 18 24 24 24C30 24 34 30 40 26" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5"/></svg><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></a><nav className="hidden md:flex items-center gap-space-lg h-20" data-active-classes="text-primary-container font-title-md text-title-md border-b-2 border-primary-container"><a aria-current="page" className="h-full flex items-center transition-colors text-primary-container font-title-md text-title-md border-b-2 border-primary-container" data-path="beranda" href="#">Beranda</a><a className="h-full flex items-center text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors" data-path="booking-saya" href="#">Booking Saya</a></nav></div><div className="flex items-center gap-space-md"><div ref={menuRef} className="relative group"><button aria-haspopup="menu" aria-expanded={menuOpen} className="flex items-center gap-space-sm pl-space-xs pr-space-sm py-space-xs rounded-full hover:bg-surface-container-low transition-colors" type="button" onClick={() => setMenuOpen(!menuOpen)}>
<div className="w-8 h-8 rounded-full bg-surface-container-low ring-1 ring-outline-variant flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-base text-on-surface-variant">person</span></div><div className="text-left hidden sm:flex flex-col"><span className="font-label-md text-label-md text-on-surface leading-tight">{user?.name || 'Masuk / Daftar'}</span></div><span className="material-symbols-outlined text-on-surface-variant text-base">{menuOpen ? 'expand_less' : 'expand_more'}</span></button><div className={`absolute right-0 top-full pt-space-2xs w-56 bg-surface-container-lowest rounded-xl shadow-[0_16px_36px_-6px_rgba(44,44,42,0.12),0_6px_16px_-4px_rgba(44,44,42,0.06)] py-space-xs transition-all duration-150 z-50 ${menuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}><div className="px-space-md py-space-xs sm:hidden border-b border-surface-variant mb-space-2xs"><p className="font-label-md text-label-md text-on-surface">{user?.name || 'Masuk / Daftar'}</p></div>{isAuthenticated ? (
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
      )}</div></div></div></div></header><main className="w-full pt-20 bg-background flex-1"><div className="flex flex-col w-full">
{/* Hero Section */}
<section className="relative w-full -mt-20 overflow-hidden">
{/* Hero Background Image & Atmospheric Scrim */}
<div className="absolute inset-0 z-0">
<img alt="Luxury hotel room interior with warm ambient illumination and floor-to-ceiling panoramic glass windows" className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out" src="/img/remote_1.jpg"/>
<div className="absolute inset-0 bg-gradient-to-r from-on-surface/90 via-primary/80 to-primary-container/85 mix-blend-multiply"></div>
<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30"></div>
</div>
{/* Hero Content */}
<div className="relative z-10 max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop pt-32 pb-24 lg:pt-36 lg:pb-28 flex flex-col items-center text-center">
{/* Welcome Status Pill */}
<div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md text-on-primary font-label-md text-label-md shadow-sm mb-space-lg">
<span className="inline-block w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
<span>Selamat Datang Kembali, <span className="font-semibold text-secondary-fixed">{user?.name?.split(' ')[0] || 'Tamu'}</span></span>
</div>
{/* Main Headline */}
<h1 className="font-display-hero text-display-hero text-on-primary max-w-3xl tracking-tight leading-[1.12]">
        Temukan kamar impian Anda dengan kenyamanan sejati
      </h1>
{/* Subtitle */}
<p className="mt-space-md text-on-primary-container max-w-2xl font-body-lg text-body-lg text-opacity-90 leading-relaxed font-normal">
        Bandingkan kamar, reservasi dalam hitungan menit, dan bayar langsung saat check-in di hotel.
      </p>
{/* Floating Integrated Search Bar Card */}
<div className="w-full mt-space-2xl max-w-5xl bg-surface-container-lowest rounded-2xl shadow-[0_20px_45px_-12px_rgba(27,28,26,0.2),0_4px_16px_-2px_rgba(27,28,26,0.06)] p-space-md lg:p-space-lg text-left">
<form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-sm items-center" onSubmit={handleSearch}>
{/* Segment 1: Check-in Date */}
<div className="lg:col-span-3 p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group cursor-pointer">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">calendar_today</span>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Check-in</span>
<input className="w-full bg-transparent font-title-md text-title-md text-on-surface font-semibold focus:outline-none cursor-pointer" min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setCheckIn(e.target.value)} required type="date" value={checkIn}/>
</div>
</div>
</div>
{/* Segment 2: Check-out Date */}
<div className="lg:col-span-3 p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group cursor-pointer">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">event_available</span>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Check-out</span>
<input className="w-full bg-transparent font-title-md text-title-md text-on-surface font-semibold focus:outline-none cursor-pointer" min={checkIn} onChange={(e) => setCheckOut(e.target.value)} required type="date" value={checkOut}/>
</div>
</div>
</div>
{/* Segment 3: Guests */}
<div className="lg:col-span-2 p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group cursor-pointer">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">group</span>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tamu</span>
<input className="w-full bg-transparent font-title-md text-title-md text-on-surface font-semibold focus:outline-none cursor-pointer" max={10} min={1} onChange={(e) => setGuests(Number(e.target.value))} required type="number" value={guests}/>
</div>
</div>
</div>
{/* CTA Button */}
<div className="lg:col-span-4 flex w-full">
<button className="w-full h-14 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-headline-sm text-title-md rounded-xl flex items-center justify-center gap-space-xs shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.98]" type="submit">
<span className="material-symbols-outlined text-[22px]">search</span>
<span>Cari Kamar</span>
</button>
</div>
</form>
</div>
</div>
</section>
{/* Quick Perks & Trust Marker Ribbon */}
<section className="w-full bg-surface-container-lowest shadow-[0_2px_12px_-4px_rgba(27,28,26,0.06)] relative z-20">
<div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-md">
<div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
<div className="flex items-center gap-space-xs">
<div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">verified</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Garansi Harga Terbaik</span>
<span className="font-label-sm text-label-sm text-outline leading-tight">Jaminan tarif terendah</span>
</div>
</div>
<div className="flex items-center gap-space-xs">
<div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">event_repeat</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Bebas Biaya Pembatalan</span>
<span className="font-label-sm text-label-sm text-outline leading-tight">Fleksibel hingga H-1</span>
</div>
</div>
<div className="flex items-center gap-space-xs">
<div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined text-[20px]">workspace_premium</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Poin Reward 2x Lipat</span>
<span className="font-label-sm text-label-sm text-outline leading-tight">Hak istimewa Gold Member</span>
</div>
</div>
<div className="flex items-center gap-space-xs">
<div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[20px]">support_agent</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Layanan Bantuan 24/7</span>
<span className="font-label-sm text-label-sm text-outline leading-tight">Respon sigap &amp; terpercaya</span>
</div>
</div>
</div>
</div>
</section>
{/* Rooms Section (Semua Kamar) */}
<section className="max-w-[1240px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop my-space-2xl">
{/* Section Heading */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-lg">
<div>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-semibold">Jelajahi Koleksi Kamar</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">Semua Kamar Kami</h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Temukan kamar yang sesuai untuk masa menginap Anda
        </p>
</div>
</div>
{roomsLoading ? (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
<article className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(27,28,26,0.08)] flex flex-col animate-pulse" key={`skeleton-${i}`}>
<div className="relative aspect-[16/10] w-full bg-surface-container-high"></div>
<div className="p-space-lg flex-1 flex flex-col justify-between space-y-space-md">
<div className="space-y-space-xs">
<div className="h-5 w-3/4 rounded-md bg-surface-container-high"></div>
<div className="h-4 w-full rounded-md bg-surface-container-high"></div>
<div className="h-4 w-2/3 rounded-md bg-surface-container-high"></div>
</div>
<div className="flex items-end justify-between">
<div className="h-6 w-28 rounded-md bg-surface-container-high"></div>
<div className="h-10 w-24 rounded-xl bg-surface-container-high"></div>
</div>
</div>
</article>
))}
</div>
) : rooms.length > 0 ? (
<>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
{(showAll ? rooms : rooms.slice(0, 6)).map((room) => (
<article className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(27,28,26,0.08)] flex flex-col group hover:-translate-y-1.5 transition-all duration-300" key={room.id}>
<div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-high">
<img alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" src={resolveImageUrl((room.photos?.find((p) => p.is_primary) || room.photos?.[0])?.url) || '/img/placeholder.svg'}/>
<div className="absolute top-space-sm left-space-sm flex flex-wrap gap-1.5">
<span className="px-space-xs py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-medium shadow-sm">
            {room.room_type?.name || 'Kamar'}
          </span>
<span className="px-space-xs py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-secondary font-label-sm text-label-sm font-semibold shadow-sm">
            {room.capacity || 2} Tamu
          </span>
<span className={`px-space-xs py-1 rounded-full font-label-sm text-label-sm font-semibold shadow-sm ${room.status === 'available' ? 'bg-green-600 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {room.status === 'available' ? 'Tersedia' : room.status === 'maintenance' ? 'Pemeliharaan' : 'Tidak Tersedia'}
          </span>
</div>
</div>
<div className="p-space-lg flex-1 flex flex-col justify-between space-y-space-md">
<div className="space-y-space-xs">
<h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
            {room.name}
          </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
            {room.description || 'Kamar dengan fasilitas lengkap untuk kenyamanan menginap Anda.'}
          </p>
</div>
<div className="pt-space-sm bg-gradient-to-t from-surface-container-lowest to-transparent flex items-end justify-between">
<div>
<div className="flex items-baseline gap-1">
<span className="font-headline-md text-headline-md text-on-surface text-primary">{rupiah(room.price_per_night)}</span>
<span className="font-body-sm text-body-sm text-outline">/malam</span>
</div>
</div>
<button className="px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md font-semibold transition-all flex items-center gap-1" type="button" onClick={() => navigate(`/rooms/${room.id}`, { state: { room, checkIn, checkOut, guests } })}>
<span>Lihat Detail</span>
<span className="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</div>
</div>
</article>
))}
</div>
{rooms.length > 6 && (
<div className="flex justify-center mt-space-lg">
<button className="px-space-lg py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all inline-flex items-center gap-2 shadow-sm" type="button" onClick={() => setShowAll((v) => !v)}>
<span className="material-symbols-outlined text-[18px]">{showAll ? 'expand_less' : 'expand_more'}</span>
<span>{showAll ? 'Tampilkan Lebih Sedikit' : `Lihat Semua Kamar (${rooms.length - 6} lagi)`}</span>
</button>
</div>
)}
</>
) : null}
</section>

</div></main><footer className="w-full bg-surface-container-low"><div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl"><div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl"><div className="space-y-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Platform reservasi hotel dan penginapan terpercaya dengan jaminan kenyamanan dan penawaran terbaik di seluruh Indonesia.</p></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Navigasi</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="beranda" href="#">Beranda</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="booking-saya" href="#">Booking Saya</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Pusat Bantuan</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Akun &amp; Keanggotaan</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="profil-akun" href="#">Profil Akun</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pengaturan" href="#">Pengaturan</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Kebijakan Privasi</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Hubungi Kami</h4><p className="font-body-sm text-body-sm text-on-surface-variant">Email: support@stayeasy.id</p><p className="font-body-sm text-body-sm text-on-surface-variant">WhatsApp: +62 812-3456-7890</p><p className="font-body-sm text-body-sm text-on-surface-variant">Senin - Minggu: 24 Jam Nonstop</p></div></div><div className="mt-space-xl pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm"><p>© 2025 StayEasy Indonesia. Seluruh hak cipta dilindungi.</p><p className="font-label-sm text-label-sm text-tertiary">Warm Modern Hospitality</p></div></div></footer>
    </>
  );
}
