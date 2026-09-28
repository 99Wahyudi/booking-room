import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as adminRoomService from '../../services/adminRoomService';
import Icon from '../../components/ui/Icon';
import { fetchAllBookings, MONTHS_ID, toYMD, parseYMD } from '../../lib/adminData';

const STATUS_STYLES = {
  pending: ['bg-amber-50 text-amber-800 border-amber-200', 'schedule', 'Menunggu'],
  confirmed: ['bg-primary-fixed text-on-primary-fixed border-primary-fixed', 'check_circle', 'Terkonfirmasi'],
  completed: ['bg-surface-container-high text-on-surface-variant border-outline-variant', 'task_alt', 'Selesai'],
  cancelled: ['bg-error/10 text-error border-error/20', 'cancel', 'Dibatalkan'],
  rejected: ['bg-error/10 text-error border-error/20', 'block', 'Ditolak'],
};
const STATUS_DOT = {
  pending: 'bg-amber-500',
  confirmed: 'bg-primary',
  completed: 'bg-outline',
  cancelled: 'bg-error',
  rejected: 'bg-error',
};

const REVENUE_STATUSES = new Set(['confirmed', 'completed']);

const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function Laporan() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);

  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
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
      setRooms(roomResult.rooms || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data laporan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const period = useMemo(() => {
    const start = new Date(cursor.year, cursor.month, 1);
    const end = new Date(cursor.year, cursor.month + 1, 1); // eksklusif
    return { start, end, startYMD: toYMD(start), endYMD: toYMD(end) };
  }, [cursor]);

  const sellableRooms = useMemo(
    () => rooms.filter((r) => r.status !== 'inactive').length || rooms.length,
    [rooms]
  );

  // Booking yang menginap/beririsan dengan periode
  const periodBookings = useMemo(() => {
    const s = period.startYMD;
    const e = period.endYMD;
    return bookings.filter((b) => {
      const ci = String(b.check_in_date).slice(0, 10);
      const co = String(b.check_out_date).slice(0, 10);
      return ci < e && co > s;
    });
  }, [bookings, period]);

  // Jumlah malam sebuah booking di dalam periode (clamp ke bulan)
  const nightsInPeriod = useCallback(
    (b) => {
      let d = parseYMD(String(b.check_in_date).slice(0, 10));
      const end = parseYMD(String(b.check_out_date).slice(0, 10));
      let n = 0;
      let guard = 0;
      while (d < end && guard++ < 730) {
        const ymd = toYMD(d);
        if (ymd >= period.startYMD && ymd < period.endYMD) n += 1;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      }
      return n;
    },
    [period]
  );

  const report = useMemo(() => {
    const createdInPeriod = bookings.filter((b) => {
      const created = String(b.created_at || '').slice(0, 10);
      return created >= period.startYMD && created < period.endYMD;
    });

    const revenueBookings = periodBookings.filter((b) => REVENUE_STATUSES.has(b.status));
    const revenue = revenueBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const nightsSold = periodBookings.reduce((sum, b) => {
      if (!REVENUE_STATUSES.has(b.status)) return sum;
      return sum + nightsInPeriod(b);
    }, 0);
    const adr = nightsSold > 0 ? Math.round(revenue / nightsSold) : 0;

    // Okupansi rata-rata: per malam dalam periode, unit terisi / sellable
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    let totalOccupied = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const ymd = toYMD(new Date(cursor.year, cursor.month, day));
      const occupied = new Set(
        periodBookings
          .filter(
            (b) =>
              REVENUE_STATUSES.has(b.status) || b.status === 'pending'
          )
          .filter((b) => {
            const ci = String(b.check_in_date).slice(0, 10);
            const co = String(b.check_out_date).slice(0, 10);
            return ci <= ymd && co > ymd;
          })
          .map((b) => b.room_id)
      ).size;
      totalOccupied += occupied;
    }
    const avgOccupancy =
      sellableRooms > 0 && daysInMonth > 0
        ? Math.round((totalOccupied / (sellableRooms * daysInMonth)) * 1000) / 10
        : 0;

    // Distribusi status (booking yang irisan periode)
    const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0 };
    for (const b of periodBookings) {
      if (statusCounts[b.status] !== undefined) statusCounts[b.status] += 1;
    }

    // Pendapatan per tipe kamar (dari revenue bookings)
    const byType = {};
    for (const b of revenueBookings) {
      const typeName = b.room?.room_type?.name || b.room?.room_type?.name || 'Lainnya';
      const key = b.room?.room_type_id || typeName;
      if (!byType[key]) byType[key] = { name: typeName, revenue: 0, nights: 0, bookings: 0 };
      byType[key].revenue += Number(b.total_price || 0);
      byType[key].nights += nightsInPeriod(b);
      byType[key].bookings += 1;
    }
    const typeBreakdown = Object.values(byType).sort((a, b) => b.revenue - a.revenue);
    const maxTypeRevenue = typeBreakdown[0]?.revenue || 0;

    // Booking terlaris per kamar
    const byRoom = {};
    for (const b of periodBookings) {
      if (!REVENUE_STATUSES.has(b.status)) continue;
      const key = b.room_id;
      if (!byRoom[key]) byRoom[key] = { name: b.room?.name || `Kamar #${key}`, nights: 0, revenue: 0 };
      byRoom[key].nights += nightsInPeriod(b);
      byRoom[key].revenue += Number(b.total_price || 0);
    }
    const topRooms = Object.values(byRoom)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const maxStatus = Math.max(1, ...Object.values(statusCounts));

    return {
      createdCount: createdInPeriod.length,
      revenue,
      nightsSold,
      adr,
      avgOccupancy,
      statusCounts,
      statusTotal: periodBookings.length,
      typeBreakdown,
      maxTypeRevenue,
      topRooms,
      maxStatus,
    };
  }, [bookings, periodBookings, period, cursor, sellableRooms, nightsInPeriod]);

  const goMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const exportCsv = () => {
    const header = ['ID', 'Tamu', 'Email', 'Kamar', 'Check-in', 'Check-out', 'Tamu', 'Status', 'Total'];
    const rows = periodBookings.map((b) => [
      b.id,
      b.user?.name || '',
      b.user?.email || '',
      b.room?.name || `Kamar #${b.room_id}`,
      String(b.check_in_date).slice(0, 10),
      String(b.check_out_date).slice(0, 10),
      b.guests,
      b.status,
      b.total_price,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const periodLabel = `${MONTHS_ID[cursor.month]} ${cursor.year}`;
  const kpi = [
    {
      label: 'Pendapatan Periode',
      value: isLoading ? '—' : rupiah(report.revenue),
      icon: 'payments',
      tone: 'bg-primary-fixed/40 text-primary',
      note: 'Booking confirmed + completed',
    },
    {
      label: 'Booking Dibuat',
      value: isLoading ? '—' : report.createdCount,
      icon: 'edit_calendar',
      tone: 'bg-primary-fixed/40 text-primary',
      note: `Dibuat pada ${periodLabel}`,
    },
    {
      label: 'Okupansi Rata-rata',
      value: isLoading ? '—' : `${report.avgOccupancy}%`,
      icon: 'percent',
      tone: 'bg-primary-fixed/40 text-primary',
      note: `${sellableRooms} unit bisa dijual`,
    },
    {
      label: 'ADR (Harga Rata-rata)',
      value: isLoading ? '—' : rupiah(report.adr),
      icon: 'currency_exchange',
      tone: 'bg-primary-fixed/40 text-primary',
      note: `${report.nightsSold} kamar-malam terjual`,
    },
  ];

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      {/* Header */}
      <section data-purpose="page-heading">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-primary uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span>Ringkasan Operasional Properti</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">Laporan Periodik</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Laporan</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Kinerja reservasi, pendapatan, dan okupansi StayEasy untuk periode bulanan.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="w-9 h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
              onClick={() => goMonth(-1)}
              title="Bulan Sebelumnya"
              type="button"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            <span className="text-sm font-bold text-on-surface px-2 min-w-[150px] text-center">
              {periodLabel}
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
              className="ml-1 px-3.5 h-9 rounded-lg bg-[#d85a30] hover:bg-[#be4e28] text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
              onClick={exportCsv}
              disabled={isLoading || periodBookings.length === 0}
              title="Unduh CSV periode ini"
              type="button"
            >
              <Icon name="download" size={15} />
              Ekspor CSV
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

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-purpose="report-kpis">
        {kpi.map((k) => (
          <div
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm"
            key={k.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-on-surface-variant">{k.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.tone}`}>
                <Icon name={k.icon} size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-on-surface tracking-tight break-words">
              {isLoading ? <span className="inline-block w-20 h-7 bg-surface-container-highest rounded animate-pulse"></span> : k.value}
            </p>
            <p className="mt-2 text-[11px] text-outline">{k.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Status breakdown + revenue by type */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-bold text-on-surface">Distribusi Status Booking</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isLoading ? 'Memuat…' : `${report.statusTotal} booking tumpang tindih dengan ${periodLabel}`}
            </p>
            <div className="mt-4 space-y-3">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div className="h-6 bg-surface-container-highest rounded animate-pulse" key={i}></div>
                ))}
              {!isLoading &&
                Object.entries(report.statusCounts).map(([status, count]) => {
                  const [, , label] = STATUS_STYLES[status];
                  const pct = Math.round((count / report.maxStatus) * 100);
                  return (
                    <div className="flex items-center gap-3" key={status}>
                      <span className="w-32 shrink-0 text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`}></span>
                        {label}
                      </span>
                      <div className="flex-1 h-5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status === 'pending'
                              ? 'bg-amber-400'
                              : status === 'confirmed'
                                ? 'bg-primary'
                                : status === 'completed'
                                  ? 'bg-outline'
                                  : 'bg-error/60'
                          }`}
                          style={{ width: `${count === 0 ? 0 : Math.max(4, pct)}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-on-surface">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Revenue by room type */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-bold text-on-surface">Pendapatan per Tipe Kamar</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Sumber: booking confirmed + completed dengan menginap di {periodLabel}
            </p>
            <div className="mt-4 space-y-4">
              {isLoading && (
                <div className="h-24 bg-surface-container-highest rounded animate-pulse"></div>
              )}
              {!isLoading && report.typeBreakdown.length === 0 && (
                <div className="py-8 text-center">
                  <Icon name="bar_chart" size={36} className="text-outline-variant" />
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Tidak ada pendapatan pada periode ini.
                  </p>
                </div>
              )}
              {!isLoading &&
                report.typeBreakdown.map((t) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-semibold text-on-surface">{t.name}</span>
                      <span className="font-bold text-primary">{rupiah(t.revenue)}</span>
                    </div>
                    <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-container rounded-full transition-all duration-500"
                        style={{ width: `${report.maxTypeRevenue ? (t.revenue / report.maxTypeRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-[11px] text-outline">
                      {t.bookings} booking • {t.nights} kamar-malam
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right: top rooms + detail table */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top rooms */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-bold text-on-surface">Kamar Terlaris</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Berdasarkan pendapatan periode</p>
            <ol className="mt-4 space-y-3">
              {isLoading && (
                <li className="h-14 bg-surface-container-highest rounded animate-pulse"></li>
              )}
              {!isLoading && report.topRooms.length === 0 && (
                <li className="py-6 text-center text-sm text-on-surface-variant">
                  Belum ada kamar terjual pada periode ini.
                </li>
              )}
              {!isLoading &&
                report.topRooms.map((r, idx) => (
                  <li className="flex items-center gap-3" key={r.name}>
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0 ? 'bg-[#d85a30] text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{r.name}</p>
                      <p className="text-[11px] text-outline">
                        {r.nights} kamar-malam • {rupiah(r.revenue)}
                      </p>
                    </div>
                  </li>
                ))}
            </ol>
          </div>

          {/* Booking detail in period */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Rincian Booking</h2>
                <p className="text-xs text-on-surface-variant">
                  {isLoading ? 'Memuat…' : `${periodBookings.length} booking pada periode ini`}
                </p>
              </div>
              <button
                className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
                onClick={() => navigate('/admin/bookings')}
                type="button"
              >
                Kelola <Icon name="arrow_forward" size={14} />
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-outline-variant/20">
              {isLoading && (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div className="h-14 bg-surface-container-highest rounded-lg animate-pulse" key={n}></div>
                  ))}
                </div>
              )}
              {!isLoading && periodBookings.length === 0 && (
                <div className="p-10 text-center">
                  <Icon name="receipt_long" size={40} className="text-outline-variant" />
                  <p className="mt-3 text-sm text-on-surface-variant">
                    Tidak ada booking pada {periodLabel}.
                  </p>
                </div>
              )}
              {!isLoading &&
                periodBookings.map((b) => {
                  const [badgeClass, statusIcon, statusLabel] =
                    STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                  return (
                    <button
                      className="w-full text-left px-5 py-3.5 hover:bg-surface-container/60 transition-colors flex items-start gap-3"
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
                          {b.user?.name || 'Tamu'} • {String(b.check_in_date).slice(0, 10)} →{' '}
                          {String(b.check_out_date).slice(0, 10)}
                        </p>
                        <p className="text-[11px] text-outline mt-0.5">{rupiah(b.total_price)}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
