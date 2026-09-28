import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as adminRoomService from '../../services/adminRoomService';
import Icon from '../../components/ui/Icon';
import {
  fetchAllBookings,
  calcOccupancyByDate,
  calcDayStats,
  calcSellableRooms,
  toYMD,
  parseYMD,
  shiftMonth,
  MONTHS_ID,
  WEEKDAYS_ID,
} from '../../lib/adminData';

const STATUS_STYLES = {
  pending: ['bg-amber-50 text-amber-800 border-amber-200', 'schedule', 'Menunggu'],
  confirmed: ['bg-primary-fixed text-on-primary-fixed border-primary-fixed', 'check_circle', 'Terkonfirmasi'],
  completed: ['bg-surface-container-high text-on-surface-variant border-outline-variant', 'task_alt', 'Selesai'],
  cancelled: ['bg-error/10 text-error border-error/20', 'cancel', 'Dibatalkan'],
  rejected: ['bg-error/10 text-error border-error/20', 'block', 'Ditolak'],
};

export default function KalenderOkupansi() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = useMemo(() => new Date(), []);
  const todayYMD = toYMD(today);

  // Dukungan ?month=YYYY-MM (mis. dari klik sel di dashboard)
  const queryCursor = useMemo(() => {
    const p = new URLSearchParams(location.search).get('month') || '';
    const m = p.match(/^(\d{4})-(\d{1,2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month < 0 || month > 11) return null;
    return { year, month };
  }, [location.search]);

  const [cursor, setCursor] = useState(
    queryCursor || { year: today.getFullYear(), month: today.getMonth() }
  );
  const [selected, setSelected] = useState(todayYMD);
  const [bookings, setBookings] = useState([]);
  const [sellableRooms, setSellableRooms] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [bookingList, roomResult] = await Promise.all([
        fetchAllBookings(),
        adminRoomService.getRooms({ page: 1, limit: 100 }),
      ]);
      setBookings(bookingList);
      setSellableRooms(calcSellableRooms(roomResult.rooms || []));
    } catch (err) {
      setError(err.message || 'Gagal memuat data okupansi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Saat ganti bulan, pilih hari hari-ini bila ada di bulan itu, else tgl 1
  useEffect(() => {
    const t = parseYMD(todayYMD);
    if (t.getFullYear() === cursor.year && t.getMonth() === cursor.month) {
      setSelected(todayYMD);
    } else {
      setSelected(toYMD(new Date(cursor.year, cursor.month, 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  // Peta tanggal -> booking yang menginap di malam itu (check-in inklusif, check-out eksklusif)
  const byDate = useMemo(() => calcOccupancyByDate(bookings), [bookings]);

  const dayStats = useCallback(
    (ymd) => calcDayStats(byDate, ymd, sellableRooms),
    [byDate, sellableRooms]
  );

  // Grid kalender (Senin pertama)
  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells = [];
    // Hari-hari dari bulan sebelumnya (redup)
    for (let i = 0; i < offset; i++) {
      const d = new Date(cursor.year, cursor.month, -(offset - 1) + i);
      cells.push({ key: toYMD(d), label: d.getDate(), out: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ key: toYMD(new Date(cursor.year, cursor.month, day)), label: day, out: false });
    }
    while (cells.length % 7 !== 0) {
      const next = new Date(cursor.year, cursor.month, daysInMonth + (cells.length - offset - daysInMonth + 1));
      cells.push({ key: toYMD(next), label: next.getDate(), out: true });
    }
    return cells;
  }, [cursor]);

  // Ringkasan bulan berjalan
  const summary = useMemo(() => {
    const inMonth = grid.filter((c) => !c.out);
    let totalPct = 0;
    let nightsSold = 0;
    let peak = null;
    for (const c of inMonth) {
      const s = dayStats(c.key);
      totalPct += s.pct;
      nightsSold += s.occupied;
      if (!peak || s.occupied > peak.occupied) peak = { key: c.key, ...s };
    }
    const avg = inMonth.length ? Math.round((totalPct / inMonth.length) * 10) / 10 : 0;
    return { avg, nightsSold, peak, days: inMonth.length };
  }, [grid, dayStats]);

  const selectedDay = useMemo(() => {
    const s = dayStats(selected);
    const d = parseYMD(selected);
    const label = `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
    return { ...s, label, isToday: selected === todayYMD };
  }, [selected, dayStats, todayYMD]);

  const heatClass = (stats, out) => {
    if (out) return 'bg-surface-container-low/40 text-outline/40 select-none';
    if (stats.occupied === 0) return 'bg-surface-container-low text-on-surface-variant border border-outline-variant/40';
    if (stats.pct < 40) return 'bg-[#E1F5EE] text-[#005440] border border-[#d1e6e1]';
    if (stats.pct <= 75) return 'bg-[#2E856E] text-white';
    return 'bg-[#0F6E56] text-white';
  };

  const goMonth = (delta) => setCursor((c) => shiftMonth(c.year, c.month, delta));
  const goToday = () => setCursor({ year: today.getFullYear(), month: today.getMonth() });

  const isLoadingData = isLoading;
  const sisaKamar = Math.max(0, sellableRooms - selectedDay.occupied);

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      {/* Breadcrumbs & Page Title */}
      <section data-purpose="page-heading">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-primary uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span>Ringkasan Operasional Properti</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">Okupansi Harian</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Kalender Okupansi</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Kepadatan reservasi harian seluruh unit StayEasy — klik tanggal untuk melihat booking
              yang menduduki kamar pada malam tersebut.
            </p>
          </div>
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
              onClick={() => goMonth(-1)}
              title="Bulan Sebelumnya"
              type="button"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            <span className="text-sm font-bold text-on-surface px-2 min-w-[150px] text-center">
              {MONTHS_ID[cursor.month]} {cursor.year}
            </span>
            <button
              className="w-9 h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
              onClick={() => goMonth(1)}
              title="Bulan Berikutnya"
              type="button"
            >
              <Icon name="chevron_right" size={18} />
            </button>
            <button
              className="ml-1 px-3.5 h-9 rounded-lg bg-[#d85a30] hover:bg-[#be4e28] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              onClick={goToday}
              type="button"
            >
              <Icon name="today" size={15} />
              Hari Ini
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center justify-between gap-3">
          <p className="text-sm text-error">{error}</p>
          <button
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold"
            onClick={loadData}
            type="button"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-purpose="occupancy-stats">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Okupansi Rata-rata</span>
            <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center">
              <Icon name="percent" size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-primary tracking-tight">
            {isLoadingData ? '—' : `${summary.avg}%`}
          </p>
          <div className="mt-3 w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, summary.avg)}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Kamar-Malam Terjual</span>
            <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center">
              <Icon name="bed" size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-on-surface tracking-tight">
            {isLoadingData ? '—' : summary.nightsSold}
          </p>
          <p className="mt-2 text-[11px] text-outline">Sepanjang {MONTHS_ID[cursor.month]} {cursor.year}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Hari Puncak</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Icon name="local_fire_department" size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-on-surface tracking-tight">
            {isLoadingData || !summary.peak ? '—' : `${summary.peak.occupied}/${sellableRooms}`}
          </p>
          <p className="mt-2 text-[11px] text-outline">
            {summary.peak ? parseYMD(summary.peak.key).getDate() + ' ' + MONTHS_ID[cursor.month] : 'Belum ada booking'}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Unit Bisa Dijual</span>
            <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center">
              <Icon name="apartment" size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-on-surface tracking-tight">
            {isLoadingData ? '—' : sellableRooms}
          </p>
          <p className="mt-2 text-[11px] text-outline">Kamar aktif (non-inactive)</p>
        </div>
      </section>

      {/* Calendar + Day Detail */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                {MONTHS_ID[cursor.month]} {cursor.year}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Kepadatan = unit terisi / {sellableRooms} unit bisa dijual
              </p>
            </div>
            {/* Legend */}
            <div className="hidden sm:flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-surface-container-low border border-outline-variant/60"></span>0%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#E1F5EE] border border-[#d1e6e1]"></span>&lt;40% Rendah
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#2E856E]"></span>40–75% Sedang
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#0F6E56]"></span>&gt;75% Tinggi
              </span>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-outline mb-1.5">
            {WEEKDAYS_ID.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5" data-purpose="occupancy-grid">
            {isLoadingData &&
              Array.from({ length: 35 }).map((_, i) => (
                <div
                  className="aspect-square rounded-lg bg-surface-container-highest animate-pulse"
                  key={`sk-${i}`}
                ></div>
              ))}
            {!isLoadingData &&
              grid.map((cell) => {
                const stats = cell.out ? { occupied: 0, pct: 0, list: [] } : dayStats(cell.key);
                const isToday = cell.key === todayYMD;
                const isSelected = cell.key === selected && !cell.out;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all cursor-pointer ${heatClass(
                      stats,
                      cell.out
                    )} ${
                      isSelected
                        ? 'ring-2 ring-[#d85a30] ring-offset-2 ring-offset-surface-container-lowest z-10 shadow-md'
                        : !cell.out
                          ? 'hover:scale-[1.04] hover:shadow-sm'
                          : ''
                    } ${!cell.out && stats.pct > 0 ? 'font-semibold' : ''}`}
                    disabled={cell.out}
                    key={cell.key}
                    onClick={() => !cell.out && setSelected(cell.key)}
                    title={
                      cell.out
                        ? undefined
                        : `${cell.label} ${MONTHS_ID[cursor.month]}: ${stats.occupied}/${sellableRooms} unit terisi (${stats.pct}%)${
                            stats.pending ? ` • ${stats.pending} menunggu konfirmasi` : ''
                          }`
                    }
                    type="button"
                  >
                    <span className={`leading-none ${isToday ? 'font-extrabold' : ''}`}>{cell.label}</span>
                    {!cell.out && stats.occupied > 0 && (
                      <span className="mt-1 text-[9px] leading-none opacity-90">
                        {stats.occupied}/{sellableRooms}
                      </span>
                    )}
                    {isToday && <span className="w-1 h-1 bg-[#d85a30] rounded-full absolute bottom-1.5"></span>}
                    {isToday && <span className="absolute inset-0 rounded-lg"></span>}
                  </button>
                );
              })}
          </div>

          {/* Legend mobile */}
          <div className="sm:hidden pt-4 mt-4 border-t border-outline-variant/30 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-surface-container-low border border-outline-variant/60"></span>0%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#E1F5EE] border border-[#d1e6e1]"></span>&lt;40%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#2E856E]"></span>40–75%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0F6E56]"></span>&gt;75%
            </span>
          </div>

          {/* Month footer summary */}
          <div className="mt-5 pt-4 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
            <span>
              <span className="font-bold text-on-surface">{summary.days}</span> hari •{' '}
              <span className="font-bold text-on-surface">{summary.nightsSold}</span> kamar-malam terjual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d85a30]"></span>
              Ring / titik oranye = hari ini
            </span>
          </div>
        </div>

        {/* Selected Day Detail */}
        <aside className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm overflow-hidden lg:sticky lg:top-24">
          <div className="p-5 border-b border-outline-variant/30">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Detail Hari</p>
                <h2 className="text-lg font-bold text-on-surface mt-0.5">
                  {selectedDay.label}
                  {selectedDay.isToday && (
                    <span className="ml-2 align-middle text-[10px] font-bold bg-[#d85a30] text-white px-2 py-0.5 rounded-full">
                      HARI INI
                    </span>
                  )}
                </h2>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-sm font-bold shrink-0 ${
                  selectedDay.occupied === 0
                    ? 'bg-surface-container-high text-on-surface-variant'
                    : selectedDay.pct < 40
                      ? 'bg-[#E1F5EE] text-[#005440] border border-[#d1e6e1]'
                      : selectedDay.pct <= 75
                        ? 'bg-[#2E856E]'
                        : 'bg-[#0F6E56]'
                }`}
                title={`Okupansi ${selectedDay.pct}%`}
              >
                <span>{selectedDay.pct}%</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface-container-low rounded-lg py-2 border border-outline-variant/30">
                <p className="text-[10px] text-outline uppercase font-semibold">Terisi</p>
                <p className="text-sm font-bold text-on-surface">{selectedDay.occupied}</p>
              </div>
              <div className="bg-surface-container-low rounded-lg py-2 border border-outline-variant/30">
                <p className="text-[10px] text-outline uppercase font-semibold">Kosong</p>
                <p className="text-sm font-bold text-on-surface">{sisaKamar}</p>
              </div>
              <div className="bg-surface-container-low rounded-lg py-2 border border-outline-variant/30">
                <p className="text-[10px] text-outline uppercase font-semibold">Menunggu</p>
                <p className="text-sm font-bold text-amber-700">{selectedDay.pending}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoadingData && (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div className="h-14 bg-surface-container-highest rounded-lg animate-pulse" key={n}></div>
                ))}
              </div>
            )}
            {!isLoadingData && selectedDay.list.length === 0 && (
              <div className="p-10 text-center">
                <Icon name="event_available" size={40} className="text-outline-variant" />
                <p className="mt-3 text-sm text-on-surface-variant">
                  Tidak ada booking pada malam ini.
                </p>
                <p className="text-[11px] text-outline mt-1">Seluruh {sellableRooms} unit bebas.</p>
              </div>
            )}
            {!isLoadingData &&
              selectedDay.list
                .slice()
                .sort((a, b) => (a.room?.name || '').localeCompare(b.room?.name || ''))
                .map((b) => {
                  const [badgeClass, statusIcon, statusLabel] =
                    STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                  const guestName = b.user?.name || 'Tamu';
                  return (
                    <button
                      className="w-full text-left px-5 py-3.5 border-b border-outline-variant/20 hover:bg-surface-container/60 transition-colors flex items-start gap-3"
                      key={b.id}
                      onClick={() => navigate('/admin/bookings')}
                      type="button"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="bed" size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-on-surface truncate">
                            {b.room?.name || `Kamar #${b.room_id}`}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeClass}`}
                          >
                            <Icon name={statusIcon} size={11} />
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                          {guestName} • {b.guests} tamu
                        </p>
                        <p className="text-[11px] text-outline mt-0.5">
                          {String(b.check_in_date).slice(0, 10)} → {String(b.check_out_date).slice(0, 10)} • Rp
                          {Number(b.total_price || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </button>
                  );
                })}
          </div>

          <div className="px-5 py-3 bg-surface-container/60 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-outline">
            <span>
              <span className="font-bold text-on-surface">{selectedDay.list.length}</span> booking aktif
            </span>
            <button
              className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              onClick={() => navigate('/admin/bookings')}
              type="button"
            >
              Kelola booking <Icon name="arrow_forward" size={13} />
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
