import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Logo from '../ui/Logo.jsx';
import Icon from '../ui/Icon.jsx';

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/search', label: 'Cari Kamar' },
  { to: '/bookings', label: 'Booking Saya' },
  { to: '/support', label: 'Pusat Bantuan' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toast = useToast();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* token tetap hapus di context */
    } finally {
      toast.success('Keluar berjalan.');
      navigate('/', { replace: true });
      setMobileOpen(false);
    }
  };

  const userInitial = user?.name?.trim()?.charAt(0).toUpperCase() || 'U';

  const mobileClose = (path) => {
    setMobileOpen(false);
    if (path) navigate(path);
  };
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E3DC]">
      <div className="max-w-[1240px] mx-auto px-gutter-mobile lg:px-gutter-desktop h-[72px] flex items-center justify-between gap-space-md">
        <Logo to="/" />

        <nav className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `font-label-md text-label-md font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 font-label-md text-label-md font-medium text-emerald-300 hover:text-white hover:bg-emerald-900/70 transition-colors py-2 px-3 rounded-lg"
                  title="Panel Admin"
                >
                  <Icon name="shield_person" size={18} />
                  <span>Admin</span>
                </Link>
              )}

              <div className="hidden md:block w-px self-stretch bg-[#E5E3DC] mx-1" aria-hidden="true" />

              <Link
                to="/bookings"
                className="inline-flex items-center gap-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors px-3.5 py-1.5"
                title="Booking Saya"
              >
                <span className="w-8 h-8 rounded-full bg-primary text-on-primary text-sm font-bold flex items-center justify-center uppercase">
                  {userInitial}
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
                aria-label="Keluar"
                title="Keluar"
              >
                <Icon name="logout" size={20} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-space-md py-2.5 rounded-xl bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2"
            >
              <Icon name="person" size={18} />
              <span>Masuk / Daftar</span>
            </button>
          )}

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center p-2.5 rounded-lg text-on-surface"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Hapus menu' : 'Menu'}
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
{/* Mobile menu panel */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#E5E3DC] shadow-lg">
          <nav className="max-w-[1240px] mx-auto px-gutter-mobile flex flex-col gap-1 py-space-md">
            {links.map((l) => (
              <button
                key={l.to}
                type="button"
                onClick={() => mobileClose(l.to)}
                className="text-left font-label-md text-label-md font-medium px-3 py-2.5 rounded-lg hover:text-primary hover:bg-surface-container-high transition-colors"
              >
                {l.label}
              </button>
            ))}
            <div className="my-2 h-px bg-surface-variant" aria-hidden="true" />
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => mobileClose('/bookings')}
                  className="text-left flex items-center gap-2 text-on-surface font-label-md text-label-md font-medium px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-primary text-on-primary text-sm font-bold flex items-center justify-center uppercase">
                    {userInitial}
                  </span>
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="text-on-surface-variant">· Booking Saya</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => mobileClose('/admin')}
                    className="text-left flex items-center gap-2 text-on-surface font-label-md text-label-md px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <Icon name="shield_person" size={18} />
                    <span>Panel Admin</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left flex items-center gap-2 text-error font-label-md text-label-md px-3 py-2.5 rounded-lg hover:bg-error-container transition-colors"
                >
                  <Icon name="logout" size={18} />
                  <span>Keluar</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => mobileClose('/login')}
                className="text-left flex items-center gap-2 bg-primary text-on-primary font-title-md text-title-md px-3 py-2.5 rounded-lg"
              >
                <Icon name="person" size={18} />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}