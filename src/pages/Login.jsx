import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// 1:1 port of login_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.id.replace('Input', '')]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');
    try {
      const user = await login(form.email, form.password);
      toast.success(`Selamat datang, ${user.name}!`);
      const from = location.state?.from;
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from || '/', { replace: true });
      }
    } catch (err) {
      setFieldErrors(err.errors || {});
      setFormError(err.message || 'Gagal masuk. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
<main className="w-full min-h-screen bg-surface flex flex-col"><div className="flex flex-col w-full">
<div className="w-full min-h-[calc(100vh-1rem)] flex flex-col lg:flex-row bg-surface">
{/* Left Column: Hero & Lifestyle Visual (60% desktop) */}
<div className="relative w-full lg:w-[60%] min-h-[460px] lg:min-h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
{/* Background Photo with StayEasy Teal Overlay */}
<div className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: "url('/img/remote_6.jpg')" }}>
</div>
<div className="absolute inset-0 bg-primary-container/80 mix-blend-multiply"></div>
<div className="absolute inset-0 bg-gradient-to-t from-primary via-primary-container/60 to-primary/40"></div>
{/* Top subtle badge & brand mark */}
<div className="relative z-10 flex items-center justify-between">
<div className="flex items-center gap-3 bg-surface-container-lowest/15 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
<div className="w-6 h-6 rounded-lg bg-surface-container-lowest flex items-center justify-center">
<span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>hotel</span>
</div>
<span className="font-title-md text-body-sm text-on-primary font-medium tracking-wide">StayEasy Stays &amp; Suites</span>
</div>
<div className="hidden sm:flex items-center gap-2 bg-surface-container-lowest/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-on-primary font-label-sm text-label-sm">
<span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
<span>Pilihan 12.400+ Properti Terverifikasi</span>
</div>
</div>
{/* Center & Bottom Quote & Trust Architecture */}
<div className="relative z-10 mt-auto pt-16 max-w-xl">
{/* Trust metric pill */}
<div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-surface-container-lowest/20 backdrop-blur-md text-on-primary mb-6 shadow-sm">
<div className="flex items-center text-[#fbc02d]">
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
<span className="font-label-sm text-label-sm text-surface-bright tracking-normal">Dinikmati oleh 100.000+ tamu di seluruh Indonesia</span>
</div>
<h1 className="font-display-hero text-headline-lg lg:text-display-hero text-on-primary font-bold leading-tight tracking-tight mb-4">
          Temukan kamar terbaik untuk menginap Anda
        </h1>
<p className="font-body-lg text-body-lg text-tertiary-fixed leading-relaxed max-w-lg mb-8">
          Pengalaman liburan dan menginap tanpa ribet dengan jaminan harga dan kenyamanan terbaik di setiap sudut nusantara.
        </p>
{/* Social Proof Micro-avatars & Guarantee Badge */}
<div className="flex flex-wrap items-center gap-6 pt-4">
<div className="flex items-center gap-3">
<div className="flex -space-x-2">
<div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-title-md text-label-sm font-semibold shadow-sm">
                AD
              </div>
<div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-title-md text-label-sm font-semibold shadow-sm">
                BS
              </div>
<div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-title-md text-label-sm font-semibold shadow-sm">
                MK
              </div>
<div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary font-label-sm text-label-sm font-bold shadow-sm">
                +4k
              </div>
</div>
<span className="font-body-sm text-body-sm text-tertiary-fixed font-medium">Ulasan Bintang 5 Pekan Ini</span>
</div>
<div className="flex items-center gap-2 text-primary-fixed font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
<span>Garansi Kamar Bersih 100%</span>
</div>
</div>
</div>
</div>
{/* Right Column: Authentication Form (40% desktop) */}
<div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-surface">
<div className="w-full max-w-[460px] bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-10 flex flex-col relative">
{/* Brand identity block */}
<div className="flex items-center gap-3 mb-6">
<div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
<svg className="w-7 h-7 text-on-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<rect fill="#FD7549" height="10" rx="2" width="10" x="8" y="18"></rect>
<circle cx="34" cy="18" fill="#FFFFFF" r="4.5"></circle>
<path d="M8 32C14 32 18 24 24 24C30 24 34 30 40 26" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5"></path>
</svg>
</div>
<div>
<div className="flex items-baseline">
<span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">Stay</span>
<span className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">Easy</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant tracking-wide block uppercase text-[11px]">Booking &amp; Hospitality</span>
</div>
</div>
{/* Heading block */}
<div className="mb-8">
<span className="inline-block font-label-sm text-label-sm text-primary-container font-semibold bg-tertiary-fixed/40 px-2.5 py-1 rounded-full mb-2">
            Selamat datang kembali
          </span>
