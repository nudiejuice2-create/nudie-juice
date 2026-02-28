// src/pages/OrderPenjualan.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { StatusBadge, ChannelBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { formatDate, todayISO, uid } from '../utils/formatters';
import { generateNoOrder } from '../utils/generators';

const CHANNELS = ['Shopee', 'TikTok', 'Offline'];
const JENIS    = ['Eceran', 'Grosir'];

const emptyItem = { id: '', sku: '', produk: '', warna: '', ukuran: '', qty: '', batchId: '', spNo: '', vendor: '' };

export default function OrderPenjualan() {
  const toast          = useToast();
  const orderPenjualan = useStore((s) => s.orderPenjualan);
  const produk         = useStore((s) => s.produk);
  const stokBatch      = useStore((s) => s.stokBatch);
  const profile        = useStore((s) => s.profile);
  const tambahOrder    = useStore((s) => s.tambahOrder);
  const updateOrder    = useStore((s) => s.updateOrder);
  const selesaikanOrder = useStore((s) => s.selesaikanOrder);
  const batalkanOrder  = useStore((s) => s.batalkanOrder);
  const hapusOrder     = useStore((s) => s.hapusOrder);

  // Filter
  const [fStatus,  setFStatus]  = useState('');
  const [fChannel, setFChannel] = useState('');
  const [fCari,    setFCari]    = useState('');

  // Modal
  const modalForm   = useModal();
  const modalDetail = useModal();
  const modalPrint  = useModal();
  const [editId,    setEditId]    = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  // Form
  const [channel,      setChannel]      = useState('Shopee');
  const [jenis,        setJenis]        = useState('Eceran');
  const [noPlatform,   setNoPlatform]   = useState('');
  const [namaCustomer, setNamaCustomer] = useState('');
  const [tgl,          setTgl]          = useState(todayISO());
  const [items,        setItems]        = useState([{ ...emptyItem, id: uid() }]);

  // Stats
  const stats = useMemo(() => {
    const draft   = orderPenjualan.filter((o) => o.status === 'Draft');
    const selesai = orderPenjualan.filter((o) => o.status === 'Selesai');
    const shopee  = orderPenjualan.filter((o) => o.channel === 'Shopee').reduce((a, b) => a + b.totalPcs, 0);
    const tiktok  = orderPenjualan.filter((o) => o.channel === 'TikTok').reduce((a, b) => a + b.totalPcs, 0);
    const offline = orderPenjualan.filter((o) => o.channel === 'Offline').reduce((a, b) => a + b.totalPcs, 0);
    return {
      draft: draft.length,
      selesai: selesai.length,
      totalPcs: orderPenjualan.reduce((a, b) => a + b.totalPcs, 0),
      shopee, tiktok, offline,
    };
  }, [orderPenjualan]);

  // Filter order
  const filtered = useMemo(() => {
    return orderPenjualan
      .filter((o) => {
        if (fStatus  && o.status  !== fStatus)  return false;
        if (fChannel && o.channel !== fChannel) return false;
        if (fCari && !(`${o.no} ${o.namaCustomer} ${o.noPlatform}`.toLowerCase().includes(fCari.toLowerCase()))) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tgl) - new Date(a.tgl));
  }, [orderPenjualan, fStatus, fChannel, fCari]);

  // Batch tersedia per SKU (sisa > 0)
  function getBatchesBySKU(sku) {
    return stokBatch
      .filter((b) => b.sku === sku && b.sisa > 0)
      .sort((a, b) => new Date(a.tgl) - new Date(b.tgl));
  }

  // Total stok SKU
  function getStokSKU(sku) {
    return stokBatch
      .filter((b) => b.sku === sku && b.sisa > 0)
      .reduce((a, b) => a + b.sisa, 0);
  }

  // ── OPEN FORM BUAT ──
  function openBuat() {
    setEditId(null);
    setChannel('Shopee');
    setJenis('Eceran');
    setNoPlatform('');
    setNamaCustomer('');
    setTgl(todayISO());
    setItems([{ ...emptyItem, id: uid() }]);
    modalForm.onOpen();
  }

  // ── OPEN FORM EDIT (hanya Draft) ──
  function openEdit(order) {
    setEditId(order.id);
    setChannel(order.channel);
    setJenis(order.jenis);
    setNoPlatform(order.noPlatform || '');
    setNamaCustomer(order.namaCustomer || '');
    setTgl(order.tgl);
    setItems((order.items || []).map((i) => ({ ...i, id: uid() })));
    modalForm.onOpen();
  }

  // ── ITEM MANAGEMENT ──
  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem, id: uid() }]);
  }

  function removeItem(id) {
    if (items.length === 1) return toast('Minimal 1 item!', 'red');
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function setItemSKU(itemId, sku) {
    const p = produk.find((p) => p.sku === sku);
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, sku: p?.sku || '', produk: p?.nama || '', warna: p?.warna || '', ukuran: p?.ukuran || '', batchId: '', spNo: '', vendor: '', qty: '' }
          : i
      )
    );
  }

  function setItemBatch(itemId, batchId) {
    const batch = stokBatch.find((b) => b.id === batchId);
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, batchId: batch?.id || '', spNo: batch?.spNo || '', vendor: batch?.vendor || '' }
          : i
      )
    );
  }

  function setItemQty(itemId, val) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, qty: val } : i))
    );
  }

  // Cek qty vs sisa batch
  function getQtyWarning(item) {
    if (!item.batchId || !item.qty) return null;
    const batch = stokBatch.find((b) => b.id === item.batchId);
    if (!batch) return null;

    // Kalau edit, tambahkan kembali qty lama dari order sebelumnya
    let sisaEfektif = batch.sisa;
    if (editId) {
      const orderLama = orderPenjualan.find((o) => o.id === editId);
      const itemLama  = (orderLama?.items || []).find((i) => i.batchId === item.batchId);
      if (itemLama) sisaEfektif += itemLama.qty;
    }

    if (Number(item.qty) > sisaEfektif)
      return `Stok batch hanya ${sisaEfektif} pcs`;
    return null;
  }

  // ── SIMPAN ORDER ──
  function handleSimpan() {
    if (!channel) return toast('Pilih channel!', 'red');

    const invalid = items.some(
      (i) => !i.sku || !i.batchId || !i.qty || Number(i.qty) <= 0
    );
    if (invalid) return toast('Lengkapi semua item (SKU, batch, qty)!', 'red');

    // Cek warning qty
    const overQty = items.some((i) => getQtyWarning(i));
    if (overQty) return toast('Ada qty melebihi stok batch yang dipilih!', 'red');

    const totalPcs = items.reduce((a, i) => a + Number(i.qty), 0);
    const no = editId
      ? orderPenjualan.find((o) => o.id === editId)?.no
      : generateNoOrder(channel, orderPenjualan);

    const data = {
      no,
      noPlatform: noPlatform.trim(),
      tgl,
      channel,
      jenis,
      namaCustomer: namaCustomer.trim(),
      items: items.map(({ id, ...i }) => ({ ...i, qty: Number(i.qty) })),
      totalPcs,
      status: 'Draft',
    };

    if (editId) {
      updateOrder(editId, data);
      toast(`Order ${no} diperbarui ✅`, 'green');
    } else {
      tambahOrder({ id: uid(), ...data });
      toast(`Order ${no} dibuat — stok berkurang 📦`, 'blue');
    }
    modalForm.onClose();
  }

  // ── SELESAIKAN ──
  function handleSelesai(order) {
    if (!window.confirm(`Selesaikan order ${order.no}?`)) return;
    selesaikanOrder(order.id);
    toast(`Order ${order.no} selesai ✅`, 'green');
  }

  // ── BATALKAN ──
  function handleBatal(order) {
    if (!window.confirm(`Batalkan order ${order.no}? Stok akan dikembalikan.`)) return;
    batalkanOrder(order.id);
    toast(`Order ${order.no} dibatalkan — stok dikembalikan`, 'yellow');
  }

  // ── HAPUS ──
  function handleHapus(order) {
    if (!window.confirm(`Hapus order ${order.no}?`)) return;
    hapusOrder(order.id);
    toast(`Order ${order.no} dihapus`, 'red');
  }

  // ── DETAIL & PRINT ──
  function openDetail(order) {
    setDetailOrder(order);
    modalDetail.onOpen();
  }

  function openPrint(order) {
    setDetailOrder(order);
    modalPrint.onOpen();
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Draft"       value={stats.draft}    sub="belum selesai"   color="yellow" icon="🛒" />
        <StatCard label="Selesai"     value={stats.selesai}  sub="terkirim"        color="green"  icon="✅" />
        <StatCard label="Total Pcs"   value={stats.totalPcs.toLocaleString()} sub="semua order" color="blue" icon="📦" />
        <StatCard label="Shopee/TT/OFL" value={`${stats.shopee}/${stats.tiktok}/${stats.offline}`} sub="pcs per channel" color="purple" icon="📊" />
      </div>

      {/* Filter + Tombol */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white">
          <option value="">Semua Status</option>
          <option value="Draft">Draft</option>
          <option value="Selesai">Selesai</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>

        <select value={fChannel} onChange={(e) => setFChannel(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white">
          <option value="">Semua Channel</option>
          {CHANNELS.map((c) => <option key={c}>{c}</option>)}
        </select>

        <input type="text" value={fCari} onChange={(e) => setFCari(e.target.value)}
          placeholder="Cari no. order / customer..."
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg flex-1 min-w-[180px] outline-none focus:border-blue-400 bg-white" />

        <Button onClick={openBuat}>+ Buat Order</Button>
      </div>

      {/* Tabel */}
      <Table
        headers={['No. Order', 'No. Platform', 'Tgl', 'Channel', 'Jenis', 'Customer', 'Total Pcs', 'Status', 'Aksi']}
        empty={{ icon: '🛒', title: 'Belum ada order', desc: 'Buat order penjualan pertama' }}
      >
        {filtered.map((o) => (
          <Tr key={o.id}>
            <Td mono><span className="font-700 text-gray-800">{o.no}</span></Td>
            <Td mono className="text-[11.5px]">{o.noPlatform || '—'}</Td>
            <Td>{formatDate(o.tgl)}</Td>
            <Td><ChannelBadge channel={o.channel} /></Td>
            <Td>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-600 ${
                o.jenis === 'Grosir' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
              }`}>{o.jenis}</span>
            </Td>
            <Td>{o.namaCustomer || '—'}</Td>
            <Td><span className="font-700">{o.totalPcs}</span> pcs</Td>
            <Td><StatusBadge status={o.status} /></Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openDetail(o)}>Detail</Button>
              <Button size="xs" variant="ghost" onClick={() => openPrint(o)}>Print</Button>
              {o.status === 'Draft' && (
                <>
                  <Button size="xs" variant="primary" onClick={() => openEdit(o)}>Edit</Button>
                  <Button size="xs" variant="success" onClick={() => handleSelesai(o)}>Selesai</Button>
                  <Button size="xs" variant="warning" onClick={() => handleBatal(o)}>Batal</Button>
                </>
              )}
            </TdAction>
          </Tr>
        ))}
      </Table>

      {/* ══ MODAL FORM ══ */}
      <Modal
        open={modalForm.open}
        onClose={modalForm.onClose}
        title={editId ? `Edit Order — ${orderPenjualan.find((o) => o.id === editId)?.no}` : 'Buat Order Penjualan'}
        size="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={modalForm.onClose}>Batal</Button>
            <Button onClick={handleSimpan}>{editId ? 'Simpan Perubahan' : 'Buat Order'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Info Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Channel</label>
              <div className="flex gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-700 border-2 transition-all ${
                      channel === c
                        ? c === 'Shopee' ? 'border-red-400 bg-red-50 text-red-600'
                        : c === 'TikTok' ? 'border-sky-400 bg-sky-50 text-sky-600'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-form">Jenis</label>
              <div className="flex gap-2">
                {JENIS.map((j) => (
                  <button
                    key={j}
                    onClick={() => setJenis(j)}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-700 border-2 transition-all ${
                      jenis === j
                        ? 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-form">Tanggal Order</label>
              <input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} className="input-form" />
            </div>
            <div>
              <label className="label-form">No. Order Platform</label>
              <input type="text" value={noPlatform} onChange={(e) => setNoPlatform(e.target.value)}
                placeholder="Contoh: INV/2026/001" className="input-form" />
            </div>
            <div>
              <label className="label-form">Nama Customer</label>
              <input type="text" value={namaCustomer} onChange={(e) => setNamaCustomer(e.target.value)}
                placeholder="Opsional" className="input-form" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-form mb-0">Item Pesanan</label>
              <button onClick={addItem} className="text-[12px] font-600 text-blue-600 hover:text-blue-700">
                + Tambah Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const batches = item.sku ? getBatchesBySKU(item.sku) : [];
                const stokSKU = item.sku ? getStokSKU(item.sku) : 0;
                const warning = getQtyWarning(item);

                return (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-700 text-gray-400">Item {idx + 1}</span>
                      <button onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-400 text-sm transition-colors">✕</button>
                    </div>

                    {/* Pilih SKU */}
                    <div>
                      <label className="label-form">Produk (SKU)</label>
                      <select
                        value={item.sku}
                        onChange={(e) => setItemSKU(item.id, e.target.value)}
                        className="input-form"
                      >
                        <option value="">Pilih produk</option>
                        {produk.map((p) => {
                          const stok = getStokSKU(p.sku);
                          return (
                            <option key={p.sku} value={p.sku} disabled={stok === 0}>
                              {p.sku} — {p.nama} · {p.warna} · {p.ukuran}
                              {stok === 0 ? ' (Habis)' : ` (${stok} pcs)`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {item.sku && (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Pilih Batch — manual oleh admin */}
                        <div>
                          <label className="label-form">
                            Batch / SP
                            <span className="ml-1 text-[10px] text-blue-500 normal-case font-400">
                              (lihat label fisik baju)
                            </span>
                          </label>
                          <select
                            value={item.batchId}
                            onChange={(e) => setItemBatch(item.id, e.target.value)}
                            className="input-form"
                          >
                            <option value="">Pilih batch</option>
                            {batches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.spNo} · {b.vendor} · sisa {b.sisa} pcs
                              </option>
                            ))}
                          </select>
                          {batches.length === 0 && (
                            <p className="text-[11px] text-red-400 mt-1">Tidak ada batch tersedia</p>
                          )}
                        </div>

                        {/* Qty */}
                        <div>
                          <label className="label-form">Jumlah (pcs)</label>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => setItemQty(item.id, e.target.value)}
                            min={1}
                            className={`input-form text-center font-700 ${warning ? 'border-red-300' : ''}`}
                            placeholder="0"
                          />
                          {warning && (
                            <p className="text-[11px] text-red-400 mt-1">⚠️ {warning}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Info batch terpilih */}
                    {item.batchId && (
                      <div className="flex gap-3 text-[11.5px] bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <span className="text-gray-400">SP:</span>
                        <span className="font-mono font-700">{item.spNo}</span>
                        <span className="text-gray-400">Vendor:</span>
                        <span className="font-600">{item.vendor}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="mt-3 px-4 py-2.5 bg-blue-50 rounded-xl flex justify-between text-[13px]">
              <span className="text-blue-400 font-600">Total Pcs</span>
              <span className="font-extrabold text-blue-700">
                {items.reduce((a, i) => a + Number(i.qty || 0), 0)} pcs
              </span>
            </div>
          </div>

          <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            ⚠️ Stok langsung berkurang saat order dibuat. Pastikan barang fisik sudah diambil dari gudang sesuai batch yang dipilih.
          </p>
        </div>
      </Modal>

      {/* ══ MODAL DETAIL ══ */}
      <Modal
        open={modalDetail.open}
        onClose={modalDetail.onClose}
        title={`Detail Order — ${detailOrder?.no}`}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={modalDetail.onClose}>Tutup</Button>
            <Button variant="ghost" onClick={() => { modalDetail.onClose(); openPrint(detailOrder); }}>
              🖨️ Print
            </Button>
          </div>
        }
      >
        {detailOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              {[
                ['No. Order', detailOrder.no],
                ['No. Platform', detailOrder.noPlatform || '—'],
                ['Tanggal', formatDate(detailOrder.tgl)],
                ['Channel', detailOrder.channel],
                ['Jenis', detailOrder.jenis],
                ['Customer', detailOrder.namaCustomer || '—'],
                ['Total Pcs', `${detailOrder.totalPcs} pcs`],
                ['Status', detailOrder.status],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10.5px] text-gray-400 uppercase tracking-wide">{k}</p>
                  <p className="font-700 text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-gray-50">
                  {['SKU', 'Produk', 'Warna', 'Ukuran', 'Batch (SP)', 'Vendor', 'Qty'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10.5px] font-700 text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detailOrder.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-3 py-2.5 font-mono font-700">{item.sku}</td>
                    <td className="px-3 py-2.5 text-[12px]">{item.produk}</td>
                    <td className="px-3 py-2.5">{item.warna}</td>
                    <td className="px-3 py-2.5">{item.ukuran}</td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px]">{item.spNo}</td>
                    <td className="px-3 py-2.5">{item.vendor}</td>
                    <td className="px-3 py-2.5 font-700">{item.qty} pcs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ══ MODAL PRINT ══ */}
      <Modal
        open={modalPrint.open}
        onClose={modalPrint.onClose}
        title="Print Order Penjualan"
        size="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={modalPrint.onClose}>Tutup</Button>
            <Button onClick={() => window.print()}>🖨️ Print</Button>
          </>
        }
      >
        {detailOrder && (
          <div className="print-area p-8 font-sans text-[13px]">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
              <div>
                <h1 className="text-2xl font-extrabold">{profile.name}</h1>
                <p className="text-[12px] text-gray-500">{profile.alamat}</p>
                <p className="text-[12px] text-gray-500">{profile.telp}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-extrabold uppercase tracking-widest text-gray-700">Order Penjualan</h2>
                <p className="font-mono font-700 text-lg mt-1">{detailOrder.no}</p>
                <p className="text-[12px] text-gray-500">{formatDate(detailOrder.tgl)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5 text-[12.5px]">
              {[
                ['Channel', detailOrder.channel],
                ['Jenis', detailOrder.jenis],
                ['No. Platform', detailOrder.noPlatform || '—'],
                ['Customer', detailOrder.namaCustomer || '—'],
                ['Status', detailOrder.status],
                ['Total Pcs', `${detailOrder.totalPcs} pcs`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k}</p>
                  <p className="font-700">{v}</p>
                </div>
              ))}
            </div>

            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  {['No', 'SKU', 'Produk', 'Warna', 'Ukuran', 'Batch (SP)', 'Qty'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-700 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detailOrder.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-gray-200" style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono font-700">{item.sku}</td>
                    <td className="px-3 py-2.5">{item.produk}</td>
                    <td className="px-3 py-2.5">{item.warna}</td>
                    <td className="px-3 py-2.5">{item.ukuran}</td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px]">{item.spNo}</td>
                    <td className="px-3 py-2.5 font-700">{item.qty}</td>
                  </tr>
                ))}
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <td colSpan={6} className="px-3 py-2.5 text-right font-700">Total</td>
                  <td className="px-3 py-2.5 font-700">{detailOrder.totalPcs} pcs</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
