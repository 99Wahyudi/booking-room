import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * The faithful pages keep the design-system anchors (<a data-path="..." href="#">).
 * This component intercepts clicks on those anchors and routes them via react-router
 * so navigation works without altering the original markup.
 *
 * It also handles forms that were given `method`/`action` placeholders and the
 * `data-slug` attribute used for room-detail links.
 */
const PATH_MAP = {
  beranda: '/',
  'booking-saya': '/bookings',
  'hasil-pencarian': '/search',
  'pusat-bantuan': '/support',
  'profil-akun': '/bookings',
  pengaturan: '/support',
  kebijakan: '/support',
  keluar: '/login',
  login: '/login',
  register: '/register',
  masuk: '/login',
  'login-admin': '/admin/login',
  dashboard: '/admin',
  'kelola-kamar': '/admin/rooms',
  'tambah-kamar': '/admin/rooms/new',
  'kelola-booking': '/admin/bookings',
  'panel-admin': '/admin',
  'kelola-fasilitas': '/admin/facilities',
  'kelola-tipe-kamar': '/admin/room-types',
  'kalender-okupansi': '/admin/calendar',
  laporan: '/admin/reports',
};

export default function GlobalNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // --- Gambar cadangan (fallback) ---
    // Jika sebuah <img> gagal dimuat (rusak/404), ganti ke placeholder lokal
    // agar tidak tampil broken. Hanya 1x per gambar (data-fallback).
    const onImgError = (e) => {
      const target = e.target;
      if (!target || target.tagName !== 'IMG') return;
      if (target.dataset.fallback) return;
      target.dataset.fallback = 'true';
      target.src = '/img/placeholder.svg';
    };
    document.addEventListener('error', onImgError, true);

    const onClick = (e) => {
    const el = e.target.closest
      ? e.target.closest('[data-path], a[data-slug], [data-nav], a[href^="/admin"], a[href^="/rooms"], a[href^="/bookings"], a[href^="/search"], a[href="/"]')
      : null;
    if (!el) return;

    const slug = el.getAttribute && el.getAttribute('data-slug');
    if (slug) {
      e.preventDefault();
      navigate(`/rooms/${slug}`);
      return;
    }

    // data-nav / data-path mapped attrs
    const navKey = (el.getAttribute && el.getAttribute('data-nav')) || (el.getAttribute && el.getAttribute('data-path'));
    if (navKey === 'keluar') {
      e.preventDefault();
      logout().catch(() => {});
      navigate('/');
      return;
    }
    if (navKey) {
      const mapHit = PATH_MAP[navKey];
      if (mapHit) {
        e.preventDefault();
        navigate(mapHit);
        return;
      }
      if (/^[a-z0-9-]+$/i.test(navKey)) {
        e.preventDefault();
        navigate('/');
        return;
      }
    }

    // Internal link (starts-with /) -> in-app navigate to avoid full reload
    const href = el.getAttribute && el.getAttribute('href');
    if (href && href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    }
  };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('error', onImgError, true);
      document.removeEventListener('click', onClick);
    };
  }, [navigate, logout]);

  return null;
}