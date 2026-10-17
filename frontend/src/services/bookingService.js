import apiClient from '../lib/apiClient';

/**
 * payload: { room_id, check_in_date (YYYY-MM-DD), check_out_date (YYYY-MM-DD), guests, notes }
 * Backend bisa melempar 409 kalau kamar sudah dipesan orang lain —
 * error object (dengan isConflict: true) diteruskan ke pemanggil.
 */
export async function createBooking(payload) {
  const res = await apiClient.post('/bookings', payload);
  return res.data || null; // booking
}

/**
 * Backend: GET /api/bookings/my?status=&page=&limit=
 * Response data: { items, total, page, limit } -> dinormalisasi ke { bookings, ... }
 */
export async function getMyBookings(params = {}) {
  const res = await apiClient.get('/bookings/my', { params });
  const data = res.data || {};
  return {
    bookings: data.items || data.bookings || [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 10,
  };
}

export async function getBookingDetail(id) {
  const res = await apiClient.get(`/bookings/${id}`);
  return res.data || null; // booking
}

export async function cancelBooking(id, reason) {
  const res = await apiClient.patch(`/bookings/${id}/cancel`, reason ? { reason } : undefined);
  return res.data || null;
}
