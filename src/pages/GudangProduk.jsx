// src/pages/GudangProduk.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { formatDate } from '../utils/formatters';

export default function GudangProduk() {
  const produk    = useStore((s) => s.produk);
  const stokBatch = useStore((s) => s.stokBatch);

  const [view, setView]       = useState('sku'); // 'sku' | 'batch'
  const [fCari, setFCari]     = useState('');
  const [fKategori, setFKategori] = useState('');
  const modalDetail = useModal();
  const [selected, setSelected] = useState(null); // SKU yang dipilih untuk lihat batch

  // Kategori unik dari produk
  const kategoriList = useMemo(() => {
    const set = new Set(produk.map((p) => p.kategoriNama));
    return Array.from(set);
  }, [produk]);

  // ── View Per SKU ──
  const perSKU = useMemo(() => {
    return produk
      .map((p) => {
        const batches = stokBatch.filter((b) => b.sku === p.sku);
        const totalMasuk = batches.reduce((a, b) => a + b.masuk, 0);
        const totalSisa  = batches.filter((b) => b.sisa > 0).reduce((a, b) => a + b.sisa, 0);
        return { ...p, totalMasuk, totalSisa, batchCount: batches.length };
      })
      .filter((p) => {
        if (fCari && !(`${p.sku} ${p.nama}`.toLowerCase().includes(fCari.toLowerCase()))) return false;
        if (fKategori && p.kategoriNama !== fKategori) return false;
        return true;
      });
  }, [produk, stokBatch, fCari, fKategori]);

  // ── View Per Batch ──
  const perBatch = useMemo(() => {
    return stokBatch
      .filter((b) => {
        if (fCari && !(`${b.sku} ${b.produk} ${b.spNo}`.toLowerCase().includes(fCari.toLowerCase()))) return false;
        if (fKategori) {
          const p = produk.find((p) => p.sku === b.sku);
          if (p?.kategoriNama !== fKategori) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.tgl) - new Date(a.tgl));
  }, [stokBatch, produk, fCari, fKategori]);

  // Stats
  const totalSKUAktif = produk.filter((p) => {
    return stokBatch.some((b) => b.sku === p.sku && b.sisa > 0);
  }).length;
  const totalPcs = stokBatch.reduce((a, b) => a + b.sisa, 0);
  const totalBatch = stokBatch.length;

  function getStatus(totalSisa, minStok) {
    if (totalSisa === 0) return 'Habis';
    if (totalSisa <= (minStok || 10)) return 'Menipis';
    return 'Tersedia';
  }

  function openDetail(p) {
    setSelected(p);
    modalDetail.onOpen();
  }

  // Batch untuk SKU yang dipilih
  const batchesSKU = useMemo(() => {
    if (!selected) return [];
    return stokBatch
      .filter((b) => b.sku === selected.sku)
      .sort((a, b) => new Date(a.tgl) - new Date(b.tgl));
  }, [selected, stokBatch]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <StatCard label="SKU Aktif"    value={totalSKUAktif} sub="ada stoknya"       color="green"  icon="🏷️" />
        <StatCard label="Total Stok"   value={totalPcs.toLocaleString()} sub="pcs tersedia" color="blue"   icon="📦" />
        <StatCard label="Total Batch"  value={totalBatch}    sub="dari semua SP"     color="purple" icon="📋" />
      </div>

      {/* Toggle View + Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
          {[
            { key: 'sku',   label: '📊 Per SKU' },
            { key: 'batch', label: '📦 Per Batch' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-600 transition-all ${
                view === v.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <select
          value={fKategori}
          onChange={(e) => setFKategori(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white min-w-[150px]"
        >
          <option value="">Semua Kategori</option>
          {kategoriList.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <input
          type="text"
          value={fCari}
          onChange={(e) => setFCari(e.target.value)}
          placeholder={view === 'sku' ? 'Cari SKU / nama...' : 'Cari SKU / SP / produk...'}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg flex-1 min-w-[180px] outline-none focus:border-blue-400 bg-white"
        />
      </div>

      {/* ── View Per SKU ── */}
      {view === 'sku' && (
        <Table
          headers={['SKU', 'Nama Produk', 'Kategori', 'Warna', 'Ukuran', 'Total Masuk', 'Stok Sisa', 'Batch', 'Status', 'Aksi']}
          empty={{ icon: '📦', title: 'Belum ada stok', desc: 'Stok masuk setelah QC lolos dari penerimaan' }}
        >
          {perSKU.map((p) => (
            <Tr key={p.id}>
              <Td mono><span className="font-700">{p.sku}</span></Td>
              <Td><span className="font-600 text-gray-800">{p.nama}</span></Td>
              <Td>{p.kategoriNama}</Td>
              <Td>{p.warna}</Td>
              <Td>
                <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-100 text-[11px] font-700 text-gray-600">
                  {p.ukuran}
                </span>
              </Td>
              <Td>{p.totalMasuk} pcs</Td>
              <Td>
                <span className={`font-700 text-[14px] ${
                  p.totalSisa === 0 ? 'text-red-500'
                  : p.totalSisa <= p.minStok ? 'text-amber-500'
                  : 'text-emerald-600'
                }`}>
                  {p.totalSisa}
                </span>
                <span className="text-[11px] text-gray-400 ml-0.5">pcs</span>
              </Td>
              <Td>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[11px] font-700 text-blue-700">
                  {p.batchCount}
                </span>
              </Td>
              <Td><StatusBadge status={getStatus(p.totalSisa, p.minStok)} /></Td>
              <TdAction>
                <Button size="xs" variant="ghost" onClick={() => openDetail(p)}>
                  Lihat Batch
                </Button>
              </TdAction>
            </Tr>
          ))}
        </Table>
      )}

      {/* ── View Per Batch ── */}
      {view === 'batch' && (
        <Table
          headers={['SKU', 'Produk', 'Warna', 'Ukuran', 'No. SP', 'Vendor', 'Masuk', 'Sisa', 'Tgl Masuk']}
          empty={{ icon: '📦', title: 'Belum ada batch', desc: 'Batch terbentuk setelah QC lolos' }}
        >
          {perBatch.map((b) => (
            <Tr key={b.id}>
              <Td mono><span className="font-700">{b.sku}</span></Td>
              <Td><span className="font-600 text-gray-800 text-[12px]">{b.produk}</span></Td>
              <Td>{b.warna}</Td>
              <Td>
                <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-100 text-[11px] font-700 text-gray-600">
                  {b.ukuran}
                </span>
              </Td>
              <Td mono className="text-[11px]">{b.spNo}</Td>
              <Td>{b.vendor}</Td>
              <Td>{b.masuk} pcs</Td>
              <Td>
                <span className={`font-700 ${b.sisa === 0 ? 'text-red-400' : 'text-emerald-600'}`}>
                  {b.sisa}
                </span>
                <span className="text-[11px] text-gray-400 ml-0.5">pcs</span>
              </Td>
              <Td>{formatDate(b.tgl)}</Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Modal Detail Batch per SKU */}
      <Modal
        open={modalDetail.open}
        onClose={modalDetail.onClose}
        title={`Batch Stok — ${selected?.sku}`}
        size="lg"
        footer={<Button variant="secondary" onClick={modalDetail.onClose}>Tutup</Button>}
      >
        {selected && (
          <div>
            <div className="flex gap-4 mb-4 px-4 py-3 bg-blue-50 rounded-xl">
              <div>
                <p className="text-[10px] text-blue-400 uppercase tracking-wide">Produk</p>
                <p className="text-[13px] font-700 text-blue-800">{selected.nama}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-400 uppercase tracking-wide">Total Stok</p>
                <p className="text-[13px] font-700 text-blue-800">{selected.totalSisa} pcs</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-400 uppercase tracking-wide">Warna · Ukuran</p>
                <p className="text-[13px] font-700 text-blue-800">{selected.warna} · {selected.ukuran}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['No. SP (Batch)', 'Vendor', 'Masuk', 'Terjual', 'Sisa', 'Tgl'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10.5px] font-700 text-gray-400 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batchesSKU.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[12px] text-gray-300">
                      Belum ada batch
                    </td>
                  </tr>
                ) : (
                  batchesSKU.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-[11.5px] font-700 text-gray-800">{b.spNo}</td>
                      <td className="px-3 py-2.5 text-[12px]">{b.vendor}</td>
                      <td className="px-3 py-2.5 text-[12px] font-600">{b.masuk}</td>
                      <td className="px-3 py-2.5 text-[12px] text-amber-600">{b.masuk - b.sisa}</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-700 text-[13px] ${b.sisa === 0 ? 'text-red-400' : 'text-emerald-600'}`}>
                          {b.sisa}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-400">{formatDate(b.tgl)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
