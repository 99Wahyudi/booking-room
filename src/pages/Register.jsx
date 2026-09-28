import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// 1:1 port of register_stayeasy/code.html (Tailwind CDN config + head + tailwind-config stripped; inline scripts converted)
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');

    // Validasi lokal konfirmasi password
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Konfirmasi kata sandi tidak cocok' });
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      toast.success('Registrasi berhasil! Silakan masuk dengan akun Anda.');
      navigate('/login', { replace: true });
    } catch (err) {
      setFieldErrors(err.errors || {});
      setFormError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
<main className="w-full min-h-screen bg-surface flex flex-col"><div className="flex flex-col w-full">
<div className="w-full min-h-screen flex flex-col lg:flex-row bg-surface">
{/* Left Column: Visual Showcase (60% Desktop) */}
<div className="relative w-full lg:w-[60%] min-h-[460px] lg:min-h-screen overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-on-primary">
{/* Background Image */}
<div className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105" style={{ backgroundImage: "url('/img/remote_6.jpg')" }}>
</div>
{/* Teal Scrim Overlay (#0F6E56 ~75% opacity) */}
<div className="absolute inset-0 bg-primary-container/80 backdrop-blur-[2px]"></div>
{/* Subtle Decorative Accent Glow */}
<div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-fixed/15 blur-3xl pointer-events-none"></div>
<div className="absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl pointer-events-none"></div>
{/* Top Header / Micro Brand Pill on Visual Side */}
<div className="relative z-10 flex items-center justify-between">
<div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md shadow-sm">
<span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary font-semibold">StayEasy Official</span>
</div>
<a className="hidden sm:inline-flex items-center gap-1 font-label-md text-label-md text-on-primary/80 hover:text-on-primary transition-colors" data-path="pusat-bantuan" href="#">
<span>Pusat Bantuan</span>
<span className="material-symbols-outlined text-base">arrow_outward</span>
</a>
</div>
{/* Center / Hero Content */}
<div className="relative z-10 max-w-xl my-auto py-10 lg:py-0">
<span className="inline-block px-3 py-1 rounded-full bg-tertiary-fixed/20 text-tertiary-fixed font-label-sm text-label-sm font-semibold tracking-wide uppercase mb-4">
          Ruang Nyaman Menanti
        </span>
<h1 className="font-display-hero text-display-hero-mobile lg:text-display-hero text-on-primary tracking-tight leading-tight">
          Temukan kamar terbaik untuk menginap Anda.
        </h1>
<p className="font-body-lg text-body-lg text-on-primary/85 mt-4 leading-relaxed max-w-lg">
          Jelajahi kenyamanan menginap terkurasi dengan transparansi harga, jaminan layanan prima, dan fleksibilitas penuh di setiap reservasi.
        </p>
{/* Perks List */}
<div className="mt-8 space-y-4">
{/* Perk 1 */}
<div className="flex items-start gap-3.5 group">
<div className="w-8 h-8 rounded-lg bg-surface-container-lowest/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm group-hover:bg-surface-container-lowest/25 transition-all">
<span className="material-symbols-outlined text-tertiary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
</div>
<div>
<p className="font-title-md text-title-md font-semibold text-on-primary">Pilihan 50.000+ kamar terverifikasi</p>
<p className="font-body-sm text-body-sm text-on-primary/75 mt-0.5">Inspeksi kebersihan ketat &amp; foto interior autentik 100% riil.</p>
</div>
</div>
{/* Perk 2 */}
<div className="flex items-start gap-3.5 group">
<div className="w-8 h-8 rounded-lg bg-surface-container-lowest/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm group-hover:bg-surface-container-lowest/25 transition-all">
<span className="material-symbols-outlined text-tertiary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>hotel</span>
</div>
<div>
<p className="font-title-md text-title-md font-semibold text-on-primary">Garansi check-in bebas kendala</p>
<p className="font-body-sm text-body-sm text-on-primary/75 mt-0.5">Dukungan concierge 24/7 dan konfirmasi instan di muka pintu.</p>
</div>
</div>
{/* Perk 3 */}
<div className="flex items-start gap-3.5 group">
<div className="w-8 h-8 rounded-lg bg-surface-container-lowest/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm group-hover:bg-surface-container-lowest/25 transition-all">
<span className="material-symbols-outlined text-secondary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>loyalty</span>
</div>
<div>
<p className="font-title-md text-title-md font-semibold text-on-primary">Poin &amp; reward eksklusif setiap booking</p>
<p className="font-body-sm text-body-sm text-on-primary/75 mt-0.5">Kumpulkan kredit menginap, gratis upgrade kamar &amp; late check-out.</p>
</div>
</div>
</div>
</div>
{/* Bottom Visual Footer: Testimonial & Badges */}
<div className="relative z-10 pt-6">
<div className="p-4 rounded-xl bg-surface-container-lowest/10 backdrop-blur-md shadow-sm max-w-md">
<div className="flex items-center gap-3">
<div className="flex -space-x-2 overflow-hidden">
<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold">RN</span>
<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">DS</span>
<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">AM</span>
</div>
<div className="text-on-primary">
<div className="flex items-center gap-1 text-secondary-fixed">
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="font-label-sm text-label-sm text-on-primary ml-1 font-semibold">4.9/5</span>
</div>
<p className="font-body-sm text-body-sm text-on-primary/80">Dipercaya lebih dari 120.000+ tamu di seluruh Nusantara</p>
</div>
</div>
</div>
</div>
</div>
{/* Right Column: Registration Form (40% Desktop) */}
<div className="w-full lg:w-[40%] bg-surface-container-lowest flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
<div className="w-full max-w-md mx-auto my-auto">
{/* Brand Mark Header */}
<div className="mb-8">
<div className="flex items-center gap-3">
<div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-md">
<div className="relative flex items-center justify-center w-6 h-6">
<span className="w-2.5 h-2.5 rounded-sm bg-secondary absolute top-0.5 left-0"></span>
<span className="material-symbols-outlined text-on-primary text-2xl font-bold">directions_run</span>
</div>
</div>
<div className="flex items-baseline">
<span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">Stay</span>
<span className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">Easy</span>
</div>
</div>
<div className="mt-6">
<h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface tracking-tight">
              Daftar Akun StayEasy
            </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
              Mulai perjalanan menginap Anda dengan penawaran terbaik.
            </p>
</div>
</div>
{/* Registration Form */}
<form className="space-y-4" id="registerForm" onSubmit={handleSubmit}>
{formError && (
<div className="p-3 rounded-lg bg-error-container border border-outline-variant/40 text-on-error-container font-body-sm text-body-sm text-center" role="alert">
            {formError}
          </div>
)}
{/* Field 1: Nama Lengkap */}
<div>
<label className="block font-label-md text-label-md text-on-surface mb-1.5 font-medium" htmlFor="fullName">
              Nama Lengkap
            </label>
<div className={`relative rounded-lg shadow-sm bg-surface-container-low transition-all focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest ${fieldErrors.name ? 'ring-2 ring-error' : ''}`}>
<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
<span className="material-symbols-outlined text-xl">person</span>
</div>
<input className="w-full pl-11 pr-4 py-3 bg-transparent rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" id="fullName" name="fullName" onChange={handleChange} placeholder="contoh: Budi Santoso" required="" type="text" value={form.fullName}/>
</div>
{fieldErrors.name && <p className="mt-1 font-body-sm text-body-sm text-error">{fieldErrors.name}</p>}
</div>
{/* Field 2: Alamat Email */}
<div>
<label className="block font-label-md text-label-md text-on-surface mb-1.5 font-medium" htmlFor="email">
              Alamat Email
            </label>
<div className={`relative rounded-lg shadow-sm bg-surface-container-low transition-all focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest ${fieldErrors.email ? 'ring-2 ring-error' : ''}`}>
<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
<span className="material-symbols-outlined text-xl">mail</span>
</div>
<input className="w-full pl-11 pr-4 py-3 bg-transparent rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" id="email" name="email" onChange={handleChange} placeholder="budi@example.com" required="" type="email" value={form.email}/>
</div>
{fieldErrors.email && <p className="mt-1 font-body-sm text-body-sm text-error">{fieldErrors.email}</p>}
</div>
{/* Field 3: Nomor Telepon / WhatsApp */}
<div>
<label className="block font-label-md text-label-md text-on-surface mb-1.5 font-medium" htmlFor="phone">
              Nomor Telepon / WhatsApp
            </label>
<div className="relative flex rounded-lg shadow-sm bg-surface-container-low transition-all focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest">
<div className="flex items-center gap-1 px-3.5 py-3 rounded-l-lg bg-surface-container-high/60 text-on-surface-variant font-label-md text-label-md select-none">
<span className="w-4 h-3 flex flex-col justify-between overflow-hidden rounded-[2px] shadow-sm">
<span className="h-1.5 bg-[#E70011] w-full block"></span>
<span className="h-1.5 bg-[#FFFFFF] w-full block"></span>
</span>
<span className="font-semibold ml-1">+62</span>
</div>
<input className="w-full px-3.5 py-3 bg-transparent rounded-r-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" id="phone" name="phone" onChange={handleChange} placeholder="812 3456 7890" required="" type="tel" value={form.phone}/>
</div>
{fieldErrors.phone && <p className="mt-1 font-body-sm text-body-sm text-error">{fieldErrors.phone}</p>}
</div>
{/* Field 4: Kata Sandi */}
<div>
<label className="block font-label-md text-label-md text-on-surface mb-1.5 font-medium" htmlFor="password">
              Kata Sandi
            </label>
<div className={`relative rounded-lg shadow-sm bg-surface-container-low transition-all focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest ${fieldErrors.password ? 'ring-2 ring-error' : ''}`}>
<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
<span className="material-symbols-outlined text-xl">lock</span>
</div>
<input className="w-full pl-11 pr-11 py-3 bg-transparent rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" id="password" minlength="8" name="password" onChange={handleChange} placeholder="Minimal 8 karakter" required="" type={showPassword ? 'text' : 'password'} value={form.password}/>
<button aria-label="Toggle password visibility" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer" onClick={() => setShowPassword((s) => !s)} type="button">
<span className="material-symbols-outlined text-xl" id="passwordToggleIcon">{showPassword ? 'visibility_off' : 'visibility'}</span>
</button>
</div>
{fieldErrors.password && <p className="mt-1 font-body-sm text-body-sm text-error">{fieldErrors.password}</p>}
{/* Password Strength meter indicator */}
<div className="mt-1.5 flex items-center gap-1.5 px-0.5">
<div className="h-1 flex-1 rounded-full bg-surface-variant overflow-hidden">
<div className={`h-full transition-all duration-300 ${form.password.length >= 12 ? 'w-full bg-secondary' : form.password.length >= 8 ? 'w-2/3 bg-primary' : 'w-1/3 bg-error'}`} id="strengthBar"></div>
</div>
<span className="font-label-sm text-label-sm text-outline">{form.password.length >= 8 ? 'Kombinasi aman' : 'Terlalu pendek'}</span>
</div>
</div>
{/* Field 5: Konfirmasi Kata Sandi */}
<div>
<label className="block font-label-md text-label-md text-on-surface mb-1.5 font-medium" htmlFor="confirmPassword">
              Konfirmasi Kata Sandi
            </label>
<div className={`relative rounded-lg shadow-sm bg-surface-container-low transition-all focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest ${fieldErrors.confirmPassword ? 'ring-2 ring-error' : ''}`}>
<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
<span className="material-symbols-outlined text-xl">lock_reset</span>
</div>
<input className="w-full pl-11 pr-11 py-3 bg-transparent rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" id="confirmPassword" name="confirmPassword" onChange={handleChange} placeholder="Ulangi kata sandi Anda" required="" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}/>
<button aria-label="Toggle password confirmation visibility" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer" onClick={() => setShowConfirm((s) => !s)} type="button">
<span className="material-symbols-outlined text-xl" id="confirmPasswordToggleIcon">{showConfirm ? 'visibility_off' : 'visibility'}</span>
</button>
</div>
{fieldErrors.confirmPassword && <p className="mt-1 font-body-sm text-body-sm text-error">{fieldErrors.confirmPassword}</p>}
</div>
{/* Terms & Conditions Checkbox */}
<div className="pt-2">
<label className="flex items-start gap-3 cursor-pointer group select-none">
<div className="relative flex items-center mt-0.5">
<input checked={agreeTerms} className="peer h-5 w-5 cursor-pointer appearance-none rounded bg-surface-container-high transition-all checked:bg-primary checked:border-transparent focus:outline-none" id="agreeTerms" onChange={(e) => setAgreeTerms(e.target.checked)} required="" type="checkbox"/>
<span className="material-symbols-outlined absolute text-base text-on-primary opacity-0 pointer-events-none peer-checked:opacity-100 transition-opacity left-0.5">
                  check
                </span>
