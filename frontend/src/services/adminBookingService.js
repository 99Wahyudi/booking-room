import apiClient from '../lib/apiClient';

export async function getAllBookings(params = {}) {
  const res = await apiClient.get('/admin/bookings', { params });
  const data = res.data || {};
  return {
    bookings: data.items || data.bookings || [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 10,
  };
}

export async function confirmBooking(id) {
  const res = await apiClient.patch(`/admin/bookings/${id}/confirm`);
  return res.data || null;
}

/**
 * reason: string alasan penolakan (dikirim sebagai body { reason })
 */
export async function rejectBooking(id, reason) {
  const res = await apiClient.patch(`/admin/bookings/${id}/reject`, { reason });
  return res.data || null;
}

export async function completeBooking(id) {
  const res = await apiClient.patch(`/admin/bookings/${id}/complete`);
  return res.data || null;
}
