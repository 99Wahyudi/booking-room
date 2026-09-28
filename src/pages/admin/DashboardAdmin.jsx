import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as adminDashboardService from '../../services/adminDashboardService';
import * as adminRoomService from '../../services/adminRoomService';
import {
  fetchAllBookings,
  calcOccupancyByDate,
  calcDayStats,
  calcSellableRooms,
  toYMD,
  MONTHS_ID,
} from '../../lib/adminData';

// 1:1 port of dashboard_admin_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const today = useMemo(() => new Date(), []);
  const todayYMD = toYMD(today);
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [occ, setOcc] = useState(null);
  const [occLoading, setOccLoading] = useState(true);
  const [occError, setOccError] = useState(null);

  const miniGrid = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) {
      const d = new Date(calMonth.year, calMonth.month, 1 - offset + i);
      cells.push({ key: toYMD(d), label: d.getDate(), out: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ key: toYMD(new Date(calMonth.year, calMonth.month, day)), label: day, out: false });
    }
    let next = 1;
    while (cells.length % 7 !== 0) {
      const d = new Date(calMonth.year, calMonth.month + 1, next++);
      cells.push({ key: toYMD(d), label: d.getDate(), out: true });
    }
    return cells;
  }, [calMonth]);

  const calDayStats = useCallback(
    (ymd) => (occ ? calcDayStats(occ.byDate, ymd, occ.sellableRooms) : { occupied: 0, pct: 0, list: [], pending: 0 }),
    [occ]
  );

  const avgOccupancy = useMemo(() => {
    if (!occ) return 0;
    const inMonth = miniGrid.filter((c) => !c.out);
    let total = 0;
    for (const c of inMonth) total += calDayStats(c.key).pct;
    return inMonth.length ? Math.round((total / inMonth.length) * 10) / 10 : 0;
  }, [occ, miniGrid, calDayStats]);

  const heatClass = (stats, out) => {
    if (out) return 'bg-surface-container-low/40 text-outline/30 select-none';
    if (stats.occupied === 0) return 'bg-surface-container-low text-on-surface-variant border border-outline-variant/40';
    if (stats.pct < 40) return 'bg-[#E1F5EE] text-[#005440] border border-[#d1e6e1]/60';
    if (stats.pct <= 75) return 'bg-[#2E856E] text-white';
    return 'bg-[#0F6E56] text-white';
  };

  const changeCalMonth = (delta) =>
    setCalMonth((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const formatSync = (ts) => {
    if (!ts) return 'menunggu sinkronisasi';
    const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    return mins < 1 ? 'baru saja' : `${mins} menit yang lalu`;
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminDashboardService.getStats(),
      adminDashboardService.getRecentBookings(10),
      fetchAllBookings(),
      adminRoomService.getRooms({ page: 1, limit: 100 }),
    ])
      .then(([statsData, recentData, bookingList, roomResult]) => {
        if (cancelled) return;
        setStats(statsData);
        setRecentBookings(Array.isArray(recentData) ? recentData : recentData?.bookings || []);
        setTotalRooms(roomResult.rooms?.length || 0);
        setBookingCount(bookingList.length);
        setLastSync(Date.now());
        setOcc({
          byDate: calcOccupancyByDate(bookingList),
          sellableRooms: calcSellableRooms(roomResult.rooms || []),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setStatsError(err.message || 'Gagal memuat data dashboard.');
          setOccError(err.message || 'Gagal memuat data okupansi.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false);
          setOccLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
{/* 1. Header Section */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-outline-variant/30">
<div>
<h1 className="text-3xl sm:text-4xl font-extrabold font-headline-lg text-on-surface tracking-[-0.025em]">Dashboard</h1>
<p className="text-sm sm:text-base text-on-surface-variant mt-1 font-normal">Ringkasan metrik operasional properti dan reservasi kamar StayEasy hari ini.</p>
</div>
<div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
{/* Date Selector / Period Filter */}
<button
className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm hover:border-outline text-on-surface text-sm font-semibold transition-colors cursor-pointer"
onClick={() => navigate(`/admin/calendar?month=${todayYMD.slice(0, 7)}`)}
title="Buka kalender okupansi penuh"
type="button"
>
<span className="material-symbols-outlined text-primary text-[20px]" data-icon="calendar_today">calendar_today</span>
<span>{MONTHS_ID[today.getMonth()].slice(0, 3)} {today.getFullYear()}</span>
<span className="material-symbols-outlined text-outline text-[18px]" data-icon="expand_more">expand_more</span>
</button>
{/* Quick Action CTA (tambah booking manual belum didukung backend — disembunyikan) */}
</div>
</div>
{/* 2. Four Stat Metric Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
{/* Card 1: Total Kamar */}
<div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group">
<div className="flex items-start justify-between">
<span className="text-sm font-medium text-on-surface-variant">Total Kamar</span>
<div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center group-hover:bg-primary-fixed/30 transition-colors">
<span className="material-symbols-outlined text-[22px]" data-icon="meeting_room">meeting_room</span>
</div>
</div>
<div className="mt-4">
<div className="text-3xl sm:text-4xl font-bold font-headline-lg text-primary-container tracking-tight">{stats?.total_rooms ?? '—'}</div>
<div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container text-on-surface-variant">
<span className="material-symbols-outlined text-[14px]" data-icon="apartment">apartment</span>
<span>Dari {totalRooms || '—'} kamar terdaftar</span>
</div>
</div>
</div>
{/* Card 2: Kamar Tersedia Hari Ini */}
<div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group">
<div className="flex items-start justify-between">
<span className="text-sm font-medium text-on-surface-variant">Kamar Tersedia Hari Ini</span>
<div className="w-10 h-10 rounded-lg bg-surface-container-low text-[#0f6e56] flex items-center justify-center group-hover:bg-primary-fixed/30 transition-colors">
<span className="material-symbols-outlined text-[22px]" data-icon="key">key</span>
</div>
</div>
<div className="mt-4">
<div className="text-3xl sm:text-4xl font-bold font-headline-lg text-primary-container tracking-tight">{stats?.available_today ?? '—'}</div>
<div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#DCFCE7] text-[#15803D]">
<span className="material-symbols-outlined text-[14px]" data-icon="check_circle">check_circle</span>
<span>{totalRooms ? `Tingkat ketersediaan ${Math.round(((stats?.available_today || 0) / totalRooms) * 1000) / 10}%` : 'Tingkat ketersediaan —'}</span>
</div>
</div>
</div>
{/* Card 3: Booking Menunggu Konfirmasi */}
<div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all group">
<div className="flex items-start justify-between">
<span className="text-sm font-medium text-on-surface-variant">Booking Menunggu Konfirmasi</span>
<div className="w-10 h-10 rounded-lg bg-amber-50 text-[#B45309] flex items-center justify-center group-hover:bg-[#FEF3C7] transition-colors">
<span className="material-symbols-outlined text-[22px]" data-icon="schedule">schedule</span>
</div>
</div>
<div className="mt-4">
<div className="text-3xl sm:text-4xl font-bold font-headline-lg text-primary-container tracking-tight">{stats?.pending_bookings ?? '—'}</div>
<div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FEF3C7] text-[#B45309]">
<span className="material-symbols-outlined text-[14px]" data-icon="priority_high">priority_high</span>
<span>Butuh tindakan segera</span>
</div>
</div>
</div>
{/* Card 4: Booking Bulan Ini */}
<div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group">
<div className="flex items-start justify-between">
<span className="text-sm font-medium text-on-surface-variant">Booking Bulan Ini</span>
<div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center group-hover:bg-primary-fixed/30 transition-colors">
<span className="material-symbols-outlined text-[22px]" data-icon="trending_up">trending_up</span>
</div>
</div>
<div className="mt-4">
<div className="text-3xl sm:text-4xl font-bold font-headline-lg text-primary-container tracking-tight">{stats?.bookings_this_month ?? '—'}</div>
<div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
<span className="material-symbols-outlined text-[14px]" data-icon="arrow_upward">arrow_upward</span>
<span>Data bulan berjalan</span>
</div>
</div>
</div>
</div>
{/* 3. Main Content Split Section */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
{/* Left Section (~65% / 8 cols): Booking Terbaru */}
<section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm overflow-hidden">
{/* Table Header & Controls */}
<div className="p-5 sm:p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
<div>
<div className="flex items-center gap-2">
<h2 className="text-xl font-bold font-headline-sm text-on-surface">Booking Terbaru</h2>
<span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed/40 text-on-primary-fixed-variant">Terbaru</span>
</div>
<p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">{recentBookings.length} pemesanan terakhir yang masuk ke sistem reservasi StayEasy</p>
</div>
<a className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-container transition-colors group self-start sm:self-auto" href="/admin/bookings">
<span>Lihat Semua</span>
<span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
</a>
</div>
{/* Data Table Container (Responsive Scroll) */}
<div className="overflow-x-auto">
<table className="w-full text-left text-sm whitespace-nowrap">
<thead className="bg-surface-container-low/70 text-on-surface-variant font-label-md text-xs uppercase tracking-wider border-b border-outline-variant/30">
<tr>
<th className="py-3 px-5 font-semibold" scope="col">Nama Tamu</th>
<th className="py-3 px-4 font-semibold" scope="col">Kamar & Tipe</th>
<th className="py-3 px-4 font-semibold" scope="col">Check-in / Out</th>
<th className="py-3 px-4 font-semibold text-right" scope="col">Total Biaya</th>
<th className="py-3 px-4 font-semibold text-center" scope="col">Status</th>
<th className="py-3 px-5 font-semibold text-right" scope="col">Aksi</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/20 font-body-sm">
{statsLoading && (
<tr>
<td className="py-8 text-center text-on-surface-variant" colSpan="6">Memuat booking terbaru...</td>
</tr>
)}
{!statsLoading && recentBookings.length === 0 && (
<tr>
<td className="py-8 text-center text-on-surface-variant" colSpan="6">Belum ada booking.</td>
</tr>
)}
{!statsLoading && recentBookings.map((b) => {
  const statusStyles = {
    pending: ['bg-[#FEF3C7] text-[#B45309]', 'bg-[#B45309]', 'Menunggu Konfirmasi'],
    confirmed: ['bg-[#DCFCE7] text-[#15803D]', 'bg-[#15803D]', 'Terkonfirmasi'],
    completed: ['bg-[#F3F4F6] text-[#4B5563]', 'bg-[#6B7280]', 'Selesai'],
    cancelled: ['bg-[#FEE2E2] text-[#B91C1C]', 'bg-[#B91C1C]', 'Dibatalkan'],
    rejected: ['bg-[#FEE2E2] text-[#B91C1C]', 'bg-[#B91C1C]', 'Ditolak'],
  };
  const [badgeClass, dotClass, statusLabel] = statusStyles[b.status] || statusStyles.pending;
  const guestName = b.user?.name || 'Tamu';
  const initials = guestName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
  <tr className="hover:bg-surface-container-lowest/50 transition-colors" key={b.id}>
<td className="py-4 px-5">
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-xs">
                      {initials}
                    </div>
<div>
<div className="font-bold text-on-surface text-sm">{guestName}</div>
<div className="text-xs text-outline">{b.user?.email || '-'}</div>
</div>
</div>
</td>
<td className="py-4 px-4">
<div className="font-medium text-on-surface text-sm">{b.room?.name || '-'}</div>
<div className="text-xs text-outline flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]" data-icon="tag">tag</span> R-{b.room_id}
                  </div>
</td>
<td className="py-4 px-4">
<div className="font-medium text-on-surface">{String(b.check_in_date).slice(0, 10)} - {String(b.check_out_date).slice(0, 10)}</div>
<div className="text-xs text-outline">{b.guests} Tamu</div>
</td>
<td className="py-4 px-4 text-right">
<div className="font-bold text-on-surface text-sm font-price-display">Rp {Number(b.total_price || 0).toLocaleString('id-ID')}</div>
</td>
<td className="py-4 px-4 text-center">
<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
<span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                    {statusLabel}
                  </span>
</td>
<td className="py-4 px-5 text-right">
<button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors" onClick={() => navigate('/admin/bookings')}>
<span>Detail</span>
<span className="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
</button>
</td>
</tr>
  );
})}
</tbody>
</table>
</div>
{/* Card Footer */}
<div className="p-4 bg-surface-container-low/40 border-t border-outline-variant/30 flex items-center justify-between text-xs text-outline">
<span>Menampilkan {recentBookings.length} dari {bookingCount} booking aktif bulan ini</span>
<a className="font-semibold text-primary hover:underline" href="/admin/bookings">Kelola semua booking →</a>
</div>
</section>
{/* Right Section (~35% / 4 cols): Kalender Okupansi */}
<section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm p-5 sm:p-6 flex flex-col justify-between">
{/* Header & Month selector */}
<div>
<div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
<div>
<h2 className="text-lg font-bold font-headline-sm text-on-surface">Kalender Okupansi</h2>
<p className="text-xs text-on-surface-variant">Kepadatan reservasi harian</p>
</div>
<div className="flex items-center gap-1">
<button className="w-7 h-7 rounded-md border border-outline-variant/60 hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors" title="Bulan Sebelumnya" onClick={() => changeCalMonth(-1)} type="button">
<span className="material-symbols-outlined text-[16px]" data-icon="chevron_left">chevron_left</span>
</button>
<span className="text-xs font-bold text-on-surface px-1">{MONTHS_ID[calMonth.month].slice(0, 3)} {calMonth.year}</span>
<button className="w-7 h-7 rounded-md border border-outline-variant/60 hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors" title="Bulan Berikutnya" onClick={() => changeCalMonth(1)} type="button">
<span className="material-symbols-outlined text-[16px]" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
{/* Heatmap Legend Indicator */}
<div className="py-3 flex items-center justify-between gap-1 text-[11px] text-on-surface-variant">
<div className="flex items-center gap-1.5">
<span className="w-3 h-3 rounded-sm bg-[#E1F5EE] border border-[#d1e6e1]"></span>
<span>{'<'}40% Rendah</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-3 h-3 rounded-sm bg-[#2E856E]"></span>
<span>40-75% Sedang</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-3 h-3 rounded-sm bg-[#0F6E56]"></span>
<span>{'>'}75% Tinggi</span>
</div>
</div>
{/* Day of week labels (Senin - Minggu) */}
<div className="grid grid-cols-7 gap-1 text-center font-label-md text-[11px] font-semibold text-outline mb-1.5">
<div>Sen</div>
<div>Sel</div>
<div>Rab</div>
<div>Kam</div>
<div>Jum</div>
<div>Sab</div>
<div>Min</div>
</div>
{/* Dynamic occupancy grid */}
<div className="grid grid-cols-7 gap-1.5">
{occLoading &&
Array.from({ length: 35 }).map((_, i) => (
<div className="aspect-square rounded-lg bg-surface-container-highest animate-pulse" key={`occ-sk-${i}`}></div>
))}
{occError && !occLoading && (
<button
className="col-span-7 py-5 text-xs text-error flex items-center justify-center gap-1.5"
onClick={() => {
setOccLoading(true);
setOccError(null);
Promise.all([fetchAllBookings(), adminRoomService.getRooms({ page: 1, limit: 100 })])
.then(([bookingList, roomResult]) =>
setOcc({
byDate: calcOccupancyByDate(bookingList),
sellableRooms: calcSellableRooms(roomResult.rooms || []),
})
)
.catch((err) => setOccError(err.message || 'Gagal memuat data okupansi.'))
.finally(() => setOccLoading(false));
}}
type="button"
>
<span className="material-symbols-outlined text-[14px]" data-icon="refresh">refresh</span>
Gagal memuat okupansi — Coba lagi
</button>
)}
{!occLoading && !occError &&
miniGrid.map((cell) => {
const stats = cell.out ? { occupied: 0, pct: 0 } : calDayStats(cell.key);
const isToday = cell.key === todayYMD;
return (
<button
className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-transform ${heatClass(stats, cell.out)} ${
cell.out ? 'cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-sm'
} ${isToday ? 'relative shadow-md' : ''}`}
disabled={cell.out}
key={cell.key}
onClick={() => !cell.out && navigate(`/admin/calendar?month=${cell.key.slice(0, 7)}`)}
title={
cell.out
? undefined
: `${Number(cell.key.slice(8))} ${MONTHS_ID[calMonth.month].slice(0, 3)}: ${stats.occupied}/${occ?.sellableRooms ?? 0} unit terisi (${stats.pct}%)`
}
type="button"
>
<span className={`leading-none ${isToday ? 'font-bold' : stats.pct > 0 ? 'font-semibold' : ''}`}>{cell.label}</span>
{!cell.out && stats.occupied > 0 && (
<span className="mt-0.5 text-[8px] leading-none opacity-90">
{stats.occupied}/{occ?.sellableRooms ?? 0}
</span>
)}
{isToday && <span className="w-1 h-1 bg-[#d85a30] rounded-full absolute bottom-1"></span>}
</button>
);
})}
</div>
</div>
{/* Bottom Summary Card */}
<div className="mt-6 pt-4 border-t border-outline-variant/30 bg-surface-container-low/60 p-4 rounded-xl">
<div className="flex items-center justify-between text-xs mb-1.5">
<span className="font-semibold text-on-surface">Okupansi Rata-rata Bulan Ini</span>
<span className="font-bold text-primary font-headline-sm text-sm">
{occLoading ? '…' : `${avgOccupancy}%`}
</span>
</div>
{/* Mini Progress Bar */}
<div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
{!occLoading && (
<div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{ width: `${Math.min(100, avgOccupancy)}%` }}></div>
)}
</div>
<div className="mt-2.5 flex items-center justify-between text-[11px] text-outline">
<span className="flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-[#d85a30]"></span> Target bulanan: 70.0%
</span>
{!occLoading && (
<span className={`font-medium ${avgOccupancy >= 70 ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
{avgOccupancy >= 70
? `+${(avgOccupancy - 70).toFixed(1)}% melampaui`
: `${(70 - avgOccupancy).toFixed(1)}% di bawah`}
</span>
)}
</div>
</div>
</section>
</div>
{/* Quick Footer Status Info */}
<footer className="mt-10 pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-outline">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse"></span>
<span>Sistem Reservasi StayEasy Online • Sinkronisasi Otomatis Terakhir: {formatSync(lastSync)}</span>
</div>
<div>
<span>StayEasy Boutique Resort & Hospitality © 2026. Seluruh hak cipta dilindungi.</span>
</div>
</footer>
</main>
  );
}