</div>

</label>
</div>
{/* CTA Button: Coral (#D85A30) */}
<div className="pt-3">
<button className="w-full py-3.5 px-6 rounded-xl bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-headline-sm text-headline-sm font-semibold tracking-wide shadow-lg shadow-secondary/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60" disabled={submitting} type="submit">
{submitting ? (
<span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
) : (
<>
<span>Daftar Sekarang</span>
<span className="material-symbols-outlined text-xl">arrow_forward</span>
</>
)}
</button>
</div>
</form>
{/* Bottom Redirect: Masuk di sini */}
<div className="mt-8 text-center">
<p className="font-body-md text-body-md text-on-surface-variant">
            Sudah punya akun?
            <Link className="font-semibold text-primary hover:underline ml-1 inline-flex items-center gap-0.5 group" to="/login">
<span>Masuk di sini</span>
<span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">chevron_right</span>
</Link>
</p>
</div>
{/* Trust / Security Footnote */}
<div className="mt-8 pt-4 flex items-center justify-center gap-2 text-outline font-label-sm text-label-sm">
<span className="material-symbols-outlined text-sm">lock</span>
<span>Enkripsi 256-bit bank grade data privasi terjaga</span>
</div>
</div>
</div>
</div>
</div>
</main>
    </>
  );
}
