import axios from 'axios';

export const TOKEN_KEY = 'stayeasy_token';

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------
/**
 * Normalisasi error dari axios menjadi object sederhana:
 * { status, message, errors }
 * - errors: object per-field dari backend (validasi), boleh null
 * - isConflict: true kalau status 409 (mis. kamar sudah dipesan)
 */
function normalizeError(err) {
  if (err && err.response) {
    const { status, data } = err.response;
    return {
      status,
      message:
        (data && data.message) ||
        'Terjadi kesalahan. Silakan coba lagi.',
      errors: (data && data.error && typeof data.error === 'object' && !Array.isArray(data.error)
        ? data.error
        : null) || (data && data.errors) || null,
      isConflict: status === 409,
      isUnauthorized: status === 401,
      raw: err,
    };
  }
  return {
    status: 0,
    message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
    errors: null,
    isConflict: false,
    isUnauthorized: false,
    raw: err,
  };
}

export { normalizeError };

// ---------------------------------------------------------------------------
// Image URL resolver
// ---------------------------------------------------------------------------
/**
 * Backend mengembalikan URL foto yang relatif (mis. "/uploads/xxx.png").
 * Ubah jadi URL absolut ke origin backend agar bisa dirender di <img>.
 * URL absolut (http/https) dibiarkan apa adanya.
 */
export function resolveImageUrl(url) {
  if (!url) return url;
  // URL absolut atau protokol non-http (blob:, data:) dilewati apa adanya
  if (/^(https?:|blob:|data:)/i.test(url) || url.startsWith('http')) return url;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');
  try {
    const origin = new URL(base).origin;
    return origin + (url.startsWith('/') ? url : `/${url}`);
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: sertakan token JWT kalau ada
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  // Sukses: langsung return body ({ success, message, data })
  (response) => response.data,
  (error) => {
    const normalized = normalizeError(error);

    // 401 -> token invalid/expired, bersihkan & arahkan ke login
    if (normalized.isUnauthorized && !normalized._skipAuthRedirect) {
      localStorage.removeItem(TOKEN_KEY);
      // Hindari redirect loop di halaman login itu sendiri
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
      }
    }

    // 409 (konflik booking) TIDAK diperlakukan khusus di sini —
    // error tetap di-reject supaya komponen pemanggil menanganinya
    // dengan pesan spesifik.

    return Promise.reject(normalized);
  }
);

export default apiClient;
