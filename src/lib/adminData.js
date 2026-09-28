import * as adminBookingService from '../services/adminBookingService';

// Status yang menduduki kamar (menginap). cancelled/rejected tidak dihitung.
export const OCCUPYING = new Set(['pending', 'confirmed', 'completed']);

export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
export const WEEKDAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseYMD = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const shiftMonth = (y, m, delta) => {
  const d = new Date(y, m + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

/** Seluruh booking admin (lewati pagination, maks 20 x 100). */
export async function fetchAllBookings() {
  const all = [];
  let page = 1;
  let total = Infinity;
  while (all.length < total && page <= 20) {
    const res = await adminBookingService.getAllBookings({ page, limit: 100 });
    all.push(...(res.bookings || []));
    total = res.total ?? all.length;
    if ((res.bookings || []).length === 0) break;
    page += 1;
  }
  return all;
}

/** Unit yang bisa dijual = kamar selain status inactive (fallback: semua kamar). */
export function calcSellableRooms(rooms) {
  const list = rooms || [];
  const sellable = list.filter((r) => r.status !== 'inactive').length;
  return sellable > 0 ? sellable : list.length;
}

/**
 * Peta tanggal -> { rooms: Set(room_id), pending: count, list: [booking] }.
 * Malam dihitung check-in inklusif, check-out eksklusif.
 */
export function calcOccupancyByDate(bookings) {
  const map = {};
  for (const b of bookings) {
    if (!OCCUPYING.has(b.status)) continue;
    const ci = (b.check_in_date || '').slice(0, 10);
    const co = (b.check_out_date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ci) || !/^\d{4}-\d{2}-\d{2}$/.test(co)) continue;
    let d = parseYMD(ci);
    const end = parseYMD(co);
    let guard = 0;
    while (d < end && guard++ < 730) {
      const key = toYMD(d);
      const entry = map[key] || (map[key] = { rooms: new Set(), pending: 0, list: [] });
      entry.rooms.add(b.room_id);
      entry.list.push(b);
      if (b.status === 'pending') entry.pending += 1;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
  }
  return map;
}

/** Statistik satu malam: unit terisi, persentase, pending, & daftar booking. */
export function calcDayStats(byDate, ymd, sellableRooms) {
  const entry = byDate[ymd];
  if (!entry) return { occupied: 0, pct: 0, pending: 0, list: [] };
  const occupied = entry.rooms.size;
  const pct = sellableRooms > 0 ? Math.round((occupied / sellableRooms) * 100) : 0;
  return { occupied, pct, pending: entry.pending, list: entry.list };
}