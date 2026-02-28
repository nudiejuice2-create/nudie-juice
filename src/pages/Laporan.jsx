// src/pages/Laporan.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { StatCard } from '../components/ui/Toast';
import { SPBadge, ChannelBadge } from '../components/ui/Badge';
import { formatDate } from '../utils/formatters';

const TABS = [
  { key: 'ringkasan', label: '📊 Ringkasan' },
  { key: 'bahan',     label: '🧵 Bahan Baku' },
  { key: 'produksi',  label: '📋 Produksi' },
  { key: 'penjualan', label: '🛒 Penjualan' },
  { key: 'retur',     label: '↩️ Retur' },
  { key: 'vendor',    label: '🏭 Evaluasi Vendor' },
];

export default function Laporan() {
  const [tab, setTab] = useState('ringkasan');

  const produk         = useStore((s) => s.produk);
  const stokBatch      = useStore((s) => s.stokBatch);
  const gudangBB       = useStore((s) => s.gudangBB);
  const suratPesanan   = useStore((s) => s.suratPesanan);
  const penerimaan     = useStore((s) => s.penerimaan);
  const orderPenjualan = useStore((s) => s.orderPenjualan);
  const returCustomer  = useStore((s) => s.returCustomer);
  const returVendor    = useStore((s) => s.returVendor);
  const returSupplier  = useStore((s) => s.returSupplier);
  const suppliers      = useStore((s) => s.suppliers);
  const vendors        = useStore((s) => s.vendors);

  const ringkasan = useMemo(() => {
    const totalStok    = stokBatch.reduce((a, b) => a + b.sisa, 0);
    const totalTerjual = orderPenjualan.filter((o) => o.status === 'Selesai').reduce((a, b) => a + b.totalPcs, 0);
    const totalLolos   = penerimaan.reduce((a, b) => a + (b.totalLolos || 0), 0);
    const totalGagal   = penerimaan.reduce((a, b) => a + (b.totalGagal || 0), 0);
    const passRate     = totalLolos + totalGagal > 0 ? Math.round((totalLolos / (totalLolos + totalGagal)) * 100) : 0;
    const shopee       = orderPenjualan.filter((o) => o.channel === 'Shopee').reduce((a, b) => a + b.totalPcs, 0);
    const tiktok       = orderPenjualan.filter((o) => o.channel === 'TikTok').reduce((a, b) => a + b.totalPcs, 0);
    const offline      = orderPenjualan.filter((o) => o.channel === 'Offline').reduce((a, b) => a + b.totalPcs, 0);
    const maxCh        = Math.max(shopee, tiktok, offline, 1);
    const spStatus     = {
      Draft   : suratPesanan.filter((s) => s.status === 'Draft').length,
      Dikirim : suratPesanan.filter((s) => s.status === 'Dikirim').length,
      Sebagian: suratPesanan.filter((s) => s.status === 'Sebagian').length,
      Selesai : suratPesanan.filter((s) => s.status === 'Selesai').length,
    };
    return { totalStok, totalTerjual, passRate, spStatus, shopee, tiktok, offline, maxCh };
  }, [stokBatch, orderPenjualan, penerimaan, suratPesanan]);

  const bahanData = useMemo(() => {
    return suppliers.map((s) => {
      const rolls       = gudangBB.filter((r) => r.supplier === s.nama);
      const tersedia    = rolls.filter((r) => r.status === 'Tersedia');
      const meterT      = tersedia.reduce((a, r) => a + Number(r.meter || 0), 0);
      const kerugian    = returSupplier.filter((r) => r.supplier === s.nama && r.status === 'Kerugian');
      const meterRugi   = kerugian.reduce((a, r) => a + Number(r.meter || 0), 0);
      return { ...s, rollTotal: rolls.length, rollTersedia: tersedia.length, meterTersedia: meterT, kerugianCount: kerugian.length, meterRugi };
    });
  }, [suppliers, gudangBB, returSupplier]);

  const produksiData = useMemo(() => {
    return suratPesanan.map((sp) => {
      const pct = sp.targetTotal > 0 ? Math.min(100, Math.round(((sp.diterima || 0) / sp.targetTotal) * 100)) : 0;
      return { ...sp, pct };
    }).sort((a, b) => new Date(b.tgl) - new Date(a.tgl));
  }, [suratPesanan]);

  const penjualanData = useMemo(() => {
    const summary = ['Shopee', 'TikTok', 'Offline'].map((ch) => {
      const orders = orderPenjualan.filter((o) => o.channel === ch);
      return { channel: ch, count: orders.length, pcs: orders.reduce((a, b) => a + b.totalPcs, 0), selesai: orders.filter((o) => o.status === 'Selesai').length };
    });
    return { summary, orders: [...orderPenjualan].sort((a, b) => new Date(b.tgl) - new Date(a.tgl)) };
  }, [orderPenjualan]);

  const returData = useMemo(() => ({
    rcMenunggu: returCustomer.filter((r) => r.status === 'Menunggu Pengecekan').length,
    rcDitukar : returCustomer.filter((r) => r.status === 'Selesai Ditukar').length,
    rcVendor  : returCustomer.filter((r) => r.status === 'Dikirim ke Vendor').length,
    rcMusnah  : returCustomer.filter((r) => r.status === 'Dimusnahkan').length,
    rvMenunggu: returVendor.filter((r) => r.status === 'Menunggu').length,
    rvDiVendor: returVendor.filter((r) => r.status === 'Di Vendor').length,
    rvSelesai : returVendor.filter((r) => r.status === 'Masuk Gudang' || r.status === 'Uang Dikembalikan').length,
    rsMenunggu: returSupplier.filter((r) => r.status === 'Menunggu Kirim').length,
    rsKerugian: returSupplier.filter((r) => r.status === 'Kerugian').length,
    meterRugi : returSupplier.filter((r) => r.status === 'Kerugian').reduce((a, r) => a + Number(r.meter || 0), 0),
  }), [returCustomer, returVendor, returSupplier]);

  const vendorData = useMemo(() => {
    return vendors.map((v) => {
      const sps      = suratPesanan.filter((s) => s.vendorKode === v.kode);
      const target   = sps.reduce((a, s) => a + (s.targetTotal || 0), 0);
      const diterima = sps.reduce((a, s) => a + (s.diterima || 0), 0);
      const pnrs     = penerimaan.filter((p) => p.vendorKode === v.kode);
      const gagal    = pnrs.reduce((a, p) => a + (p.totalGagal || 0), 0);
      const total    = pnrs.reduce((a, p) => a + (p.totalDikirim || 0), 0);
      const rejectRate = total > 0 ? Math.round((gagal / total) * 100) : 0;
      return { ...v, spCount: sps.length, target, diterima, gagal, rejectRate };
    });
  }, [vendors, suratPesanan, penerimaan]);

  const th = (label) => (
    <th key={label} className="px-4 py-2.5 text-left text-[10.5px] font-700 text-gray-400 uppercase tracking-wide">{label}</th>
  );

  return (
    <div>
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1.5 mb-5 shadow-sm flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[12.5px] font-600 transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ringkasan' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-3.5">
            <StatCard label="Stok Produk Jadi" value={ringkasan.totalStok.toLocaleString()} sub="pcs" color="green" icon="📦" />
            <StatCard label="Total Terjual" value={ringkasan.totalTerjual.toLocaleString()} sub="pcs selesai" color="blue" icon="🛒" />
            <StatCard label="QC Pass Rate" value={`${ringkasan.passRate}%`} sub="dari semua QC" color={ringkasan.passRate >= 90 ? 'green' : 'yellow'} icon="✅" />
            <StatCard label="Total SP" value={suratPesanan.length} sub="semua status" color="purple" icon="📋" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-4">Performa Channel</p>
              <div className="space-y-4">
                {[['Shopee', ringkasan.shopee, '#ef4444'], ['TikTok', ringkasan.tiktok, '#0ea5e9'], ['Offline', ringkasan.offline, '#10b981']].map(([label, val, color]) => (
                  <div key={label}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="font-600" style={{ color }}>{label}</span>
                      <span className="font-700 text-gray-700">{val} pcs</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((val / ringkasan.maxCh) * 100)}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-4">Status Surat Pesanan</p>
              <div className="space-y-3">
                {[['Draft','#f3f4f6','#6b7280'],['Dikirim','#eff6ff','#2563eb'],['Sebagian','#fffbeb','#d97706'],['Selesai','#f0fdf4','#16a34a']].map(([status, bg, color]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-[11.5px] font-700 px-2.5 py-1 rounded-lg" style={{ background: bg, color }}>{status}</span>
                    <span className="text-[18px] font-extrabold text-gray-800">{ringkasan.spStatus[status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'bahan' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">Stok per Supplier</p>
          </div>
          <table className="w-full">
            <thead><tr className="bg-gray-50">{['Supplier','Kode','Total Roll','Roll Tersedia','Meter Tersedia','Kerugian (Roll)','Meter Kerugian'].map(th)}</tr></thead>
            <tbody>
              {bahanData.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[12px] text-gray-300">Belum ada data</td></tr> : bahanData.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-600">{s.nama}</td>
                  <td className="px-4 py-3 font-mono text-[11.5px]">{s.kode}</td>
                  <td className="px-4 py-3 font-700">{s.rollTotal}</td>
                  <td className="px-4 py-3 font-700 text-emerald-600">{s.rollTersedia}</td>
                  <td className="px-4 py-3 font-700">{s.meterTersedia.toLocaleString()} m</td>
                  <td className="px-4 py-3 font-700"><span className={s.kerugianCount > 0 ? 'text-red-500' : 'text-gray-400'}>{s.kerugianCount}</span></td>
                  <td className="px-4 py-3 font-700"><span className={s.meterRugi > 0 ? 'text-red-500' : 'text-gray-400'}>{s.meterRugi > 0 ? `${s.meterRugi}m` : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'produksi' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">Semua Surat Pesanan</p>
          </div>
          <table className="w-full">
            <thead><tr className="bg-gray-50">{['No. SP','Vendor','Tgl','Target','Diterima','Fulfillment','Status'].map(th)}</tr></thead>
            <tbody>
              {produksiData.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[12px] text-gray-300">Belum ada SP</td></tr> : produksiData.map((sp) => (
                <tr key={sp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-700 text-[11.5px]">{sp.no}</td>
                  <td className="px-4 py-3 font-600">{sp.vendor}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">{formatDate(sp.tgl)}</td>
                  <td className="px-4 py-3 font-700">{sp.targetTotal} pcs</td>
                  <td className="px-4 py-3 font-700 text-emerald-600">{sp.diterima || 0} pcs</td>
                  <td className="px-4 py-3 w-44">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${sp.pct}%`, background: sp.pct === 100 ? '#16a34a' : sp.pct >= 50 ? '#2563eb' : '#f59e0b' }} />
                      </div>
                      <span className="text-[11px] font-700 w-8 text-right text-gray-600">{sp.pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><SPBadge status={sp.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'penjualan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3.5">
            {penjualanData.summary.map((ch) => (
              <div key={ch.channel} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <ChannelBadge channel={ch.channel} />
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  {[['Order', ch.count], ['Selesai', ch.selesai], ['Pcs', ch.pcs]].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] text-gray-400 uppercase">{k}</p>
                      <p className="font-700 text-gray-800 text-[16px]">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">Riwayat Order (20 Terbaru)</p>
            </div>
            <table className="w-full">
              <thead><tr className="bg-gray-50">{['No. Order','Tgl','Channel','Jenis','Customer','Total Pcs','Status'].map(th)}</tr></thead>
              <tbody>
                {penjualanData.orders.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[12px] text-gray-300">Belum ada order</td></tr>
                : penjualanData.orders.slice(0, 20).map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-700 text-[11.5px]">{o.no}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{formatDate(o.tgl)}</td>
                    <td className="px-4 py-3"><ChannelBadge channel={o.channel} /></td>
                    <td className="px-4 py-3 text-[12px]">{o.jenis}</td>
                    <td className="px-4 py-3 text-[12px]">{o.namaCustomer || '—'}</td>
                    <td className="px-4 py-3 font-700">{o.totalPcs} pcs</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-700 px-2 py-0.5 rounded-full ${o.status === 'Selesai' ? 'bg-green-50 text-green-600' : o.status === 'Draft' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'retur' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'Retur Customer', rows: [['Menunggu', returData.rcMenunggu, 'text-amber-500'], ['Ditukar', returData.rcDitukar, 'text-emerald-600'], ['Ke Vendor', returData.rcVendor, 'text-blue-600'], ['Dimusnahkan', returData.rcMusnah, 'text-gray-400']], total: returCustomer.length },
            { title: 'Retur Vendor',   rows: [['Menunggu', returData.rvMenunggu, 'text-amber-500'], ['Di Vendor', returData.rvDiVendor, 'text-blue-600'], ['Selesai', returData.rvSelesai, 'text-emerald-600']], total: returVendor.length },
            { title: 'Retur Supplier', rows: [['Menunggu Kirim', returData.rsMenunggu, 'text-amber-500'], ['Kerugian', returData.rsKerugian, 'text-red-500'], ['Meter Kerugian', `${returData.meterRugi}m`, 'text-red-500']], total: returSupplier.length },
          ].map((card) => (
            <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-3">{card.title}</p>
              <div className="space-y-2.5">
                {card.rows.map(([k, v, c]) => (
                  <div key={k} className="flex justify-between text-[12.5px]">
                    <span className="text-gray-500">{k}</span>
                    <span className={`font-700 ${c}`}>{v}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between text-[12.5px]">
                  <span className="font-700 text-gray-600">Total</span>
                  <span className="font-700">{card.total}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'vendor' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">Evaluasi Vendor — Reject rate &gt; 5% ditandai merah</p>
          </div>
          <table className="w-full">
            <thead><tr className="bg-gray-50">{['Vendor','Kode','Total SP','Target (pcs)','Diterima (pcs)','QC Gagal (pcs)','Reject Rate'].map(th)}</tr></thead>
            <tbody>
              {vendorData.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[12px] text-gray-300">Belum ada vendor</td></tr>
              : vendorData.map((v) => {
                const hi = v.rejectRate > 5;
                return (
                  <tr key={v.id} className={`border-b border-gray-50 hover:bg-gray-50 ${hi ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 font-600">{v.nama}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px]">{v.kode}</td>
                    <td className="px-4 py-3 font-700">{v.spCount}</td>
                    <td className="px-4 py-3 font-700">{v.target.toLocaleString()}</td>
                    <td className="px-4 py-3 font-700 text-emerald-600">{v.diterima.toLocaleString()}</td>
                    <td className="px-4 py-3 font-700 text-red-500">{v.gagal}</td>
                    <td className="px-4 py-3">
                      <span className={`font-700 text-[13px] px-2.5 py-1 rounded-lg ${hi ? 'bg-red-100 text-red-600' : v.rejectRate > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {v.rejectRate}%{hi && ' ⚠️'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
