import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import * as roomService from '../services/roomService';
import { resolveImageUrl } from '../lib/apiClient';

// 1:1 port of hasil_pencarian_kamar_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function HasilPencarian() {
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Parameter pencarian dari query string URL (dikirim dari Beranda)
  const checkIn = searchParams.get('check_in') || format(new Date(), 'yyyy-MM-dd');
  const checkOut = searchParams.get('check_out') || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
  const guests = Number(searchParams.get('guests') || 2);
  const page = Number(searchParams.get('page') || '1');

  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [roomTypes, setRoomTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [typeFilter, setTypeFilter] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const [facilityFilter, setFacilityFilter] = useState([]);
  const [sort, setSort] = useState('');

  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));

  useEffect(() => {
    roomService.getRoomTypes().then(setRoomTypes).catch(() => {});
    roomService.getFacilities().then(setFacilities).catch(() => {});
  }, []);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await roomService.searchRooms({
        check_in: checkIn,
        check_out: checkOut,
        guests,
        room_type_id: typeFilter,
        max_price: priceMax,
        facilities: facilityFilter,
        sort,
        page,
        limit: 10,
      });
      setRooms(result.rooms);
      setTotal(result.total);
      setLimit(result.limit);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar kamar.');
    } finally {
      setIsLoading(false);
    }
  }, [checkIn, checkOut, guests, typeFilter, priceMax, facilityFilter, sort, page]);

  const resetFilters = () => {
    setTypeFilter(null);
    setPriceMax(null);
    setFacilityFilter([]);
    setSort('');
  };

  const toggleFacility = (id) => {
    setFacilityFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  useEffect(() => {
    const t = setTimeout(() => fetchRooms(), 250);
    return () => clearTimeout(t);
  }, [fetchRooms]);

  const changePage = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <>
<header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-lg"><div className="flex items-center gap-space-xl"><a className="flex items-center gap-space-xs" data-path="beranda" href="#"><svg className="h-8 w-8 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect fill="#FD7549" height="10" rx="2" width="10" x="8" y="18"/><circle cx="34" cy="18" fill="#FFFFFF" r="4.5"/><path d="M8 32C14 32 18 24 24 24C30 24 34 30 40 26" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5"/></svg><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></a><nav className="hidden md:flex items-center gap-space-lg h-20" data-active-classes="text-primary-container font-title-md text-title-md border-b-2 border-primary-container"><a aria-current="page" className="h-full flex items-center transition-colors text-primary-container font-title-md text-title-md border-b-2 border-primary-container" data-path="beranda" href="#">Beranda</a><a className="h-full flex items-center text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors" data-path="booking-saya" href="#">Booking Saya</a></nav></div><div className="flex items-center gap-space-md"><div ref={menuRef} className="relative group"><button aria-haspopup="menu" aria-expanded={menuOpen} className="flex items-center gap-space-sm pl-space-xs pr-space-sm py-space-xs rounded-full hover:bg-surface-container-low transition-colors" type="button" onClick={() => setMenuOpen(!menuOpen)}><div className="w-8 h-8 rounded-full bg-surface-container-low ring-1 ring-outline-variant flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-base text-on-surface-variant">person</span></div><div className="text-left hidden sm:flex flex-col"><span className="font-label-md text-label-md text-on-surface leading-tight">{user?.name || 'Masuk / Daftar'}</span></div><span className="material-symbols-outlined text-on-surface-variant text-base">{menuOpen ? 'expand_less' : 'expand_more'}</span></button><div className={`absolute right-0 top-full pt-space-2xs w-56 bg-surface-container-lowest rounded-xl shadow-[0_16px_36px_-6px_rgba(44,44,42,0.12),0_6px_16px_-4px_rgba(44,44,42,0.06)] py-space-xs transition-all duration-150 z-50 ${menuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}><div className="px-space-md py-space-xs sm:hidden border-b border-surface-variant mb-space-2xs"><p className="font-label-md text-label-md text-on-surface">{user?.name || 'Masuk / Daftar'}</p></div>{isAuthenticated ? (
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
{/* Search Summary Island & Filter Status Bar */}
<section className="w-full bg-surface-bright py-space-md shadow-sm">
<div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex flex-col gap-space-md">
{/* Interactive Criteria Bar */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_-2px_rgba(44,44,42,0.05),0_1px_3px_0_rgba(44,44,42,0.03)] p-space-sm sm:p-space-md flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex flex-wrap items-center gap-space-xs sm:gap-space-sm">
{/* Badge 1: Location */}
<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-base">location_on</span>
<span>Bandung &amp; Sekitarnya</span>
</div>
{/* Badge 2: Check-in */}
<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-base">calendar_today</span>
<span>Check-in: {format(new Date(checkIn), 'dd MMM yyyy')}</span>
</div>
{/* Badge 3: Check-out */}
<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-base">event</span>
<span>Check-out: {format(new Date(checkOut), 'dd MMM yyyy')} <span className="text-xs opacity-75">({nights} Malam)</span></span>
</div>
{/* Badge 4: Guests & Rooms */}
<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-base">group</span>
<span>2 Tamu, 1 Kamar</span>
</div>
</div>
{/* Modify Search Trigger */}
<button className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-low text-primary-container font-label-md text-label-md hover:bg-primary-fixed transition-colors" id="btn-edit-search" type="button" onClick={() => navigate('/')}>
<span className="material-symbols-outlined text-base">tune</span>
<span>Ubah Pencarian</span>
</button>
</div>
{/* Live Results Metadata & Sorter */}
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
<p className="font-body-md text-body-md text-on-surface font-medium">Menampilkan <span className="text-primary font-bold" id="results-count">{total}</span> kamar tersedia sesuai kriteria Anda</p>
</div>
<div className="flex items-center gap-space-xs self-end sm:self-auto">
<label className="text-on-surface-variant font-label-sm text-label-sm" htmlFor="sort-select">Urutkan:</label>
<div className="relative">
<select className="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-3 pr-8 py-1.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20" id="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
<option value="">Rekomendasi Terbaik</option>
<option value="price_low">Harga Terendah</option>
<option value="price_high">Harga Tertinggi</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-lg">arrow_drop_down</span>
</div>
</div>
</div>
</div>
</section>
{/* Main Content Layout (Desktop Two Columns) */}
<div className="max-w-[1240px] w-full mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl">
<div className="flex flex-col lg:flex-row items-start gap-space-xl">
{/* LEFT SIDEBAR: Filters (25% Width / ~300px) */}
<aside className="w-full lg:w-[300px] flex-shrink-0">
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_2px_8px_-2px_rgba(44,44,42,0.05),0_1px_3px_0_rgba(44,44,42,0.03)] flex flex-col gap-space-lg">
{/* Filter Header */}
<div className="flex items-center justify-between">
<h3 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-xl">filter_list</span>
              Filter Pencarian
            </h3>
