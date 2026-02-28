// src/pages/ReturVendor.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { formatDate, todayISO, uid } from '../utils/formatters';

export default function ReturVendor() {
  const toast         = useToast();
  const returVendor   = useStore((s) => s.returVendor);
  const stokBatch     = useStore((s) => s.stokBatch);
  const kirimReturVendor   = useStore((s) => s.kirimReturVendor);
  const kembalikanReturVendor = useStore((s) => s.kembalikanReturVendor);

  const [fStatus, setFStatus]   = useState('');
  const [fVendor, setFVendor]   = useState('');
  const modalAksi = useModal();
  const [selected, setSelected] = useState(null);
  const [aksiPath, setAksiPath] = useState(''); // 'gudang' | 'uang'

  const filtered = useMemo(() => {
    return returVendor.filter((r) => {
      if (fStatus && r.status !== fStatus) return false;
      if (fVendor && r.vendor !== fVendor) return false;
      return true;
    });
  }, [returVendor, fStatus, fVendor]);

  // Vendor list unik
  const vendorList = useMemo(() => {
    return [...new Set(returVendor.map((r) => r.vendor))];
  }, [returVendor]);

  // Stats
  const menunggu   = returVendor.filter((r) => r.status === 'Menunggu').length;
  const diVendor   = returVendor.filter((r) => r.status === 'Di Vendor').length;
  const selesai    = returVendor.filter((r) => r.status === 'Masuk Gudang' || r.status === 'Uang Dikembalikan').length;
  const totalQty   = returVendor.reduce((a, b) => a + (b.qty || 0), 0);

  function openAksi(r) {
    setSelected(r);
    setAksiPath('');
    modalAksi.onOpen();
  }

  function handleKirimVendor() {
    kirimReturVendor(selected.id);
    toast(`${selected.sku} dikirim ke vendor ${selected.vendor} ✅`, 'blue');
    modalAksi.onClose();
  }

  function handleMasukGudang() {
    // Barang kembali → masuk stokBatch baru
    kembalikanReturVendor(selected.id, 'Masuk Gudang', {
      id: uid(),
      sku: selected.sku,
      produk: selected.produk,
      warna: selected.warna,
      ukuran: selected.ukuran,
      spNo: selected.spNo,
      vendor: selected.vendor,
      masuk: selected.qty,
      sisa: selected.qty,
      tgl: todayISO(),
      pnrNo: `RTV-${selected.id}`,
    });
    toast(`${selected.qty} pcs ${selected.sku} masuk gudang kembali ✅`, 'green');
    modalAksi.onClose();
  }

  function handleUangDikembalikan() {
    kembalikanReturVendor(selected.id, 'Uang Dikembalikan', null);
    toast(`Uang untuk ${selected.sku} dikembalikan — dicatat ✅`, 'green');
    modalAksi.onClose();
  }

  const sumberColor = {
    'QC Gagal':       'bg-red-50 text-red-600',
    'Retur Customer': 'bg-purple-50 text-purple-600',
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Menunggu"    value={menunggu}  sub="belum dikirim"      color="yellow" icon="⏳" />
        <StatCard label="Di Vendor"   value={diVendor}  sub="sedang diperbaiki"  color="blue"   icon="🔄" />
        <StatCard label="Selesai"     value={selesai}   sub="masuk gudang / uang" color="green" icon="✅" />
        <StatCard label="Total Item"  value={totalQty}  sub="pcs diretur"        color="gray"   icon="📦" />
      </div>

      {/* Filter */}
      <div className="flex gap-2.5 mb-4">
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="">Semua Status</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Di Vendor">Di Vendor</option>
          <option value="Masuk Gudang">Masuk Gudang</option>
          <option value="Uang Dikembalikan">Uang Dikembalikan</option>
        </select>

        <select
          value={fVendor}
          onChange={(e) => setFVendor(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="">Semua Vendor</option>
          {vendorList.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Tabel */}
      <Table
        headers={['SKU', 'Produk', 'Warna', 'Ukuran', 'Vendor', 'No. SP', 'Qty', 'Alasan', 'Sumber', 'Tgl', 'Status', 'Aksi']}
        empty={{ icon: '🔄', title: 'Belum ada retur vendor', desc: 'Retur masuk dari QC gagal atau retur customer' }}
      >
        {filtered.map((r) => (
          <Tr key={r.id}>
            <Td mono><span className="font-700">{r.sku}</span></Td>
            <Td><span className="text-[12px]">{r.produk}</span></Td>
            <Td>{r.warna}</Td>
            <Td>
              <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-100 text-[11px] font-700">
                {r.ukuran}
              </span>
            </Td>
            <Td>{r.vendor}</Td>
            <Td mono className="text-[11px]">{r.spNo}</Td>
            <Td><span className="font-700">{r.qty}</span> pcs</Td>
            <Td>
              <span className="text-[11.5px] text-gray-500 truncate max-w-[120px] block">
                {r.alasan || '—'}
              </span>
            </Td>
            <Td>
              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-600 ${sumberColor[r.sumber] || 'bg-gray-100 text-gray-500'}`}>
                {r.sumber}
              </span>
            </Td>
            <Td>{formatDate(r.tgl)}</Td>
            <Td><StatusBadge status={r.status} /></Td>
            <TdAction>
              {(r.status === 'Menunggu' || r.status === 'Di Vendor') && (
                <Button size="xs" variant="primary" onClick={() => openAksi(r)}>Proses</Button>
              )}
            </TdAction>
          </Tr>
        ))}
      </Table>

      {/* Modal Aksi */}
      <Modal
        open={modalAksi.open}
        onClose={modalAksi.onClose}
        title="Proses Retur Vendor"
        size="sm"
        footer={<Button variant="secondary" onClick={modalAksi.onClose}>Tutup</Button>}
      >
        {selected && (
          <div className="space-y-4">
            {/* Info item */}
            <div className="px-4 py-3 bg-gray-50 rounded-xl space-y-1.5 text-[12.5px]">
              {[
                ['SKU', selected.sku],
                ['Produk', selected.produk],
                ['Warna · Ukuran', `${selected.warna} · ${selected.ukuran}`],
                ['Vendor', selected.vendor],
                ['No. SP', selected.spNo],
                ['Qty', `${selected.qty} pcs`],
                ['Alasan', selected.alasan || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-gray-400 flex-shrink-0">{k}</span>
                  <span className="font-600 text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Aksi berdasarkan status */}
            {selected.status === 'Menunggu' && (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 text-center">Langkah 1 dari 2</p>
                <Button className="w-full justify-center" variant="primary" onClick={handleKirimVendor}>
                  📤 Kirim ke Vendor
                </Button>
              </div>
            )}

            {selected.status === 'Di Vendor' && (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 text-center">Langkah 2 — Vendor sudah selesai</p>
                {!aksiPath && (
                  <>
                    <Button className="w-full justify-center" variant="success" onClick={() => setAksiPath('gudang')}>
                      📦 Barang Masuk Gudang
                    </Button>
                    <Button className="w-full justify-center" variant="warning" onClick={() => setAksiPath('uang')}>
                      💰 Kembalikan Uang
                    </Button>
                  </>
                )}

                {aksiPath === 'gudang' && (
                  <div className="space-y-3">
                    <div className="px-3 py-2.5 bg-emerald-50 rounded-lg text-[12px] text-emerald-700">
                      ✅ <strong>{selected.qty} pcs {selected.sku}</strong> akan masuk stok gudang produk jadi.
                      Batch baru dari SP <strong>{selected.spNo}</strong>.
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setAksiPath('')} className="flex-1 justify-center">Batal</Button>
                      <Button variant="success" onClick={handleMasukGudang} className="flex-1 justify-center">Konfirmasi</Button>
                    </div>
                  </div>
                )}

                {aksiPath === 'uang' && (
                  <div className="space-y-3">
                    <div className="px-3 py-2.5 bg-amber-50 rounded-lg text-[12px] text-amber-700">
                      💰 Catat bahwa uang untuk <strong>{selected.qty} pcs {selected.sku}</strong> sudah dikembalikan. Stok tidak berubah.
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setAksiPath('')} className="flex-1 justify-center">Batal</Button>
                      <Button variant="warning" onClick={handleUangDikembalikan} className="flex-1 justify-center">Konfirmasi</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
