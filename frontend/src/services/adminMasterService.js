import apiClient from '../lib/apiClient';

// ---------------------------- Room Types -----------------------------------
export async function getRoomTypes() {
  const res = await apiClient.get('/room-types');
  return res.data || [];
}

export async function createRoomType(payload) {
  const res = await apiClient.post('/admin/room-types', payload);
  return res.data || null;
}

export async function updateRoomType(id, payload) {
  const res = await apiClient.put(`/admin/room-types/${id}`, payload);
  return res.data || null;
}

export async function deleteRoomType(id) {
  const res = await apiClient.delete(`/admin/room-types/${id}`);
  return res.data || null;
}

// ---------------------------- Facilities -----------------------------------
export async function getFacilities() {
  const res = await apiClient.get('/facilities');
  return res.data || [];
}

export async function createFacility(payload) {
  const res = await apiClient.post('/admin/facilities', payload);
  return res.data || null;
}

export async function updateFacility(id, payload) {
  const res = await apiClient.put(`/admin/facilities/${id}`, payload);
  return res.data || null;
}

export async function deleteFacility(id) {
  const res = await apiClient.delete(`/admin/facilities/${id}`);
  return res.data || null;
}
