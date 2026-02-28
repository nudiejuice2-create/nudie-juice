// src/pages/ReturCustomer.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { StatusBadge, ChannelBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { formatDate, todayISO, uid } from '../utils/formatters';

export default function ReturCustomer() {
  const toast          = useToast();
  const returCustomer  = useStore((s) => s.returCustomer);
  const orderPenjualan = useStore((s) => s.orderPenjualan);
  const stokBatch      = useStore((s) => s.stokBatch);
  const produk         = useStore((s) => s.produk);
  const tambahReturCustomer  = useStore((s) => s.tambahReturCustomer);
  const prosesReturCustomer  = useStore((s) => s.prosesReturCustomer);

  // Filter
  const [fStatus, setFStatus] = useState('');

  // Modal
  const modalInput = useModal();
  const modalAksi  = useModal();
  const [selected, setSelected] = useState(null);
  const [aksiPath, setAksiPath] = useState(''); // 'musnahkan' | 'tukar' | 'vendor'

  // Form Input Retur
  const [orderId,  setOrderId]  = useState('');
  const [itemIdx,  setItemIdx]  = useState('');
  const [batchId,  setBatchId]  = useState('');
  const [qty,      setQty]      = useState('');
  const [alasan,   setAlasan]   = useState('');

  // Form Tukar Barang
  const [tukarSKU,     setTukarSKU]     = useState('');
  const [tukarBatchId, setTukarBatchId] = useState('');
  const [tukarQty,     setTukarQty]     = useState('');

  // Stats
  const stats = useMemo(() => ({
    menunggu  : returCustomer.filter((r) => r.status === 'Menunggu Pengecekan').length,
    ditukar   : returCustomer.filter((r) => r.status === 'Selesai Ditukar').length,
    vendor    : returCustomer.filter((r) => r.status === 'Dikirim ke Vendor').length,
    musnahkan : returCustomer.filter((r) => r.status === 'Dimusnahkan').length,
  }), [returCustomer]);

  // Filter retur
  const filtered = useMemo(() => {
    return returCustomer
      .filter((r) => !fStatus || r.status === fStatus)
      .sort((a, b) => new Date(b.tgl) - new Date(a.tgl));
  }, [returCustomer, fStatus]);

  // Order selesai untuk pilih retur
  const orderSelesai = useMemo(() => {
    return orderPenjualan.filter((o) => o.status === 'Selesai');
  }, [orderPenjualan]);

  // Items dari order yang dipilih
  const orderItems = useMemo(() => {
    if (!orderId) return [];
    const order = orderPenjualan.find((o) => o.id === orderId);
    return order?.items || [];
  }, [orderId, orderPenjualan]);

  // Batch dari item yang dipilih
  const itemBatches = useMemo(() => {
    if (itemIdx === '' || !orderItems[itemIdx]) return [];
    const item = orderItems[itemIdx];
    // Batch dari order item (lihat label fisik baju)
    return stokBatch.filter((b) => b.sku === item.sku);
  }, [itemIdx, orderItems, stokBatch]);

  // Batch untuk tukar barang
  function getBatchesBySKU(sku) {
    return stokBatch.filter((b) => b.sku === sku && b.sisa > 0);
  }

  // ── OPEN INPUT RETUR ──
  function openInput() {
    setOrderId('');
    setItemIdx('');
    setBatchId('');
    setQty('');
    setAlasan('');
    modalInput.onOpen();
  }

  function handleSimpanRetur() {
    if (!orderId) return toast('Pilih order asal!', 'red');
    if (itemIdx === '') return toast('Pilih item yang diretur!', 'red');
    if (!batchId) return toast('Pilih batch!', 'red');
    if (!qty || Number(qty) <= 0) return toast('Isi jumlah retur!', 'red');
    if (!alasan.trim()) return toast('Isi alasan retur!', 'red');

    const order = orderPenjualan.find((o) => o.id === orderId);
    const item  = orderItems[Number(itemIdx)];
    const batch = stokBatch.find((b) => b.id === batchId);

    tambahReturCustomer({
      id: uid(),
      orderNo: order.no,
      orderId: order.id,
      channel: order.channel,
      sku: item.sku,
      produk: item.produk,
      warna: item.warna,
      ukuran: item.ukuran,
      batchId: batch.id,
      spNo: batch.spNo,
      vendor: batch.vendor,
      qty: Number(qty),
      alasan: alasan.trim(),
      namaCustomer: order.namaCustomer || '—',
      tgl: todayISO(),
      status: 'Menunggu Pengecekan',
    });

    toast('Retur customer berhasil dicatat ✅', 'green');
    modalInput.onClose();
  }

  // ── OPEN AKSI ──
  function openAksi(r) {
    setSelected(r);
    setAksiPath('');
    setTukarSKU('');
    setTukarBatchId('');
    setTukarQty(String(r.qty));
    modalAksi.onOpen();
  }

  // ── PATH A: MUSNAHKAN ──
  function handleMusnahkan() {
    if (!window.confirm('Musnahkan barang ini? Stok tidak berubah.')) return;
    prosesReturCustomer(selected.id, 'Dimusnahkan', null);
    toast('Barang dimusnahkan — dicatat ✅', 'gray');
    modalAksi.onClose();
  }

  // ── PATH B: TUKAR BARANG ──
  function handleTukar() {
    if (!tukarSKU) return toast('Pilih SKU pengganti!', 'red');
    if (!tukarBatchId) return toast('Pilih batch pengganti!', 'red');
    if (!tukarQty || Number(tukarQty) <= 0) return toast('Isi qty tukar!', 'red');

    const tukarBatch = stokBatch.find((b) => b.id === tukarBatchId);
    if (!tukarBatch) return toast('Batch tidak ditemukan!', 'red');
    if (Number(tukarQty) > tukarBatch.sisa)
      return toast(`Stok batch pengganti hanya ${tukarBatch.sisa} pcs!`, 'red');

    const tukarProduk = produk.find((p) => p.sku === tukarSKU);

    prosesReturCustomer(selected.id, 'Selesai Ditukar', {
      // Stok lama kembali ke batch asal
      kembaliBatchId: selected.batchId,
      kembaliQty: selected.qty,
      // Stok baru berkurang dari batch pengganti
      tukarBatchId,
      tukarQty: Number(tukarQty),
      tukarSKU,
      tukarProduk: tukarProduk?.nama || tukarSKU,
    });

    toast(`Tukar barang selesai ✅ — stok lama kembali, stok ${tukarSKU} berkurang`, 'green');
    modalAksi.onClose();
  }

  // ── PATH C: KIRIM KE VENDOR ──
  function handleKirimVendor() {
    if (!window.confirm('Kirim barang ini ke vendor untuk diperbaiki?')) return;
    prosesReturCustomer(selected.id, 'Dikirim ke Vendor', {
      // Masuk retur vendor
      returVendorData: {
        id: uid(),
        produk: selected.produk,
        sku: selected.sku,
        warna: selected.warna,
        ukuran: selected.ukuran,
        vendor: selected.vendor,
        spNo: selected.spNo,
        qty: selected.qty,
        alasan: selected.alasan,
        sumber: 'Retur Customer',
        tgl: todayISO(),
        status: 'Menunggu',
      },
    });
    toast('Barang masuk antrian Retur Vendor 🔄', 'blue');
    modalAksi.onClose();
  }

  const statusColors = {
    'Menunggu Pengecekan': 'text-amber-500',
    'Dimusnahkan'        : 'text-gray-400',
    'Selesai Ditukar'    : 'text-emerald-600',
    'Dikirim ke Vendor'  : 'text-blue-500',
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Menunggu"     value={stats.menunggu}  sub="perlu diproses"    color="yellow" icon="⏳" />
        <StatCard label="Ditukar"      value={stats.ditukar}   sub="selesai ditukar"   color="green"  icon="🔁" />
        <StatCard label="Ke Vendor"    value={stats.vendor}    sub="diperbaiki vendor"  color="blue"   icon="🔄" />
        <StatCard label="Dimusnahkan"  value={stats.musnahkan} sub="tidak bisa dipakai" color="gray"  icon="🗑️" />
      </div>

      {/* Filter + Tombol */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="">Semua Status</option>
          <option value="Menunggu Pengecekan">Menunggu Pengecekan</option>
          <option value="Dimusnahkan">Dimusnahkan</option>
          <option value="Selesai Ditukar">Selesai Ditukar</option>
          <option value="Dikirim ke Vendor">Dikirim ke Vendor</option>
        </select>
        <Button onClick={openInput}>+ Input Retur</Button>
      </div>

      {/* Tabel */}
      <Table
        headers={['No. Order', 'Channel', 'Customer', 'SKU', 'Produk', 'Warna', 'Ukuran', 'Batch (SP)', 'Qty', 'Alasan', 'Tgl', 'Status', 'Aksi']}
        empty={{ icon: '📤', title: 'Belum ada retur customer', desc: 'Input retur dari order yang sudah selesai' }}
      >
        {filtered.map((r) => (
          <Tr key={r.id}>
            <Td mono className="text-[11.5px]">{r.orderNo}</Td>
            <Td><ChannelBadge channel={r.channel} /></Td>
            <Td>{r.namaCustomer}</Td>
            <Td mono><span className="font-700">{r.sku}</span></Td>
            <Td className="text-[12px]">{r.produk}</Td>
            <Td>{r.warna}</Td>
            <Td>
              <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-100 text-[11px] font-700">
                {r.ukuran}
              </span>
            </Td>
            <Td mono className="text-[11px]">{r.spNo}</Td>
            <Td><span className="font-700">{r.qty}</span> pcs</Td>
            <Td>
              <span className="text-[11.5px] text-gray-500 max-w-[120px] truncate block">
                {r.alasan}
              </span>
            </Td>
            <Td>{formatDate(r.tgl)}</Td>
            <Td><StatusBadge status={r.status} /></Td>
            <TdAction>
              {r.status === 'Menunggu Pengecekan' && (
                <Button size="xs" variant="primary" onClick={() => openAksi(r)}>Proses</Button>
              )}
            </TdAction>
          </Tr>
        ))}
      </Table>

      {/* ══ MODAL INPUT RETUR ══ */}
      <Modal
        open={modalInput.open}
        onClose={modalInput.onClose}
        title="Input Retur Customer"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={modalInput.onClose}>Batal</Button>
            <Button onClick={handleSimpanRetur}>Simpan Retur</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Pilih Order */}
          <div>
            <label className="label-form">Order Asal (sudah Selesai)</label>
            <select
              value={orderId}
              onChange={(e) => { setOrderId(e.target.value); setItemIdx(''); setBatchId(''); }}
              className="input-form"
            >
              <option value="">Pilih order</option>
              {orderSelesai.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.no} — {o.channel} — {o.namaCustomer || 'Tanpa nama'} ({formatDate(o.tgl)})
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Item */}
          {orderId && (
            <div>
              <label className="label-form">Item yang Diretur</label>
              <select
                value={itemIdx}
                onChange={(e) => { setItemIdx(e.target.value); setBatchId(''); }}
                className="input-form"
              >
                <option value="">Pilih item</option>
                {orderItems.map((item, i) => (
                  <option key={i} value={i}>
                    {item.sku} — {item.produk} · {item.warna} · {item.ukuran} ({item.qty} pcs)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pilih Batch */}
          {itemIdx !== '' && (
            <div>
              <label className="label-form">
                Batch (SP)
                <span className="ml-1 text-[10px] text-blue-500 normal-case font-400">
                  lihat kode batch di label fisik baju
                </span>
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="input-form"
              >
                <option value="">Pilih batch</option>
                {itemBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.spNo} · {b.vendor} · sisa {b.sisa} pcs
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Qty & Alasan */}
          {itemIdx !== '' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-form">Jumlah Retur (pcs)</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  min={1}
                  className="input-form text-center font-700"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label-form">Alasan Retur</label>
                <input
                  type="text"
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Cacat, salah ukuran, dll"
                  className="input-form"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ══ MODAL AKSI — 3 PATH ══ */}
      <Modal
        open={modalAksi.open}
        onClose={modalAksi.onClose}
        title="Proses Retur Customer"
        size="md"
        footer={<Button variant="secondary" onClick={modalAksi.onClose}>Tutup</Button>}
      >
        {selected && (
          <div className="space-y-4">
            {/* Info Retur */}
            <div className="px-4 py-3 bg-gray-50 rounded-xl space-y-1.5 text-[12.5px]">
              {[
                ['Order',   selected.orderNo],
                ['SKU',     selected.sku],
                ['Produk',  `${selected.produk} · ${selected.warna} · ${selected.ukuran}`],
                ['Batch',   selected.spNo],
                ['Vendor',  selected.vendor],
                ['Qty',     `${selected.qty} pcs`],
                ['Alasan',  selected.alasan],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-gray-400 flex-shrink-0">{k}</span>
                  <span className="font-600 text-right text-gray-800">{v}</span>
                </div>
              ))}
            </div>

            {/* 3 Path */}
            {!aksiPath && (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 text-center mb-3">Pilih penanganan barang retur:</p>

                {/* Path A: Musnahkan */}
                <button
                  onClick={() => setAksiPath('musnahkan')}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-left"
                >
                  <span className="text-2xl flex-shrink-0">🗑️</span>
                  <div>
                    <p className="text-[13px] font-700 text-gray-800">Musnahkan</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                      Barang rusak parah, tidak bisa diperbaiki. Stok tidak berubah.
                    </p>
                  </div>
                </button>

                {/* Path B: Tukar Barang */}
                <button
                  onClick={() => setAksiPath('tukar')}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                >
                  <span className="text-2xl flex-shrink-0">🔁</span>
                  <div>
                    <p className="text-[13px] font-700 text-gray-800">Tukar Barang</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                      Salah ukuran/warna, barang masih bagus. Stok lama kembali, stok baru berkurang.
                    </p>
                  </div>
                </button>

                {/* Path C: Kirim ke Vendor */}
                <button
                  onClick={() => setAksiPath('vendor')}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <span className="text-2xl flex-shrink-0">🔄</span>
                  <div>
                    <p className="text-[13px] font-700 text-gray-800">Kirim ke Vendor</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                      Cacat jahitan, bisa diperbaiki. Masuk antrian Retur Vendor.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* ── Path A: Musnahkan ── */}
            {aksiPath === 'musnahkan' && (
              <div className="space-y-3">
                <div className="px-4 py-3 bg-red-50 rounded-xl text-[12.5px] text-red-700">
                  🗑️ Barang <strong>{selected.qty} pcs {selected.sku}</strong> akan dimusnahkan.
                  Stok tidak berubah.
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setAksiPath('')} className="flex-1 justify-center">← Kembali</Button>
                  <Button variant="danger" onClick={handleMusnahkan} className="flex-1 justify-center">Konfirmasi Musnahkan</Button>
                </div>
              </div>
            )}

            {/* ── Path B: Tukar Barang ── */}
            {aksiPath === 'tukar' && (
              <div className="space-y-3">
                <div className="px-3 py-2.5 bg-emerald-50 rounded-lg text-[11.5px] text-emerald-700">
                  Stok <strong>{selected.sku}</strong> batch <strong>{selected.spNo}</strong> akan +{selected.qty} pcs.
                </div>

                <div>
                  <label className="label-form">SKU Pengganti</label>
                  <select
                    value={tukarSKU}
                    onChange={(e) => { setTukarSKU(e.target.value); setTukarBatchId(''); }}
                    className="input-form"
                  >
                    <option value="">Pilih SKU pengganti</option>
                    {produk.map((p) => {
                      const sisa = stokBatch.filter((b) => b.sku === p.sku && b.sisa > 0).reduce((a, b) => a + b.sisa, 0);
                      return (
                        <option key={p.sku} value={p.sku} disabled={sisa === 0}>
                          {p.sku} — {p.nama} · {p.warna} · {p.ukuran} ({sisa} pcs)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {tukarSKU && (
                  <div>
                    <label className="label-form">Batch Pengganti</label>
                    <select
                      value={tukarBatchId}
                      onChange={(e) => setTukarBatchId(e.target.value)}
                      className="input-form"
                    >
                      <option value="">Pilih batch</option>
                      {getBatchesBySKU(tukarSKU).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.spNo} · {b.vendor} · sisa {b.sisa} pcs
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label-form">Qty Tukar</label>
                  <input
                    type="number"
                    value={tukarQty}
                    onChange={(e) => setTukarQty(e.target.value)}
                    min={1}
                    className="input-form text-center font-700"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setAksiPath('')} className="flex-1 justify-center">← Kembali</Button>
                  <Button variant="success" onClick={handleTukar} className="flex-1 justify-center">Konfirmasi Tukar</Button>
                </div>
              </div>
            )}

            {/* ── Path C: Kirim ke Vendor ── */}
            {aksiPath === 'vendor' && (
              <div className="space-y-3">
                <div className="px-4 py-3 bg-blue-50 rounded-xl text-[12.5px] text-blue-700">
                  🔄 Barang <strong>{selected.qty} pcs {selected.sku}</strong> akan masuk
                  antrian <strong>Retur Vendor</strong> untuk vendor <strong>{selected.vendor}</strong>.
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setAksiPath('')} className="flex-1 justify-center">← Kembali</Button>
                  <Button variant="primary" onClick={handleKirimVendor} className="flex-1 justify-center">Konfirmasi Kirim Vendor</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
