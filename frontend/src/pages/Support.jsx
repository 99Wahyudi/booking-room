import React, { useState } from 'react';
import Icon from '../components/ui/Icon.jsx';

const faqs = [
  { q: 'Bagaimana cara memesan kamar?', a: 'Cari dan pilih kamar di halaman pencarian, isi tanggal kunjungan, lalu klik Pesan Kamar Ini. Pesanan Anda akan menunggu konfirmasi admin.' },
  { q: 'Apakah bisa membatalkan pemesanan?', a: 'Ya. Pemesanan berstatus menunggu atau terkonfirmasi dapat dibatalkan dari halaman Booking Saya dengan menyertakan alasan pembatalan.' },
  { q: 'Apakah pembayaran dilakukan di muka?', a: 'Tidak. Pembayaran dilakukan langsung di hotel saat check-in, sesuai kebijakan properti yang Anda pilih.' },
  { q: 'Bagaimana cara menemukan penawaran terbaik?', a: 'Bandingkan harga di halaman pencarian kamar. Gunakan filter tipe kamar, fasilitas, dan batas harga maksimal untuk menemukan kamar yang paling sesuai anggaran Anda.' },
  { q: 'Bagaimana status pemesanan saya?', a: 'Pantau status lewat menu Booking Saya. Status mengalir dari menunggu konfirmasi, terkonfirmasi, hingga selesai setelah masa menginap berakhir.' },
];

export default function Support() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? faqs.filter((f) => (f.q + f.a).toLowerCase().includes(q)) : faqs;

  return (
    <div className="max-w-3xl mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">
      <div className="text-center mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Pusat Bantuan</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Jawaban cepat untuk pertanyaan Anda. Tim kami siap membantu 24/7.
        </p>
      </div>

      <div className="relative mb-8">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"><Icon name="search" size={22} /></span>
        <input placeholder="Cari bantuan..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-14 pl-12 pr-4 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md border border-[#E5E3DC] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-sm" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {[
          { icon: 'support_agent', title: 'Live Chat', sub: 'Masuk chat dengan agen sigap' },
          { icon: 'call', title: 'Telepon', sub: '+62 812-3456-7890' },
          { icon: 'mail', title: 'Email', sub: 'support@stayeasy.id' },
          { icon: 'help', title: 'FAQ', sub: 'Pertanyaan yang sering ditanyakan' },
        ].map((c) => (
          <div key={c.title} className="bg-surface-container-lowest rounded-xl border border-[#E5E3DC] p-5 flex items-center gap-4 hover:shadow-tier2 transition-shadow">
            <span className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0"><Icon name={c.icon} size={24} /></span>
            <div>
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">{c.title}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-4">Pertanyaan Umum</h2>
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Tidak ada pertanyaan yang cocok dengan pencarian Anda.</p>
        )}
        {filtered.map((f) => (
          <details key={f.q} className="group bg-white rounded-xl border border-[#E5E3DC] overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-label-md text-label-md text-on-surface font-semibold list-none">
              {f.q}
              <Icon name="expand_more" size={20} className="group-open:rotate-180 transition-transform text-on-surface-variant" />
            </summary>
            <p className="px-5 pb-4 font-body-sm text-body-sm text-on-surface-variant">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}