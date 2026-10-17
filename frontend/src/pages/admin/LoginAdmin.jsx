import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// 1:1 port of login_admin_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function LoginAdmin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        setFormError('Akun ini bukan admin. Gunakan akun staf/admin.');
        return;
      }
      toast.success(`Selamat datang, ${user.name}!`);
      navigate('/admin', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Gagal masuk. Periksa email & kata sandi.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
<main className="w-full flex-1 flex items-center justify-center p-space-md lg:p-space-xl"><div className="flex flex-col w-full items-center justify-center min-h-[870px] px-4 py-8">
{/* Subtle decorative ambient elements in background */}
<div className="relative w-full max-w-[460px]">
<div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute -bottom-10 -right-10 w-44 h-44 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none"></div>
{/* Main Authentication Card */}
<div className="relative bg-surface-container-lowest rounded-xl shadow-2xl p-8 sm:p-10 flex flex-col gap-6">
{/* Top Brand & Identifier Header */}
<div className="flex flex-col items-start gap-4">
<div className="flex items-center justify-between w-full">
<div className="flex items-center gap-2">
<div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-on-primary text-[22px]">apartment</span>
</div>
<div className="flex flex-col">
<span className="font-headline-md text-headline-md tracking-tight text-on-surface leading-none">StayEasy</span>
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-0.5">Hospitality Group</span>
</div>
</div>
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            Admin Portal
          </span>
</div>
<div className="flex flex-col gap-1 mt-2">
<h1 className="font-headline-md text-headline-md text-on-background tracking-tight">Masuk sebagai Admin</h1>
<p className="font-body-sm text-body-sm text-on-surface-variant">Akses terbatas untuk staf dan manajemen operasional properti StayEasy.</p>
</div>
</div>
{/* Authentication Form */}
<form className="flex flex-col gap-4" id="admin-login-form" onSubmit={handleSubmit}>
{formError && (
<div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-body-sm text-body-sm text-center" role="alert">
          {formError}
        </div>
)}
{/* Email Field */}
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between" htmlFor="admin-email">
<span>Alamat Email Admin</span>
<span className="font-label-sm text-label-sm text-on-surface-variant opacity-80">SSO / Internal</span>
</label>
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">mail</span>
<input className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md rounded-lg outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#0f6e56]" id="admin-email" name="email" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="admin@stayeasy.id" required="" type="email" value={form.email}/>
</div>
</div>
{/* Password Field */}
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="admin-password">
            Kata Sandi
          </label>
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">lock</span>
<input className="w-full h-12 pl-11 pr-12 bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md rounded-lg outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#0f6e56]" id="admin-password" name="password" onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••••••" required="" type={showPassword ? 'text' : 'password'} value={form.password}/>
<button aria-label="Tampilkan atau sembunyikan kata sandi" className="absolute right-3 p-1.5 text-outline hover:text-on-surface transition-colors flex items-center justify-center rounded-lg" id="toggle-password-visibility" onClick={() => setShowPassword((s) => !s)} type="button">
<span className="material-symbols-outlined text-[20px]" id="visibility-icon">{showPassword ? 'visibility_off' : 'visibility'}</span>
</button>
</div>
</div>
{/* Remember Me & Forgot Password Row */}
<div className="flex items-center justify-between pt-1">
<label className="flex items-center gap-2.5 cursor-pointer select-none">
<input className="w-4 h-4 rounded text-primary-container focus:ring-primary-container cursor-pointer accent-[#0f6e56]" id="remember-session" name="remember" type="checkbox"/>
<span className="font-body-sm text-body-sm text-on-surface-variant">Ingat sesi perangkat ini</span>
</label>
<a className="font-label-md text-label-md text-primary hover:text-primary-container font-semibold transition-colors duration-150 underline decoration-primary/30 underline-offset-4" href="#recovery">
            Lupa kata sandi?
          </a>
</div>
{/* Submit Button (High-Intent Coral CTA) */}
<button className="mt-2 w-full h-12 bg-secondary-container hover:bg-secondary text-on-primary font-title-md text-title-md rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99] disabled:opacity-60" disabled={submitting} type="submit">
{submitting ? (
<span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
) : (
<>
<span>Masuk ke Portal Admin</span>
<span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
</>
)}
</button>
</form>
{/* Security / Governance Notice (No Registration Allowed) */}
<div className="flex flex-col gap-3">
<div className="flex items-start gap-3 p-3.5 rounded-lg bg-surface-container text-on-surface-variant">
<span className="material-symbols-outlined text-primary-container text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
<div className="flex flex-col gap-0.5">
<span className="font-label-sm text-label-sm font-semibold text-on-surface">Akses Keamanan Terpadu</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Pembuatan dan penonaktifan akun staf dilakukan secara sentral oleh tim IT Operations &amp; Superadmin.
            </p>
</div>
</div>
{/* Secondary Backlink to Guest Facing Portal */}
<div className="pt-2 text-center">
<a className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors group" href="/">
<span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:-translate-x-1">arrow_back</span>
<span>Kembali ke Portal Tamu</span>
</a>
</div>
</div>
</div>
{/* Security Metadata Stamp */}
<div className="flex items-center justify-between px-2 pt-4 text-on-primary-container font-label-sm text-label-sm opacity-70">
<span>Protokol ID: SEC-TLS13-882</span>
<span>Lokasi Node: JKT-DC02</span>
</div>
</div>
</div>
</main><footer className="w-full py-space-md text-center bg-primary"><div className="max-w-[1240px] mx-auto px-space-md flex flex-col sm:flex-row items-center justify-center gap-space-xs text-on-primary-container font-body-sm text-body-sm"><span className="flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider"><span className="material-symbols-outlined text-[16px]">lock</span> Sesi Terenkripsi End-to-End</span><span className="hidden sm:inline opacity-40">•</span><span>© 2025 StayEasy Internal Portal. Hak cipta dilindungi.</span></div></footer>
    </>
  );
}
