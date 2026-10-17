import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import * as adminRoomService from '../../services/adminRoomService';
import * as adminMasterService from '../../services/adminMasterService';
import { resolveImageUrl } from '../../lib/apiClient';
import Icon from '../../components/ui/Icon';

export default function KelolaKamar() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    sort: 'newest',
  });
  const debounceRef = useRef(null);

  const fetchRooms = useCallback(async (page = 1, limit = 12) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.type !== 'all') params.room_type_id = filters.type;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.sort !== 'newest') params.sort = filters.sort;

      const result = await adminRoomService.getRooms(params);
      setRooms(result.rooms || []);
      setTotalRooms(result.total || 0);
      setTotalPages(Math.max(1, Math.ceil((result.total || 0) / limit)));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar kamar.');
    } finally {
      setIsLoading(false);
    }
  }, [filters.search, filters.type, filters.status, filters.sort]);

  useEffect(() => {
    adminMasterService
      .getRoomTypes()
      .then((data) => setRoomTypes(Array.isArray(data) ? data : []))
      .catch(() => setRoomTypes([]));
  }, []);

  useEffect(() => {
    fetchRooms(1);
  }, [fetchRooms]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchRooms(page);
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Hapus kamar "${room.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await adminRoomService.deleteRoom(room.id);
      toast.success(`Kamar "${room.name}" berhasil dihapus.`);
      fetchRooms(currentPage);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kamar.');
    }
  };

  const handleEditRoom = (roomId) => {
    navigate(`/admin/rooms/${roomId}/edit`);
  };

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      {/* Breadcrumbs & Page Title */}
      <section data-purpose="page-heading">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-primary uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span>Ringkasan Operasional Properti</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">Inventaris Kamar</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Kelola Kamar</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Kelola data unit kamar, status ketersediaan, tipe, dan harga per malam StayEasy.
            </p>
          </div>
          {/* Add Room Primary CTA */}
          <button
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#d85a30] hover:bg-[#be4e28] text-white font-semibold text-sm shadow-lg shadow-[#d85a30]/20 hover:shadow-[#d85a30]/30 transition-all active:scale-[0.98]"
            onClick={() => navigate('/admin/rooms/new')}
            type="button"
          >
            <Icon name="add" size={20} />
            <span>+ Tambah Kamar Baru</span>
          </button>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section
        className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm"
        data-purpose="filter-toolbar"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Keyword Search */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <Icon name="search" size={18} />
              </span>
              <input
                className="w-full pl-10 pr-3 py-2 text-sm border border-outline-variant/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline bg-surface-container-low/50"
                placeholder="Cari nomor kamar, nama kamar, tipe..."
                onChange={(e) => handleSearchChange(e.target.value)}
                type="text"
                value={filters.search}
              />
            </div>
            {/* Room Type Filter */}
            <select
              aria-label="Filter Tipe Kamar"
              className="text-sm border border-outline-variant/60 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary focus:border-primary text-on-surface bg-surface-container-lowest"
              onChange={(e) => handleFilterChange('type', e.target.value)}
              value={filters.type}
            >
              <option value="all">Semua Tipe Kamar</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={String(rt.id)}>
                  {rt.name}
                </option>
              ))}
            </select>
            {/* Status Filter */}
            <select
              aria-label="Filter Status"
              className="text-sm border border-outline-variant/60 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary focus:border-primary text-on-surface bg-surface-container-lowest"
              onChange={(e) => handleFilterChange('status', e.target.value)}
              value={filters.status}
            >
              <option value="all">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Nonaktif</option>
            </select>
            {/* Sorting Filter */}
            <select
              aria-label="Urutkan"
              className="text-sm border border-outline-variant/60 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary focus:border-primary text-on-surface bg-surface-container-lowest"
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              value={filters.sort}
            >
              <option value="newest">Urutkan: Kamar Terbaru</option>
              <option value="room_asc">Nomor Kamar (A-Z)</option>
              <option value="price_low">Harga: Rendah ke Tinggi</option>
              <option value="price_high">Harga: Tinggi ke Rendah</option>
            </select>
          </div>
          {/* Counter Info */}
          <div className="text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3.5 py-2 rounded-lg border border-outline-variant/40">
            Menampilkan <span className="text-on-surface font-bold">{rooms.length}</span> dari{' '}
            <span className="text-on-surface font-bold">{totalRooms}</span> unit kamar
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-purpose="room-grid">
        {isLoading && (
          <React.Fragment>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <article
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden animate-pulse"
                key={n}
              >
                <div className="h-48 w-full bg-surface-container-highest"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 w-2/3 bg-surface-container-highest rounded"></div>
                  <div className="h-3 w-1/2 bg-surface-container-highest rounded"></div>
                  <div className="h-8 w-1/3 bg-surface-container-highest rounded"></div>
                </div>
              </article>
            ))}
          </React.Fragment>
        )}
        {!isLoading && !error && rooms.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Icon name="meeting_room" size={48} className="text-outline-variant" />
            <p className="mt-3 text-sm text-on-surface-variant">
              Belum ada kamar. Klik "Tambah Kamar Baru" untuk membuat unit pertama.
            </p>
          </div>
        )}
        {!isLoading && error && (
          <div className="col-span-full text-center py-12">
            <p className="text-sm text-error">{error}</p>
            <button
              className="mt-3 px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold"
              onClick={() => fetchRooms(1)}
              type="button"
            >
              Coba Lagi
            </button>
          </div>
        )}
        {!isLoading && !error && rooms.map((room) => {
          const primaryPhoto = room.photos?.find((p) => p.is_primary) || room.photos?.[0];
          const photoUrl = resolveImageUrl(primaryPhoto?.url) || '/img/placeholder.svg';
          const statusMap = {
            available: ['bg-primary-fixed text-on-primary-fixed border-primary-fixed', 'Check', 'Tersedia'],
            maintenance: ['bg-amber-100 text-amber-800 border-amber-200', 'build', 'Perawatan'],
            inactive: ['bg-surface-container-high text-on-surface-variant border-outline-variant', 'block', 'Tidak Aktif'],
          };
          const [badgeClass, dotIcon, statusLabel] = statusMap[room.status] || statusMap.available;
          return (
            <article
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col hover:shadow-tier2 hover:border-primary/30 transition-all"
              key={room.id}
            >
              <div className="relative h-48 w-full bg-surface-container-low overflow-hidden">
                <img alt={room.name} className="w-full h-full object-cover" src={photoUrl} />
                <span
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1.5 ${badgeClass}`}
                >
                  <Icon name={dotIcon} size={14} />
                  {statusLabel}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-on-surface leading-tight">{room.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {room.room_type?.name || 'Kamar'} • Kapasitas {room.capacity} orang
                    </p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2">{room.description}</p>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-outline-variant/30">
                  <div>
                    <p className="text-[10px] text-outline uppercase tracking-wide font-semibold">
                      Harga / malam
                    </p>
                    <p className="text-lg font-bold text-secondary">
                      Rp {Number(room.price_per_night).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 rounded-lg text-xs font-bold text-on-surface bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 transition-colors"
                      onClick={() => handleEditRoom(room.id)}
                      type="button"
                    >
                      <span className="flex items-center gap-1">
                        <Icon name="edit" size={14} /> Edit
                      </span>
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg text-xs font-bold text-error bg-error/5 hover:bg-error/10 border border-error/20 transition-colors"
                      onClick={() => handleDelete(room)}
                      type="button"
                    >
                      <span className="flex items-center gap-1">
                        <Icon name="delete" size={14} /> Hapus
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Pagination */}
      <nav
        aria-label="Navigasi Halaman"
        className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2"
      >
        <p className="text-xs font-medium text-on-surface-variant">
          Menampilkan{' '}
          <span className="font-semibold text-on-surface">
            {totalRooms === 0 ? 0 : (currentPage - 1) * 12 + 1}
          </span>{' '}
          sampai{' '}
          <span className="font-semibold text-on-surface">
            {Math.min(currentPage * 12, totalRooms)}
          </span>{' '}
          dari <span className="font-semibold text-on-surface">{totalRooms}</span> unit kamar
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs">
          <button
            className={`px-3.5 py-2 rounded-lg border font-medium transition-colors text-xs flex items-center gap-1 ${
              currentPage === 1
                ? 'border-outline-variant bg-surface-container-lowest text-outline cursor-not-allowed'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            type="button"
          >
            <Icon name="chevron_left" size={14} />
            Sebelumnya
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`w-9 h-9 rounded-lg font-bold shadow-sm transition-colors text-xs ${
                page === currentPage
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
              onClick={() => handlePageChange(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button
            className={`px-3.5 py-2 rounded-lg border font-medium transition-colors text-xs flex items-center gap-1 ${
              currentPage === totalPages
                ? 'border-outline-variant bg-surface-container-lowest text-outline cursor-not-allowed'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            type="button"
          >
            Selanjutnya
            <Icon name="chevron_right" size={14} />
          </button>
        </div>
      </nav>
    </main>
  );
}