import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../ui/Icon';

const PRIMARY_NAV = [
  { to: '/admin', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/admin/bookings', icon: 'book_online', label: 'Kelola Booking' },
  { to: '/admin/rooms', icon: 'bed', label: 'Kamar & Suite' },
  { to: '/admin/calendar', icon: 'calendar_month', label: 'Kalender Okupansi' },
];

const MORE_NAV = [
  { to: '/admin/rooms/new', icon: 'add_circle', label: 'Tambah Kamar' },
  { to: '/admin/reports', icon: 'analytics', label: 'Laporan' },
  { to: '/admin/facilities', icon: 'category', label: 'Kelola Fasilitas' },
  { to: '/admin/room-types', icon: 'meeting_room', label: 'Kelola Tipe Kamar' },
];

const navLinkClasses = ({ isActive }, variant) =>
  variant === 'header'
    ? `px-3 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors ${
        isActive
          ? 'bg-primary-container text-on-primary'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
      }`
    : `px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-sm font-semibold transition-colors ${
        isActive
          ? 'bg-primary-container text-on-primary'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
      }`;

function renderNavItems(items, variant, extraClass = '', onNavigate) {
  return items.map((item) => (
    <NavLink
      key={item.to + item.label}
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={(args) => `${navLinkClasses(args, variant)} ${extraClass}`}
    >
      <Icon name={item.icon} size={variant === 'header' ? 18 : 18} />
      <span>{item.label}</span>
    </NavLink>
  ));
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const adminName = user?.name || 'Admin';
  const adminInitials = adminName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top App Navigation Shell */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-outline-variant/40 px-4 sm:px-6 lg:px-12 py-3 shadow-sm">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
          {/* Brand, Nav & Hamburger Dropdown */}
          <div className="flex items-center gap-8">
            {/* Hamburger (menu tambahan) */}
            <div className="relative">
              <button
                aria-label="Buka menu"
                aria-expanded={menuOpen}
                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                onClick={() => setMenuOpen((o) => !o)}
                type="button"
              >
                <Icon name="menu" size={22} />
              </button>

              {menuOpen && (
                <>
                  {/* Overlay untuk menutup saat klik di luar */}
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setMenuOpen(false)}
                  ></div>

                  {/* Dropdown Panel */}
                  <div className="absolute left-0 top-full mt-2 w-64 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-tier3 z-50 overflow-hidden">
                    <div className="p-2 space-y-0.5" data-purpose="menu-utama">
                      <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider uppercase text-outline">
                        Navigasi
                      </p>
                      {/* Di layar kecil (menu utama belum tampil di header) tampilkan semua */}
                      {renderNavItems(PRIMARY_NAV, 'dropdown', 'hidden lg:flex', () => setMenuOpen(false))}
                      {/* Menu tambahan selalu tampil */}
                      {renderNavItems(MORE_NAV, 'dropdown', '', () => setMenuOpen(false))}
                    </div>

                    {/* Profil & Logout */}
                    <div className="border-t border-outline-variant/30 bg-surface-container/60 p-3 space-y-2">
                      <div className="flex items-center gap-3 px-1.5 py-1">
                        <div className="w-9 h-9 rounded-full bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
                          {adminInitials}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-on-surface truncate">{adminName}</p>
                          <p className="text-[11px] text-outline truncate">Admin Portal StayEasy</p>
                        </div>
                      </div>
                      <button
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-colors"
                        onClick={handleLogout}
                        type="button"
                      >
                        <Icon name="logout" size={16} />
                        <span>Keluar Sistem</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link to="/" className="flex items-center gap-3 text-primary font-headline-md tracking-tight">
              <div className="size-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[20px]" data-icon="domain">
                  domain
                </span>
              </div>
              <span className="text-on-surface text-lg font-bold font-headline-sm tracking-[-0.015em]">
                StayEasy{' '}
                <span className="text-primary font-medium text-sm ml-1 px-2 py-0.5 rounded-full bg-primary-fixed/40">
                  Admin
                </span>
              </span>
            </Link>

            {/* Menu utama (4) — tampil di layar menengah ke atas */}
            <nav className="hidden lg:flex items-center gap-1 font-label-md">
              {renderNavItems(PRIMARY_NAV, 'header')}
            </nav>
          </div>

          {/* Search & Profile */}
          <div className="flex items-center gap-3 lg:gap-4">
            <form
              className="relative hidden sm:block w-56 lg:w-72"
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.currentTarget.query.value.trim();
                if (q) navigate(`/admin/bookings?guest_name=${encodeURIComponent(q)}`);
              }}
            >
              <span className="absolute inset-y-0 left-3 flex items-center text-outline pointer-events-none">
                <Icon name="search" size={20} />
              </span>
              <input
                className="w-full h-10 pl-10 pr-4 text-sm bg-surface-container-low border border-outline-variant/60 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline"
                name="query"
                placeholder="Cari tamu, booking ID, kamar..."
                type="text"
              />
            </form>
            <div className="h-6 w-px bg-outline-variant/60"></div>
            <div className="flex items-center gap-2.5 pl-1" data-purpose="admin-profile-badge">
              <div className="w-9 h-9 rounded-full bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center font-bold text-sm ring-2 ring-primary/20">
                {adminInitials}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface leading-tight">{adminName}</span>
                <span className="text-[11px] text-outline">Admin Portal StayEasy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Body */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}