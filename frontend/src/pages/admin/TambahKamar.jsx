import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import * as adminRoomService from '../../services/adminRoomService';
import * as adminMasterService from '../../services/adminMasterService';
import Icon from '../../components/ui/Icon';

export default function TambahKamar() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    room_type_id: '',
    price_per_night: '',
    capacity: 2,
    status: 'available',
    description: '',
  });
  const [facilities, setFacilities] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState([]);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    adminMasterService
      .getFacilities()
      .then((data) => setFacilities(data || []))
      .catch(() => setFacilities([]));
    adminMasterService
      .getRoomTypes()
      .then((data) => setRoomTypes(data || []))
      .catch(() => setRoomTypes([]));
  }, []);

  const toggleFacility = (id) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    try {
      const room = await adminRoomService.createRoom({
        name: form.name,
        room_type_id: form.room_type_id ? Number(form.room_type_id) : null,
        price_per_night: Number(String(form.price_per_night).replace(/[^0-9]/g, '')),
        capacity: Number(form.capacity),
        status: form.status,
        description: form.description,
        facility_ids: selectedFacilityIds,
      });
      if (files.length > 0 && room?.id) {
        try {
          await adminRoomService.uploadRoomPhotos(room.id, files);
        } catch (uploadErr) {
          toast.error('Kamar tersimpan, namun upload foto gagal. Coba unggah ulang dari menu edit.');
          navigate('/admin/rooms');
          return;
        }
      }
      toast.success('Kamar baru berhasil dibuat!');
      navigate('/admin/rooms');
    } catch (err) {
      setFieldErrors(err.errors || {});
      toast.error(err.message || 'Gagal membuat kamar baru.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 text-sm bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition';
  const selectClass =
    'w-full appearance-none px-4 py-2.5 text-sm bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition';
  const labelClass = 'block text-xs font-bold text-on-surface uppercase tracking-wider mb-2';

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      {/* Breadcrumbs & Mode Badge */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
          <button
            className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-semibold transition"
            onClick={() => navigate('/admin/rooms')}
            type="button"
          >
            <Icon name="arrow_back" size={16} />
            Kembali ke Kelola Kamar
          </button>
          <span className="text-outline-variant">/</span>
          <span>Inventaris Kamar</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-bold">Tambah Kamar Baru</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-fixed/40 text-on-primary-fixed-variant">
          <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse"></span>
          Mode: Formulir Tambah Unit Baru
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Tambah Kamar Baru</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-3xl">
          Isi detail informasi unit kamar, fasilitas, galeri foto, dan tarif reservasi harian
          StayEasy. Pastikan seluruh spesifikasi unit lengkap dan akurat sebelum dipublikasikan.
        </p>
      </div>

      {/* Main Form Card */}
      <form
        className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 overflow-hidden"
        data-purpose="room-creation-form"
        onSubmit={handleSubmit}
      >
        <div className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: Basic Information & Pricing */}
          <div className="lg:col-span-6 space-y-6" data-purpose="basic-info-and-rates">
            <div className="border-b border-outline-variant/30 pb-3 mb-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center font-bold text-xs">
                  1
                </span>
                Informasi Unit & Tarif Dasar
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Identitas fisik kamar, klasifikasi kategori, dan harga sewa harian.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="room_name">
                Nama / Nomor Kamar <span className="text-error">*</span>
              </label>
              <input
                className={inputClass}
                id="room_name"
                name="room_name"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Deluxe Ocean Balcony - Room 204 atau Kamar R-204"
                required=""
                type="text"
                value={form.name}
              />
              {fieldErrors.name && <p className="text-xs text-error mt-1.5">{fieldErrors.name}</p>}
              <p className="text-[11px] text-outline mt-1.5">
                Gunakan penamaan yang memudahkan operasional housekeeping dan tamu.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="room_type">
                Tipe Kamar <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  className={selectClass}
                  id="room_type"
                  name="room_type"
                  onChange={(e) => setForm((f) => ({ ...f, room_type_id: e.target.value }))}
                  required=""
                  value={form.room_type_id}
                >
                  <option disabled="" value="">
                    Pilih tipe kamar
                  </option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  size={18}
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-outline"
                />
              </div>
              {fieldErrors.room_type_id && (
                <p className="text-xs text-error mt-1.5">{fieldErrors.room_type_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="room_capacity">
                  Kapasitas Tamu <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-24`}
                    id="room_capacity"
                    max="10"
                    min="1"
                    name="room_capacity"
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    type="number"
                    value={form.capacity}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-outline font-medium">
                    Orang / Tamu
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="room_area">
                  Luas Kamar (m²)
                </label>
                <div className="relative">
                  <input className={`${inputClass} pr-14`} id="room_area" name="room_area" placeholder="Contoh: 36" type="text" value="36" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-outline font-medium">
                    m²
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="room_price">
                Harga per Malam <span className="text-error">*</span>
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-outline font-bold text-sm">Rp</span>
                </div>
                <input
                  className={`${inputClass} pl-11 pr-20 font-semibold`}
                  id="room_price"
                  name="room_price"
                  onChange={(e) => setForm((f) => ({ ...f, price_per_night: e.target.value }))}
                  placeholder="1.350.000"
                  required=""
                  type="text"
                  value={form.price_per_night}
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <span className="text-outline text-xs font-medium">/ malam</span>
                </div>
              </div>
              {fieldErrors.price_per_night && (
                <p className="text-xs text-error mt-1.5">{fieldErrors.price_per_night}</p>
              )}
              <p className="text-[11px] text-outline mt-1.5 flex items-center gap-1">
                <Icon name="info" size={14} />
                Tarif dasar sebelum pajak & biaya layanan tambahan.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="room_status">
                Status Kamar <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  className={`${selectClass} pl-9 pr-8`}
                  id="room_status"
                  name="room_status"
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  value={form.status}
                >
                  <option value="available">Tersedia (Siap Huni)</option>
                  <option value="maintenance">Maintenance (Perbaikan)</option>
                  <option value="inactive">Nonaktif (Tidak Dijual)</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                </div>
                <Icon
                  name="expand_more"
                  size={18}
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-outline"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="room_description">
                Deskripsi Kamar
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                id="room_description"
                name="room_description"
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Jelaskan suasana kamar, pemandangan jendela, kasur tidur, serta kenyamanan utama yang ditawarkan untuk tamu..."
                rows="4"
                value={form.description}
              ></textarea>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-outline">
                  Tersedia fitur multilanguage otomatis pada sistem reservasi.
                </span>
                <span className="text-[11px] text-outline font-mono">
                  {form.description.length} / 600 karakter
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Photo Gallery & Amenities */}
          <div className="lg:col-span-6 space-y-7" data-purpose="gallery-and-amenities">
            <div className="border-b border-outline-variant/30 pb-3 mb-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center font-bold text-xs">
                  2
                </span>
                Galeri Foto & Fasilitas Unit
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Unggah dokumentasi interior unit dan pilih fasilitas yang tersedia.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Foto Galeri Kamar <span className="text-error">*</span>
                </label>
                <span className="text-[11px] text-outline">Maks. 5MB / file (JPG, PNG)</span>
              </div>
              {/* Gallery Grid + Dropzone */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
                {/* Dropzone */}
                <div
                  className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl aspect-[4/3] bg-surface-container/50 hover:bg-primary-fixed/10 transition flex flex-col items-center justify-center cursor-pointer p-4 text-center group"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex="0"
                >
                  <input
                    accept="image/jpeg,image/png"
                    className="hidden"
                    multiple=""
                    onChange={handleFiles}
                    ref={fileInputRef}
                    type="file"
                  />
                  {files.length > 0 ? (
                    <span className="text-xs font-bold text-primary">{files.length} file dipilih</span>
                  ) : (
                    <React.Fragment>
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/60 flex items-center justify-center text-outline group-hover:text-primary group-hover:scale-110 transition shadow-sm mb-2">
                        <Icon name="add" size={20} />
                      </div>
                      <span className="text-xs font-bold text-on-surface group-hover:text-primary">
                        + Tambah Foto
                      </span>
                      <p className="text-[10px] text-outline mt-1 leading-tight">
                        Drag & drop atau klik telusuri
                      </p>
                    </React.Fragment>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-outline mt-2">
                Disarankan mengunggah minimal 3 foto dengan resolusi tinggi (1920x1080px).
              </p>
            </div>

            {/* Facilities Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Fasilitas Kamar <span className="text-error">*</span>
                </label>
                <span className="text-[11px] text-primary font-semibold cursor-pointer hover:underline" onClick={() => setSelectedFacilityIds((prev) => (prev.length === facilities.length ? [] : facilities.map((f) => f.id)))}>
                  Pilih Semua
                </span>
              </div>
              <p className="text-xs text-outline mb-3">
                Centang fasilitas yang tersedia di dalam unit kamar ini:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {facilities.length === 0 && <p className="text-xs text-outline">Memuat fasilitas...</p>}
                {facilities.map((f) => (
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition select-none ${
                      selectedFacilityIds.includes(f.id)
                        ? 'border-primary/40 bg-primary-fixed/20 hover:bg-primary-fixed/30'
                        : 'border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container'
                    }`}
                    key={f.id}
                  >
                    <input
                      checked={selectedFacilityIds.includes(f.id)}
                      className="w-4 h-4 accent-[#0f6e56]"
                      onChange={() => toggleFacility(f.id)}
                      type="checkbox"
                    />
                    <div className="flex items-center gap-2">
                      <Icon name={f.icon || 'check'} size={18} className="text-primary" />
                      <span className="text-xs font-medium text-on-surface">{f.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="bg-surface-container/60 px-8 lg:px-10 py-5 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-4" data-purpose="form-actions-footer">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Icon name="check_circle" size={16} className="text-primary" />
            <span>
              Formulir siap dikirim — pastikan data sudah lengkap sebelum dipublikasikan.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface text-sm font-semibold transition shadow-sm"
              onClick={() => navigate('/admin/rooms')}
              type="button"
            >
              Batal
            </button>
            <button
              className="px-6 py-2.5 rounded-lg bg-[#d85a30] hover:bg-[#bf4922] text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95 disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <Icon name="progress_activity" size={18} className="animate-spin" />
              ) : (
                <Icon name="check" size={18} />
              )}
              <span>{submitting ? 'Menyimpan...' : 'Simpan & Publikasikan Kamar'}</span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}