<button className="text-outline hover:text-primary transition-colors font-label-sm text-label-sm hover:underline" id="reset-all-filters" type="button" onClick={resetFilters}>
              Reset Filter
            </button>
</div>
<div className="h-[1px] w-full bg-surface-variant"></div>
{/* Filter 1: Tipe Kamar */}
<div className="space-y-space-sm">
<h4 className="font-label-md text-label-md text-on-surface font-semibold">Tipe Kamar</h4>
<div className="space-y-2.5">
{roomTypes.length === 0 && (
<p className="font-body-sm text-body-sm text-outline">Memuat tipe kamar...</p>
)}
{roomTypes.map((rt) => {
const checked = typeFilter === rt.id;
return (
<label key={rt.id} className="flex items-center justify-between cursor-pointer group select-none">
<div className="flex items-center gap-2.5">
<input className="w-5 h-5 rounded text-primary-container focus:ring-primary/30 accent-primary" type="checkbox" checked={checked} onChange={() => setTypeFilter(checked ? null : rt.id)}/>
<span className={`font-body-md text-body-md transition-colors ${checked ? 'text-on-surface font-medium' : 'text-on-surface-variant group-hover:text-on-surface'}`}>{rt.name}</span>
</div>
</label>
);
})}
</div>
</div>
<div className="h-[1px] w-full bg-surface-variant"></div>
{/* Filter 2: Rentang Harga Slider */}
<div className="space-y-space-sm">
<div className="flex items-center justify-between">
<h4 className="font-label-md text-label-md text-on-surface font-semibold">Rentang Harga</h4>
<span className="font-label-sm text-label-sm text-outline">/malam</span>
</div>
<div className="py-2">
<input className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary" id="price-range-slider" max="3000000" min="450000" step="50000" type="range" value={priceMax ?? 3000000} onChange={(e) => setPriceMax(Number(e.target.value))}/>
</div>
<div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
<div className="flex flex-col">
<span className="text-[10px] uppercase text-outline font-semibold">Min</span>
<span className="font-label-md text-label-md text-on-surface font-medium">Rp 450.000</span>
</div>
<span className="text-outline text-xs">—</span>
<div className="flex flex-col text-right">
<span className="text-[10px] uppercase text-outline font-semibold">Maks</span>
<span className="font-label-md text-label-md text-primary font-semibold" id="price-max-display">Rp {Number(priceMax ?? 3000000).toLocaleString('id-ID')}</span>
</div>
</div>
</div>
<div className="h-[1px] w-full bg-surface-variant"></div>
{/* Filter 3: Fasilitas Kamar */}
<div className="space-y-space-sm">
<h4 className="font-label-md text-label-md text-on-surface font-semibold">Fasilitas Kamar</h4>
<div className="space-y-2.5">
{facilities.length === 0 && (
<p className="font-body-sm text-body-sm text-outline">Memuat fasilitas...</p>
)}
{facilities.map((f) => {
const checked = facilityFilter.includes(f.id);
return (
<label key={f.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
<input className="w-5 h-5 rounded text-primary-container focus:ring-primary/30 accent-primary" type="checkbox" checked={checked} onChange={() => toggleFacility(f.id)}/>
<span className={`font-body-md text-body-md transition-colors ${checked ? 'text-on-surface font-medium' : 'text-on-surface-variant group-hover:text-on-surface'}`}>{f.name}</span>
</label>
);
})}
</div>
</div>
<div className="h-[1px] w-full bg-surface-variant"></div>
</div>
</aside>
{/* RIGHT COLUMN: Available Room Listings (75% Width) */}
<main className="w-full flex-1 flex flex-col gap-space-lg">
{/* Active Room Cards Container */}
<div className="flex flex-col gap-space-lg" id="room-list-container">
{isLoading && (
  // Skeleton cards saat loading
  <React.Fragment>
    {[1, 2, 3].map((n) => (
      <div key={n} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(44,44,42,0.05)] flex flex-col md:flex-row animate-pulse">
        <div className="w-full md:w-[340px] h-64 bg-surface-container-high flex-shrink-0"></div>
        <div className="p-space-lg flex-1 space-y-space-sm">
          <div className="h-3 w-1/3 bg-surface-container-high rounded"></div>
          <div className="h-5 w-2/3 bg-surface-container-high rounded"></div>
          <div className="h-3 w-full bg-surface-container-high rounded"></div>
          <div className="h-3 w-5/6 bg-surface-container-high rounded"></div>
          <div className="h-8 w-40 bg-surface-container-high rounded mt-space-md"></div>
        </div>
      </div>
    ))}
  </React.Fragment>
)}

