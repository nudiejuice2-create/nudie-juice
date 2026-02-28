// src/components/Topbar.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

const pageTitles = {
  '/':                'Dashboard',
  '/katalog':         'Katalog Produk',
  '/gudang-bb':       'Gudang Bahan Baku',
  '/gudang-produk':   'Gudang Produk Jadi',
  '/retur-supplier':  'Retur Supplier',
  '/retur-vendor':    'Retur Vendor',
  '/sp':              'Surat Pesanan',
  '/penerimaan':      'Penerimaan Barang',
  '/order':           'Order Penjualan',
  '/retur-customer':  'Retur Customer',
  '/laporan':         'Laporan',
  '/master':          'Master Data',
  '/pengaturan':      'Pengaturan',
  '/users':           'Manajemen User',
};

export default function Topbar() {
  const [showNotif, setShowNotif] = useState(false);
  const location = useLocation();
  const title    = pageTitles[location.pathname] || 'NUDIE JUICE';

  // Data untuk notifikasi
  const produk       = useStore((s) => s.produk);
  const stokBatch    = useStore((s) => s.stokBatch);
  const penerimaan   = useStore((s) => s.penerimaan);
  const returCustomer = useStore((s) => s.returCustomer);
  const returVendor  = useStore((s) => s.returVendor);

  // Generate notifikasi
  const notifs = [];

  produk.forEach((p) => {
    const stok = stokBatch
      .filter((b) => b.sku === p.sku && b.sisa > 0)
      .reduce((a, b) => a + b.sisa, 0);
    const min = p.minStok || 10;
    if (stok === 0)      notifs.push({ type: 'red',    text: `Stok ${p.sku} HABIS` });
    else if (stok <= min) notifs.push({ type: 'yellow', text: `Stok ${p.sku} menipis: ${stok} pcs` });
  });

  const mnQC = penerimaan.filter((p) => p.status === 'Menunggu QC').length;
  if (mnQC > 0) notifs.push({ type: 'blue', text: `${mnQC} penerimaan menunggu QC` });

  const rcMng = returCustomer.filter((r) => r.status === 'Menunggu Pengecekan').length;
  if (rcMng > 0) notifs.push({ type: 'yellow', text: `${rcMng} retur customer belum diproses` });

  const rvMng = returVendor.filter((r) => r.status === 'Menunggu').length;
  if (rvMng > 0) notifs.push({ type: 'yellow', text: `${rvMng} retur vendor menunggu proses` });

  const dotColors = { red: '#ef4444', yellow: '#f59e0b', blue: '#2563eb' };

  return (
    <>
      <header
        className="flex items-center justify-between px-6 sticky top-0 z-40 flex-shrink-0"
        style={{
          height: '56px',
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <h1 className="text-[15px] font-extrabold text-gray-900 tracking-tight">
          {title}
        </h1>

        <div className="relative">
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[14px] transition-colors relative"
          >
            🔔
            {notifs.length > 0 && (
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border border-white"
                style={{ background: '#ef4444' }}
              />
            )}
          </button>
        </div>
      </header>

      {/* Notif Panel */}
      {showNotif && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotif(false)}
          />
          <div
            className="fixed top-14 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto"
          >
            <div className="px-4 py-3 border-b border-gray-100 font-700 text-[13px]">
              🔔 Notifikasi
            </div>
            {notifs.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-gray-400">
                Tidak ada notifikasi
              </div>
            ) : (
              notifs.map((n, i) => (
                <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-gray-50 last:border-0">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: dotColors[n.type] || '#6b7280' }}
                  />
                  <p className="text-[12px] text-gray-700">{n.text}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
