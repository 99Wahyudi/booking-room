import apiClient from '../lib/apiClient';

export async function getRoomTypes() {
  const res = await apiClient.get('/room-types');
  return res.data || [];
}

export async function getFacilities() {
  const res = await apiClient.get('/facilities');
  return res.data || [];
}

/**
 * params: { check_in, check_out, guests, room_type_id, min_price, max_price,
 *           facilities (array|'1,2'), sort ('price_low'|'price_high'|'newest'), page, limit }
 * Backend me-return data: { rooms, total, page, limit }
 */
export async function searchRooms(params = {}) {
  const query = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length > 0) query[key] = value.join(',');
      return;
    }
    query[key] = value;
  });
  const res = await apiClient.get('/rooms/search', { params: query });
  const data = res.data || {};
  return {
    rooms: data.rooms || data.items || [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 10,
  };
}

export async function getRoomDetail(id) {
  const res = await apiClient.get(`/rooms/${id}`);
  return res.data || null;
}

/**
 * Public listing of all (non-deleted) rooms; no date requirement.
 * GET /api/rooms
 */
export async function getRooms() {
  const res = await apiClient.get('/rooms');
  return res.data || [];
}