<h2 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
            Masuk ke akun Anda
          </h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
            Silakan masukkan detail akun Anda untuk melanjutkan pemesanan kamar impian.
          </p>
</div>
{/* Form container */}
<form className="space-y-5" id="loginForm" onSubmit={handleSubmit}>
{formError && (
<div className="p-3 rounded-lg bg-error-container border border-outline-variant/40 text-on-error-container font-body-sm text-body-sm text-center" role="alert">
            {formError}
          </div>
)}
{/* Field 1: Email Address */}
<div>
<label className="block font-label-md text-label-md font-semibold text-on-surface mb-2" htmlFor="emailInput">
              Alamat Email
            </label>
<div className="relative flex items-center">
<span className="absolute left-3.5 text-on-surface-variant pointer-events-none flex items-center">
<span className="material-symbols-outlined text-[20px]">mail</span>
</span>
<input className={`w-full h-12 pl-11 pr-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all duration-150 ${fieldErrors.email ? 'ring-2 ring-error' : ''}`} id="emailInput" onChange={handleChange} placeholder="nama@email.com" required="" type="email" value={form.email}/>
</div>
{fieldErrors.email && <p className="mt-1 font-body-sm text-body-sm text-error">{fieldErrors.email}</p>}
</div>
{/* Field 2: Password */}
<div>
<div className="flex items-center justify-between mb-2">
<label className="font-label-md text-label-md font-semibold text-on-surface" htmlFor="passwordInput">
                Kata Sandi
              </label>
</div>
<div className="relative flex items-center">
<span className="absolute left-3.5 text-on-surface-variant pointer-events-none flex items-center">
<span className="material-symbols-outlined text-[20px]">lock</span>
</span>
<input className={`w-full h-12 pl-11 pr-12 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all duration-150 ${fieldErrors.password ? 'ring-2 ring-error' : ''}`} id="passwordInput" onChange={handleChange} placeholder="••••••••••••" required="" type={showPassword ? 'text' : 'password'} value={form.password}/>
<button aria-label="Tampilkan atau sembunyikan kata sandi" className="absolute right-3.5 p-1 text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none" id="togglePasswordBtn" onClick={() => setShowPassword((s) => !s)} type="button">
<span className="material-symbols-outlined text-[20px] block" id="passwordEyeIcon">{showPassword ? 'visibility_off' : 'visibility'}</span>
</button>
</div>
{fieldErrors.password && <p className="mt-1 font-body-sm text-body-sm text-error">{fieldErrors.password}</p>}
</div>

{/* Primary Submit CTA: Coral #D85A30 */}
<button className="w-full py-3.5 px-6 rounded-lg bg-secondary text-on-secondary font-title-md text-title-md font-semibold shadow-md hover:bg-on-secondary-container active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-60" disabled={submitting} id="loginSubmitBtn" type="submit">
{submitting ? (
<span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
) : (
<>
<span>Masuk</span>
<span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
</>
)}
</button>
</form>
{/* Registration Link Footnote */}
<div className="mt-8 text-center pt-2">
<p className="font-body-md text-body-md text-on-surface-variant">
            Belum punya akun?
            <Link className="font-title-md text-body-md font-semibold text-primary hover:text-primary-container hover:underline ml-1 inline-flex items-center gap-0.5" to="/register">
              Daftar di sini
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
</Link>
</p>
</div>
{/* Feedback alert toast container */}
<div className="hidden mt-4 p-3 rounded-lg font-body-sm text-body-sm transition-all text-center" id="loginFeedback"></div>
</div>
</div>
</div>

</div></main>
    </>
  );
}
