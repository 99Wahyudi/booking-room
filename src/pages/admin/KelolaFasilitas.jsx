import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import * as adminMasterService from '../../services/adminMasterService';
import * as adminRoomService from '../../services/adminRoomService';
import Icon from '../../components/ui/Icon';

const ICON_PRESETS = [
  'wifi',
  'ac_unit',
  'tv',
  'bathtub',
  'restaurant',
  'pool',
  'local_parking',
  'fitness_center',
  'local_laundry_service',
  'workspace_premium',
  'king_bed',
  'hot_tub',
];

const MAX_NAME = 100;

export default function KelolaFasilitas() {
  const toast = useToast();
  const [facilities, setFacilities] = useState([]);
  const [usage, setUsage] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal state: { mode: 'create' | 'edit', id, name, icon }
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '' });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await adminMasterService.getFacilities();
      setFacilities(Array.isArray(list) ? list : []);

      // Hitung pemakaian fasilitas per kamar (untuk indikator & konfirmasi hapus)
      try {
        const result = await adminRoomService.getRooms({ page: 1, limit: 100 });
        const counts = {};
        (result.rooms || []).forEach((room) => {
          (room.facilities || []).forEach((f) => {
            counts[f.id] = (counts[f.id] || 0) + 1;
          });
        });
        setUsage(counts);
      } catch {
        setUsage({});
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar fasilitas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = facilities.filter((f) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return f.name.toLowerCase().includes(q) || (f.icon || '').toLowerCase().includes(q);
  });

  const totalUsage = Object.values(usage).reduce((a, b) => a + b, 0);
  const unusedCount = facilities.filter((f) => !usage[f.id]).length;

  const openCreate = () => {
    setForm({ name: '', icon: '' });
    setFieldErrors({});
    setModal({ mode: 'create' });
  };

  const openEdit = (facility) => {
    setForm({ name: facility.name, icon: facility.icon || '' });
    setFieldErrors({});
    setModal({ mode: 'edit', id: facility.id });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const errors = {};
    if (!name) errors.name = 'Nama fasilitas wajib diisi.';
    else if (name.length > MAX_NAME) errors.name = `Maksimal ${MAX_NAME} karakter.`;
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      const payload = { name, icon: form.icon.trim() };
      if (modal.mode === 'create') {
        await adminMasterService.createFacility(payload);
        toast.success(`Fasilitas "${name}" berhasil ditambahkan.`);
      } else {
        await adminMasterService.updateFacility(modal.id, payload);
        toast.success(`Fasilitas "${name}" berhasil diperbarui.`);
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      setFieldErrors(err.errors || {});
      toast.error(err.message || 'Gagal menyimpan fasilitas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (facility) => {
    const used = usage[facility.id] || 0;
    const message =
      used > 0
        ? `Hapus fasilitas "${facility.name}"? Fasilitas ini terpasang di ${used} kamar dan akan dilepas dari semua kamar tersebut.`
        : `Hapus fasilitas "${facility.name}"? Tindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(message)) return;
    try {
      await adminMasterService.deleteFacility(facility.id);
      toast.success(`Fasilitas "${facility.name}" berhasil dihapus.`);
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus fasilitas.');
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 text-sm bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition';
  const labelClass = 'block text-xs font-bold text-on-surface uppercase tracking-wider mb-2';

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      {/* Breadcrumbs & Page Title */}
      <section data-purpose="page-heading">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-primary uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span>Ringkasan Operasional Properti</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">Master Fasilitas</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Kelola Fasilitas</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Kelola daftar fasilitas kamar StayEasy (WiFi, AC, TV, dll.) yang digunakan pada
              formulir kamar dan pencarian tamu.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#d85a30] hover:bg-[#be4e28] text-white font-semibold text-sm shadow-lg shadow-[#d85a30]/20 hover:shadow-[#d85a30]/30 transition-all active:scale-[0.98]"
            onClick={openCreate}
            type="button"
          >
            <Icon name="add" size={20} />
            <span>+ Tambah Fasilitas</span>
          </button>
        </div>
      </section>

      {/* Stats & Search Toolbar */}
      <section
        className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm"
        data-purpose="filter-toolbar"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <Icon name="search" size={18} />
              </span>
              <input
                className="w-full pl-10 pr-3 py-2 text-sm border border-outline-variant/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline bg-surface-container-low/50"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama fasilitas..."
                type="text"
                value={search}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant">
                Total <span className="text-on-surface font-bold">{facilities.length}</span> fasilitas
              </span>
              <span className="bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant">
                Terpasang <span className="text-on-surface font-bold">{totalUsage}</span> kali di kamar
              </span>
              <span className="bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant">
                <span className="text-on-surface font-bold">{unusedCount}</span> belum dipakai
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" data-purpose="facility-grid">
        {isLoading && (
          <React.Fragment>
            {[1, 2, 3, 4].map((n) => (
              <article
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-5 animate-pulse"
                key={n}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-highest"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-surface-container-highest rounded"></div>
                    <div className="h-3 w-1/3 bg-surface-container-highest rounded"></div>
                  </div>
                </div>
                <div className="h-8 mt-4 bg-surface-container-highest rounded"></div>
              </article>
            ))}
          </React.Fragment>
        )}

        {!isLoading && error && (
          <div className="col-span-full text-center py-12">
            <p className="text-sm text-error">{error}</p>
            <button
              className="mt-3 px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold"
              onClick={fetchAll}
              type="button"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Icon name="category" size={48} className="text-outline-variant" />
            <p className="mt-3 text-sm text-on-surface-variant">
              {search ? 'Tidak ada fasilitas yang cocok dengan pencarian.' : 'Belum ada fasilitas. Klik "Tambah Fasilitas" untuk membuat yang pertama.'}
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          filtered.map((facility) => {
            const used = usage[facility.id] || 0;
            return (
              <article
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-5 flex flex-col gap-4 hover:shadow-tier2 hover:border-primary/30 transition-all"
                key={facility.id}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center border border-primary-fixed">
                    <Icon name={facility.icon || 'category'} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-on-surface leading-tight truncate" title={facility.name}>
                      {facility.name}
                    </h3>
                    <p className="text-[11px] text-outline mt-0.5 font-mono truncate">
                      #{facility.id} • {facility.icon || 'tanpa ikon'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
                      used > 0
                        ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed'
                        : 'bg-surface-container-high text-on-surface-variant border-outline-variant'
                    }`}
                  >
                    <Icon name={used > 0 ? 'check_circle' : 'remove_circle'} size={13} />
                    {used > 0 ? `Dipakai ${used} kamar` : 'Belum dipakai'}
                  </span>
                  <span className="text-outline">
                    {facility.created_at
                      ? new Date(facility.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>

                <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-center gap-2">
                  <button
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-on-surface bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 transition-colors inline-flex items-center justify-center gap-1.5"
                    onClick={() => openEdit(facility)}
                    type="button"
                  >
                    <Icon name="edit" size={14} /> Edit
                  </button>
                  <button
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-error bg-error/5 hover:bg-error/10 border border-error/20 transition-colors inline-flex items-center justify-center gap-1.5"
                    onClick={() => handleDelete(facility)}
                    type="button"
                  >
                    <Icon name="delete" size={14} /> Hapus
                  </button>
                </div>
              </article>
            );
          })}
      </section>

      {/* Info Card */}
      <div className="p-4 bg-surface-container rounded-xl flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="info" size={16} />
        </div>
        <div className="text-xs">
          <p className="font-bold text-on-surface">Catatan Penggunaan Fasilitas</p>
          <p className="text-on-surface-variant mt-0.5">
            Fasilitas yang dihapus akan otomatis dilepas dari seluruh kamar terkait (relasi
            many-to-many dihapus, kamar tetap aman). Field <strong className="text-on-surface">ikon</strong>{' '}
            memakai nama Material Symbols (mis. <code>wifi</code>, <code>ac_unit</code>,
            <code> bathtub</code>) dan ditampilkan langsung sebagai ikon di seluruh halaman.
          </p>
        </div>
      </div>

      {/* Modal Create / Edit */}
      {modal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
          <form
            className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-tier3 overflow-hidden"
            onSubmit={handleSubmit}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center">
                  <Icon name={modal.mode === 'create' ? 'add' : 'edit'} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    {modal.mode === 'create' ? 'Tambah Fasilitas' : 'Edit Fasilitas'}
                  </h2>
                  <p className="text-[11px] text-outline">
                    {modal.mode === 'create'
                      ? 'Fasilitas baru untuk daftar kamar'
                      : `Perbarui fasilitas #${modal.id}`}
                  </p>
                </div>
              </div>
              <button
                aria-label="Tutup"
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                onClick={closeModal}
                type="button"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className={labelClass} htmlFor="facility_name">
                  Nama Fasilitas <span className="text-error">*</span>
                </label>
                <input
                  autoFocus
                  className={inputClass}
                  id="facility_name"
                  maxLength={MAX_NAME}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Kolam Renang Outdoor"
                  type="text"
                  value={form.name}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[11px] text-error">{fieldErrors.name || ''}</span>
                  <span className="text-[11px] text-outline font-mono">
                    {form.name.length} / {MAX_NAME}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="facility_icon">
                  Ikon (Material Symbols)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center border border-primary-fixed">
                    <Icon name={form.icon.trim() || 'category'} size={22} />
                  </div>
                  <input
                    className={`${inputClass} font-mono`}
                    id="facility_icon"
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="wifi"
                    type="text"
                    value={form.icon}
                  />
                </div>
                {fieldErrors.icon && <p className="text-[11px] text-error mt-1.5">{fieldErrors.icon}</p>}
                <p className="text-[11px] text-outline mt-1.5">
                  Kosongkan untuk memakai ikon default. Klik salah satu rekomendasi:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ICON_PRESETS.map((name) => (
                    <button
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors inline-flex items-center gap-1 ${
                        form.icon.trim() === name
                          ? 'border-primary bg-primary-fixed/30 text-primary'
                          : 'border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                      }`}
                      key={name}
                      onClick={() => setForm((f) => ({ ...f, icon: name }))}
                      type="button"
                    >
                      <Icon name={name} size={14} />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-surface-container/60 border-t border-outline-variant/30 flex justify-end gap-3">
              <button
                className="px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface text-sm font-semibold transition shadow-sm"
                disabled={submitting}
                onClick={closeModal}
                type="button"
              >
                Batal
              </button>
              <button
                className="px-5 py-2.5 rounded-lg bg-[#d85a30] hover:bg-[#bf4922] text-white text-sm font-bold shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? (
                  <Icon name="progress_activity" size={18} className="animate-spin" />
                ) : (
                  <Icon name="check" size={18} />
                )}
                <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
