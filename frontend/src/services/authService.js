import apiClient, { TOKEN_KEY } from '../lib/apiClient';

/**
 * Normalisasi user dari berbagai bentuk response backend.
 */
function normalizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    role: u.role || 'customer',
  };
}

export async function login(email, password) {
  const res = await apiClient.post('/login', { email, password });
  const { token, user } = res.data || {};
  if (token) localStorage.setItem(TOKEN_KEY, token);
  return { token, user: normalizeUser(user) };
}

export async function register({ name, email, password, phone }) {
  // Backend me-return data: { id, name, email, role } langsung
  const res = await apiClient.post('/register', { name, email, password, phone });
  return normalizeUser(res.data);
}

export async function getMe() {
  const res = await apiClient.get('/auth/me');
  return normalizeUser(res.data);
}

export function logout() {
  // Best-effort panggil endpoint logout (token blacklist belum ada di backend,
  // tapi tetap dipanggil sesuai kontrak API). Token dihapus di level context.
  return apiClient.post('/auth/logout').catch(() => null);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
