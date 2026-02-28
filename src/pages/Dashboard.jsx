// src/pages/Dashboard.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { StatCard } from '../components/ui/Toast';
import { SPBadge, ChannelBadge } from '../components/ui/Badge';
import { today } from '../utils/formatters';

export default function Dashboard() {
  const navigate      = useNavigate();
  const currentUser   = useStore((s) => s.currentUser);
  const profile       = useStore((s) => s.profile);
  const produk        = useStore((s) => s.produk);
  const stokBatch     = useStore((s) => s.stokBatch);
  const gudangBB      = useStore((s) => s.gudangBB);
  const suratPesanan  = useStore((s) => s.suratPesanan);
  const penerimaan    = useStore((s) => s.penerimaan);
  const orderPenjualan = useStore((s) => s.orderPenjualan);
  const auditTrail    = useStore((s) => s.auditTrail);

  // Kalkulasi stats
  const stats = useMemo(() => {
    const rollTersedia = gudangBB.filter((r) => r.status === 'Tersedia').length;
    const totStok = produk.reduce((acc, p) => {
      const stok = stokBatch.filter((b) => b.sku === p.sku && b.sisa > 0).reduce((a, b) => a + b.sisa, 0);
      return acc + stok;
    }, 0);
    const spAktif = suratPesanan.filter((s) => s.status !== 'Selesai').length;
    const mnQC    = penerimaan.filter((p) => p.status === 'Menunggu QC').length;
    return { rollTersedia, totStok, spAktif, mnQC };
  }, [gudangBB, produk, stokBatch, suratPesanan, penerimaan]);

  // Chart channel
  const channelData = useMemo(() => {
    const sh = orderPenjualan.filter((o) => o.channel === 'Shopee').reduce((a, b) => a + b.totalPcs, 0);
    const tk = orderPenjualan.filter((o) => o.channel === 'TikTok').reduce((a, b) => a + b.totalPcs, 0);
    const of = orderPenjualan.filter((o) => o.channel === 'Offline').reduce((a, b) => a + b.totalPcs, 0);
    const mx = Math.max(sh, tk, of, 1);
    return [
      { label: 'Shopee',  value: sh, color: '#ef4444', pct: Math.round(sh / mx * 100) },
      { label: 'TikTok',  value: tk, color: '#0ea5e9', pct: Math.round(tk / mx * 100) },
      { label: 'Offline', value: of, color: '#10b981', pct: Math.round(of / mx * 100) },
    ];
  }, [orderPenjualan]);

  // SP aktif (max 5)
  const spAktif = suratPesanan.filter((s) => s.status !== 'Selesai').slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Selamat Datang, {currentUser?.username}! 👋
          </h2>
          <p className="text-[12px] text-gray-400 mt-1">
            {today()} · {profile.name}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Stok Bahan Baku"  value={stats.rollTersedia} sub="roll tersedia"    color="blue"   icon="🧵" />
        <StatCard label="Stok Produk Jadi" value={stats.totStok.toLocaleString()} sub="pcs tersedia" color="green"  icon="📦" />
        <StatCard label="SP Aktif"         value={stats.spAktif}      sub="sedang berjalan"  color="yellow" icon="📋" />
        <StatCard label="Menunggu QC"      value={stats.mnQC}         sub="dari vendor"      color="red"    icon="✅" />
      </div>

      {/* Grid bawah */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Chart channel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-4">
            Performa Channel
          </p>
          {orderPenjualan.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <span className="text-3xl mb-2">📊</span>
              <span className="text-[12px]">Belum ada penjualan</span>
            </div>
          ) : (
            <div className="space-y-3">
              {channelData.map((ch) => (
                <div key={ch.label} className="flex items-center gap-3">
                  <span className="text-[12px] font-600 w-16 flex-shrink-0 text-gray-700">{ch.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${ch.pct}%`, background: ch.color }}
                    />
                  </div>
                  <span className="text-[12px] font-700 w-12 text-right" style={{ color: ch.color }}>
                    {ch.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aktivitas terkini */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-3">
            Aktivitas Terkini
          </p>
          <div className="space-y-0 max-h-52 overflow-y-auto">
            {auditTrail.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-gray-300">Belum ada aktivitas</div>
            ) : (
              auditTrail.slice(0, 8).map((a) => (
                <div key={a.id} className="flex gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-500 text-gray-700">{a.action}</p>
                    <p className="text-[11px] text-gray-400">{a.detail} · {a.waktu} · {a.user}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SP Aktif */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">SP Aktif</p>
          <button
            onClick={() => navigate('/sp')}
            className="text-[12px] font-600 text-blue-600 hover:text-blue-700"
          >
            Lihat Semua →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['No. SP', 'Vendor', 'Target', 'Diterima', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-700 text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spAktif.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[12px] text-gray-300">
                    Tidak ada SP aktif
                  </td>
                </tr>
              ) : (
                spAktif.map((sp) => (
                  <tr
                    key={sp.id}
                    onClick={() => navigate('/sp')}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[11.5px] font-600 text-gray-800">{sp.no}</td>
                    <td className="px-4 py-3 text-[12.5px] font-600 text-gray-700">{sp.vendor}</td>
                    <td className="px-4 py-3 text-[12.5px]">{sp.targetTotal || 0} pcs</td>
                    <td className="px-4 py-3 text-[12.5px]">{sp.diterima || 0} pcs</td>
                    <td className="px-4 py-3"><SPBadge status={sp.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
