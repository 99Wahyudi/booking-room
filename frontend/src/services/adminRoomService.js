import apiClient from '../lib/apiClient';

export async function getRooms(params = {}) {
  const res = await apiClient.get('/admin/rooms', { params });
  const data = res.data || {};
  return {
    rooms: data.rooms || data.items || [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 10,
  };
}

export async function getRoomById(id) {
  const res = await apiClient.get(`/admin/rooms/${id}`);
  return res.data || null;
}

/**
 * payload: { name, room_type_id, price_per_night, capacity, status, description, facility_ids[] }
 * Return room object (dengan id) — penting agar foto bisa diupload setelahnya.
 */
export async function createRoom(payload) {
  const res = await apiClient.post('/admin/rooms', payload);
  return res.data || null;
}

export async function updateRoom(id, payload) {
  const res = await apiClient.put(`/admin/rooms/${id}`, payload);
  return res.data || null;
}

export async function deleteRoom(id) {
  const res = await apiClient.delete(`/admin/rooms/${id}`);
  return res.data || null;
}

/**
 * Upload foto kamar sebagai request terpisah (multipart/form-data),
 * dipanggil SETELAH create/update data teks berhasil.
 * files: File[] atau FileList
 */
export async function uploadRoomPhotos(roomId, files) {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('photos', file));
  const res = await apiClient.post(`/admin/rooms/${roomId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data || null;
}

export async function deleteRoomPhoto(roomId, photoId) {
  const res = await apiClient.delete(`/admin/rooms/${roomId}/photos/${photoId}`);
  return res.data || null;
}

export async function setPrimaryPhoto(roomId, photoId) {
  const res = await apiClient.patch(`/admin/rooms/${roomId}/photos/${photoId}/primary`);
  return res.data || null;
}