{error && !isLoading && (
  <div className="bg-surface-container-lowest rounded-xl p-space-2xl text-center flex flex-col items-center justify-center gap-space-md shadow-[0_2px_8px_-2px_rgba(44,44,42,0.05)]">
    <span className="material-symbols-outlined text-5xl text-error">wifi_off</span>
    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Gagal memuat daftar kamar</h3>
    <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
    <button className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary font-title-md text-label-md font-medium transition-all" onClick={fetchRooms} type="button">
      Coba Lagi
    </button>
  </div>
)}

{!isLoading && !error && rooms.length === 0 && (
  <div className="bg-surface-container-lowest rounded-xl p-space-2xl text-center flex flex-col items-center justify-center gap-space-md shadow-[0_2px_8px_-2px_rgba(44,44,42,0.05)]">
    <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-space-xs">
      <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 48 48">
        <rect height="32" rx="4" width="36" x="6" y="8"></rect>
        <path d="M16 4v8"></path>
        <path d="M32 4v8"></path>
        <path d="M6 18h36"></path>
        <circle cx="24" cy="30" r="5"></circle>
        <path d="M28 34l5 5"></path>
      </svg>
    </div>
    <div className="max-w-md space-y-2">
      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Tidak ada kamar tersedia untuk tanggal ini</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant">Coba ubah tanggal check-in, kurangi filter pencarian, atau jelajahi tanggal di pekan berikutnya untuk melihat ketersediaan kamar.</p>
    </div>
    <button className="px-5 py-2.5 rounded-xl bg-surface-container-lowest border border-primary text-primary hover:bg-primary hover:text-on-primary font-title-md text-label-md transition-all font-medium" onClick={() => navigate('/')} type="button">
      Ubah Pencarian
    </button>
  </div>
)}
{!isLoading && !error && rooms.map((room) => {
  const primaryPhoto = room.photos?.find((p) => p.is_primary) || room.photos?.[0];
  const photoUrl = resolveImageUrl(primaryPhoto?.url) || '/img/placeholder.svg';
  return (
    <article key={room.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(44,44,42,0.05),0_1px_3px_0_rgba(44,44,42,0.03)] hover:shadow-[0_8px_24px_-4px_rgba(44,44,42,0.08),0_4px_12px_-2px_rgba(44,44,42,0.04)] transition-all duration-200 flex flex-col md:flex-row">
      <div className="relative w-full md:w-[320px] lg:w-[340px] h-64 md:h-auto flex-shrink-0 overflow-hidden bg-surface-variant">
        <img alt={room.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" src={photoUrl}/>
        {room.status === 'available' && (
          <span className="absolute top-3 left-3 bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-sm text-label-sm tracking-wider uppercase shadow-sm">Tersedia</span>
        )}
      </div>
      <div className="p-space-md sm:p-space-lg flex-1 flex flex-col justify-between gap-space-md">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <span>{room.room_type?.name || 'Kamar'}</span>
            <span>•</span>
            <span>Kapasitas {room.capacity} orang</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold hover:text-primary transition-colors cursor-pointer">{room.name}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{room.description}</p>
          {room.facilities && room.facilities.length > 0 && (
            <div className="flex flex-wrap gap-space-xs pt-1">
              {room.facilities.slice(0, 4).map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-sm">{f.icon || 'check'}</span>
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center sm:items-end justify-between sm:justify-end gap-space-md">
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-1">
              <span className="font-price-display text-price-display text-primary-container font-bold">Rp {Number(room.price_per_night).toLocaleString('id-ID')}</span>
              <span className="font-body-sm text-xs text-on-surface-variant">/malam</span>
            </div>
            <span className="text-[11px] text-outline block">Harga terbaik terverifikasi</span>
          </div>
          <button className="px-5 py-3 rounded-xl bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-title-md text-title-md font-semibold transition-all shadow-sm hover:shadow flex items-center gap-1" onClick={() => navigate(`/rooms/${room.id}`, { state: { room, checkIn, checkOut, guests } })} type="button">
            <span>Lihat Detail</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </article>
  );
})}
</div>
{/* Pagination */}
{!isLoading && !error && total > limit && (
  <div className="flex items-center justify-center gap-space-sm pt-space-sm">
    <button className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" disabled={page <= 1} onClick={() => changePage(page - 1)} type="button">
      <span className="material-symbols-outlined">chevron_left</span>
    </button>
    <span className="font-label-md text-label-md text-on-surface-variant px-space-sm">
      Halaman {page} dari {Math.ceil(total / limit)}
    </span>
    <button className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" disabled={page >= Math.ceil(total / limit)} onClick={() => changePage(page + 1)} type="button">
      <span className="material-symbols-outlined">chevron_right</span>
    </button>
  </div>
)}
{/* Trust & Hospitality Guarantee Footer Card */}
<div className="w-full bg-surface-container-low rounded-xl p-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shadow-sm flex-shrink-0">
<span className="material-symbols-outlined text-2xl">shield</span>
</div>
<div>
<h4 className="font-title-md text-title-md text-on-surface font-semibold">Jaminan Harga Terbaik &amp; Kenyamanan Tamu</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">Tidak ada biaya tersembunyi. Pelayanan resepsionis ramah siap menyambut kedatangan Anda 24 jam nonstop.</p>
</div>
</div>
<div className="flex items-center gap-2 flex-shrink-0">
<span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider">StayEasy Verified</span>
<span className="material-symbols-outlined text-primary text-lg">check_circle</span>
</div>
</div>
</main>
</div>
</div>
</div>
</main><footer className="w-full bg-surface-container-low"><div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl"><div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl"><div className="space-y-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary tracking-tight">StayEasy</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Platform reservasi hotel dan penginapan terpercaya dengan jaminan kenyamanan dan penawaran terbaik di seluruh Indonesia.</p></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Navigasi</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="beranda" href="#">Beranda</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="booking-saya" href="#">Booking Saya</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Pusat Bantuan</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Akun &amp; Keanggotaan</h4><ul className="space-y-space-2xs"><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="profil-akun" href="#">Profil Akun</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pengaturan" href="#">Pengaturan</a></li><li className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"><a data-path="pusat-bantuan" href="#">Kebijakan Privasi</a></li></ul></div><div className="space-y-space-xs"><h4 className="font-title-md text-title-md text-on-surface">Hubungi Kami</h4><p className="font-body-sm text-body-sm text-on-surface-variant">Email: support@stayeasy.id</p><p className="font-body-sm text-body-sm text-on-surface-variant">WhatsApp: +62 812-3456-7890</p><p className="font-body-sm text-body-sm text-on-surface-variant">Senin - Minggu: 24 Jam Nonstop</p></div></div><div className="mt-space-xl pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm"><p>© 2025 StayEasy Indonesia. Seluruh hak cipta dilindungi.</p><p className="font-label-sm text-label-sm text-tertiary">Warm Modern Hospitality</p></div></div></footer>
    </>
  );
}
