import apiClient from '../lib/apiClient';

/**
 * Response data: { total_rooms, available_rooms_today, pending_bookings, bookings_this_month }
 */
export async function getStats() {
  const res = await apiClient.get('/admin/dashboard/stats');
  return res.data || null;
}

export async function getRecentBookings(limit = 10) {
  const res = await apiClient.get('/admin/dashboard/recent-bookings', {
    params: { limit },
  });
  return res.data || [];
}
