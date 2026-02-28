// src/pages/Penerimaan.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { formatDate, todayISO, uid, today } from '../utils/formatters';
import { generateNoPenerimaan } from '../utils/generators';
import { generateLabelJadi, generateLabelGrid } from '../utils/barcode';

export default function Penerimaan() {
  const toast         = useToast();
  const penerimaan    = useStore((s) => s.penerimaan);
  const suratPesanan  = useStore((s) => s.suratPesanan);
  const produk        = useStore((s) => s.produk);
  const profile       = useStore((s) => s.profile);
  const labelJadi     = useStore((s) => s.labelJadi);
  const tambahPenerimaan  = useStore((s) => s.tambahPenerimaan);
  const simpanQC          = useStore((s) => s.simpanQC);

  // Filter
  const [fStatus, setFStatus] = useState('');
  const [fSP, setFSP]         = useState('');

  // Modal
  const modalTerima  = useModal();
  const modalDetail  = useModal();
  const modalQC      = useModal();
  const modalLabel   = useModal();

  const [selectedPnr, setSelectedPnr] = useState(null);

  // Form Penerimaan
  const [spId, setSpId]         = useState('');
  const [tglTerima, setTglTerima] = useState(todayISO());
  const [items, setItems]         = useState([]); // pre-filled dari SP
  const [bonusItems, setBonusItems] = useState([]); // bonus SKU

  // Form QC — Koreksi #5: pre-filled, tidak ada pilih produk sendiri
  const [qcItems, setQcItems] = useState([]);

  // Label preview
  const [labelHtml, setLabelHtml] = useState('');

  // Stats
  const stats = useMemo(() => ({
    menungguQC : penerimaan.filter((p) => p.status === 'Menunggu QC').length,
    selesaiQC  : penerimaan.filter((p) => p.status === 'Selesai QC').length,
    total      : penerimaan.length,
    totalLolos : penerimaan.reduce((a, b) => a + (b.totalLolos || 0), 0),
    totalGagal : penerimaan.reduce((a, b) => a + (b.totalGagal || 0), 0),
  }), [penerimaan]);

  // SP yang bisa diterima (Dikirim atau Sebagian)
  const spOptions = useMemo(() => {
    return suratPesanan.filter((s) => s.status === 'Dikirim' || s.status === 'Sebagian');
  }, [suratPesanan]);

  // Filter penerimaan
  const filtered = useMemo(() => {
    return penerimaan
      .filter((p) => {
        if (fStatus && p.status !== fStatus) return false;
        if (fSP && p.spNo !== fSP) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tglTerima || b.tgl) - new Date(a.tglTerima || a.tgl));
  }, [penerimaan, fStatus, fSP]);

  // ── OPEN FORM PENERIMAAN ──
  function openTerima() {
    setSpId('');
    setTglTerima(todayISO());
    setItems([]);
    setBonusItems([]);
    modalTerima.onOpen();
  }

  // Saat pilih SP → pre-fill items dari rows SP
  function onPickSP(id) {
    setSpId(id);
    const sp = suratPesanan.find((s) => s.id === id);
    if (!sp) return setItems([]);
    const filled = (sp.rows || []).map((r) => ({
      id: uid(),
      sku: r.sku,
      produk: r.produk,
      warna: r.warna,
      ukuran: r.ukuran,
      target: r.target,
      dikirim: '',
      isBonus: false,
    }));
    setItems(filled);
  }

  // Update qty dikirim per item
  function setItemDikirim(itemId, val) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, dikirim: val } : i))
    );
  }

  // Tambah bonus SKU
  function addBonus() {
    setBonusItems((prev) => [
      ...prev,
      { id: uid(), sku: '', produk: '', warna: '', ukuran: '', dikirim: '', isBonus: true },
    ]);
  }

  function setBonusSKU(itemId, sku) {
    const p = produk.find((p) => p.sku === sku);
    setBonusItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, sku: p?.sku || '', produk: p?.nama || '', warna: p?.warna || '', ukuran: p?.ukuran || '' }
          : i
      )
    );
  }

  function setBonusDikirim(itemId, val) {
    setBonusItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, dikirim: val } : i))
    );
  }

  function removeBonus(id) {
    setBonusItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Simpan penerimaan
  function handleSimpanTerima() {
    if (!spId) return toast('Pilih SP terlebih dahulu!', 'red');

    const allItems = [...items, ...bonusItems];
    const invalid  = allItems.some((i) => !i.sku || !i.dikirim || Number(i.dikirim) <= 0);
    if (invalid) return toast('Lengkapi qty dikirim semua item!', 'red');

    const sp = suratPesanan.find((s) => s.id === spId);
    const no = generateNoPenerimaan(sp.no, penerimaan);
    const totalDikirim = allItems.reduce((a, i) => a + Number(i.dikirim), 0);

    tambahPenerimaan({
      id: uid(),
      no,
      spNo: sp.no,
      spId: sp.id,
      vendor: sp.vendor,
      vendorKode: sp.vendorKode,
      tgl: todayISO(),
      tglTerima,
      items: allItems.map(({ id, ...i }) => ({
        ...i,
        dikirim: Number(i.dikirim),
        lolos: 0,
        gagal: 0,
        alasan: '',
      })),
      totalDikirim,
      totalLolos: 0,
      totalGagal: 0,
      status: 'Menunggu QC',
    });

    toast(`Penerimaan ${no} tersimpan — menunggu QC ✅`, 'green');
    modalTerima.onClose();
  }

  // ── OPEN QC — Koreksi #5: pre-filled dari penerimaan ──
  function openQC(pnr) {
    setSelectedPnr(pnr);
    // Pre-fill dari items penerimaan — admin TIDAK pilih produk sendiri
    setQcItems(
      (pnr.items || []).map((item) => ({
        ...item,
        lolos: item.lolos || '',
        gagal: item.gagal || '',
        alasan: item.alasan || '',
      }))
    );
    modalQC.onOpen();
  }

  function setQcLolos(idx, val) {
    setQcItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const lolos = Number(val) || 0;
        const gagal = Math.max(0, item.dikirim - lolos);
        return { ...item, lolos, gagal };
      })
    );
  }

  function setQcGagal(idx, val) {
    setQcItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const gagal = Number(val) || 0;
        const lolos = Math.max(0, item.dikirim - gagal);
        return { ...item, gagal, lolos };
      })
    );
  }

  function setQcAlasan(idx, val) {
    setQcItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, alasan: val } : item))
    );
  }

  function handleSimpanQC() {
    const invalid = qcItems.some(
      (i) => i.lolos === '' || i.gagal === '' || Number(i.lolos) + Number(i.gagal) !== Number(i.dikirim)
    );
    if (invalid)
      return toast('Pastikan lolos + gagal = dikirim untuk setiap produk!', 'red');

    simpanQC(selectedPnr.id, qcItems.map((i) => ({
      ...i,
      lolos: Number(i.lolos),
      gagal: Number(i.gagal),
    })));

    toast('QC selesai! Barang lolos masuk gudang ✅', 'green');
    modalQC.onClose();

    // Otomatis buka label setelah QC
    const updated = {
      ...selectedPnr,
      items: qcItems.map((i) => ({ ...i, lolos: Number(i.lolos), gagal: Number(i.gagal) })),
    };
    openLabel(updated);
  }

  // ── LABEL ──
  function openLabel(pnr) {
    setSelectedPnr(pnr);
    const labels = (pnr.items || [])
      .filter((i) => (i.lolos || 0) > 0)
      .map((item) => {
        const p = produk.find((p) => p.sku === item.sku);
        return generateLabelJadi({
          produk: { nama: item.produk, warna: item.warna, ukuran: item.ukuran, sku: item.sku },
          spNo: pnr.spNo,
          cfg: labelJadi,
          brandName: profile.name,
        });
      });
    setLabelHtml(generateLabelGrid(labels));
    modalLabel.onOpen();
  }

  function printLabel() {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Label Barang Jadi</title>
      <style>
        body { margin: 0; padding: 8px; font-family: monospace; }
        @media print { body { margin: 0; padding: 0; } }
      </style></head>
      <body>${labelHtml}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  // ── DETAIL ──
  function openDetail(pnr) {
    setSelectedPnr(pnr);
    modalDetail.onOpen();
  }

  // QC pass rate
  const passRate = stats.totalLolos + stats.totalGagal > 0
    ? Math.round((stats.totalLolos / (stats.totalLolos + stats.totalGagal)) * 100)
    : 0;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Menunggu QC"  value={stats.menungguQC}  sub="perlu diproses"    color="yellow" icon="⏳" />
        <StatCard label="Selesai QC"   value={stats.selesaiQC}   sub="sudah diproses"    color="green"  icon="✅" />
        <StatCard label="Total Lolos"  value={stats.totalLolos}  sub="pcs masuk gudang"  color="blue"   icon="📦" />
        <StatCard label="QC Pass Rate" value={`${passRate}%`}    sub="dari semua QC"     color={passRate >= 90 ? 'green' : 'yellow'} icon="📊" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2.5">
          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white"
          >
            <option value="">Semua Status</option>
            <option value="Menunggu QC">Menunggu QC</option>
            <option value="Selesai QC">Selesai QC</option>
          </select>

          <select
            value={fSP}
            onChange={(e) => setFSP(e.target.value)}
            className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white"
          >
            <option value="">Semua SP</option>
            {[...new Set(penerimaan.map((p) => p.spNo))].map((no) => (
              <option key={no} value={no}>{no}</option>
            ))}
          </select>
        </div>

        <Button onClick={openTerima}>+ Input Penerimaan</Button>
      </div>

      {/* Tabel */}
      <Table
        headers={['No. Penerimaan', 'No. SP', 'Vendor', 'Tgl Terima', 'Total Dikirim', 'Lolos', 'Gagal', 'Status', 'Aksi']}
        empty={{ icon: '📥', title: 'Belum ada penerimaan', desc: 'Input penerimaan setelah barang tiba dari vendor' }}
      >
        {filtered.map((p) => (
          <Tr key={p.id}>
            <Td mono><span className="font-700">{p.no}</span></Td>
            <Td mono className="text-[11.5px]">{p.spNo}</Td>
            <Td>{p.vendor}</Td>
            <Td>{formatDate(p.tglTerima)}</Td>
            <Td><span className="font-700">{p.totalDikirim}</span> pcs</Td>
            <Td>
              <span className="font-700 text-emerald-600">{p.totalLolos || 0}</span>
              <span className="text-gray-400 text-[11px] ml-0.5">pcs</span>
            </Td>
            <Td>
              <span className={`font-700 ${(p.totalGagal || 0) > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {p.totalGagal || 0}
              </span>
              <span className="text-gray-400 text-[11px] ml-0.5">pcs</span>
            </Td>
            <Td><StatusBadge status={p.status} /></Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openDetail(p)}>Detail</Button>
              {p.status === 'Menunggu QC' && (
                <Button size="xs" variant="primary" onClick={() => openQC(p)}>QC</Button>
              )}
              {p.status === 'Selesai QC' && (
                <Button size="xs" variant="ghost" onClick={() => openLabel(p)}>Label</Button>
              )}
            </TdAction>
          </Tr>
        ))}
      </Table>

      {/* ══ MODAL TERIMA ══ */}
      <Modal
        open={modalTerima.open}
        onClose={modalTerima.onClose}
        title="Input Penerimaan Barang"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={modalTerima.onClose}>Batal</Button>
            <Button onClick={handleSimpanTerima}>Simpan Penerimaan</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">No. Surat Pesanan</label>
              <select
                value={spId}
                onChange={(e) => onPickSP(e.target.value)}
                className="input-form"
              >
                <option value="">Pilih SP</option>
                {spOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.no} — {s.vendor}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-form">Tanggal Terima</label>
              <input
                type="date"
                value={tglTerima}
                onChange={(e) => setTglTerima(e.target.value)}
                className="input-form"
              />
            </div>
          </div>

          {/* Items dari SP */}
          {items.length > 0 && (
            <div>
              <p className="label-form mb-2">Produk dari SP — Isi Qty Dikirim</p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex-1">
                      <p className="text-[12.5px] font-700 text-gray-800">
                        {item.sku}
                        <span className="ml-2 font-400 text-gray-500">— {item.produk}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.warna} · {item.ukuran} · Target: {item.target} pcs
                      </p>
                    </div>
                    <div className="w-32 flex-shrink-0">
                      <input
                        type="number"
                        value={item.dikirim}
                        onChange={(e) => setItemDikirim(item.id, e.target.value)}
                        placeholder="Qty terima"
                        min={0}
                        className="input-form text-center font-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonus SKU */}
          {spId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="label-form mb-0">Bonus SKU (opsional)</p>
                <button
                  onClick={addBonus}
                  className="text-[12px] font-600 text-blue-600 hover:text-blue-700"
                >
                  + Tambah Bonus
                </button>
              </div>

              {bonusItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 mb-2">
                  <div className="flex-1">
                    <select
                      value={item.sku}
                      onChange={(e) => setBonusSKU(item.id, e.target.value)}
                      className="input-form text-[12px] mb-1.5"
                    >
                      <option value="">Pilih SKU bonus</option>
                      {produk.map((p) => (
                        <option key={p.sku} value={p.sku}>
                          {p.sku} — {p.nama} · {p.warna} · {p.ukuran}
                        </option>
                      ))}
                    </select>
                    {item.sku && (
                      <p className="text-[11px] text-blue-500">
                        Bonus · {item.warna} · {item.ukuran}
                      </p>
                    )}
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <input
                      type="number"
                      value={item.dikirim}
                      onChange={(e) => setBonusDikirim(item.id, e.target.value)}
                      placeholder="Qty"
                      min={1}
                      className="input-form text-center font-700"
                    />
                  </div>
                  <button
                    onClick={() => removeBonus(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {!spId && (
            <div className="py-8 text-center text-[12px] text-gray-300">
              Pilih No. SP terlebih dahulu untuk melihat daftar produk
            </div>
          )}
        </div>
      </Modal>

      {/* ══ MODAL QC — Koreksi #5 ══ */}
      <Modal
        open={modalQC.open}
        onClose={modalQC.onClose}
        title={`QC — ${selectedPnr?.no}`}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={modalQC.onClose}>Batal</Button>
            <Button variant="success" onClick={handleSimpanQC}>Simpan Hasil QC ✅</Button>
          </>
        }
      >
        {selectedPnr && (
          <div className="space-y-4">
            {/* Info */}
            <div className="px-4 py-3 bg-blue-50 rounded-xl flex gap-6 text-[12.5px]">
              <div>
                <p className="text-[10px] text-blue-400 uppercase">No. Penerimaan</p>
                <p className="font-700 text-blue-800">{selectedPnr.no}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-400 uppercase">No. SP</p>
                <p className="font-700 text-blue-800">{selectedPnr.spNo}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-400 uppercase">Vendor</p>
                <p className="font-700 text-blue-800">{selectedPnr.vendor}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-400 uppercase">Total Dikirim</p>
                <p className="font-700 text-blue-800">{selectedPnr.totalDikirim} pcs</p>
              </div>
            </div>

            <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              ⚠️ <strong>Koreksi #5:</strong> Produk sudah otomatis terisi dari data penerimaan.
              Isi hanya kolom <strong>Lolos</strong>, <strong>Gagal</strong>, dan <strong>Alasan Gagal</strong>.
            </p>

            {/* QC Items — Koreksi #5: pre-filled, tidak ada pilih produk */}
            <div className="space-y-3">
              {qcItems.map((item, idx) => {
                const total = Number(item.lolos || 0) + Number(item.gagal || 0);
                const valid = total === Number(item.dikirim);
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border-2 p-4 transition-colors ${
                      valid
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Info produk — READ ONLY, auto dari penerimaan */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-[13px] font-700 text-gray-800">
                          {item.sku}
                          {item.isBonus && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-600">
                              BONUS
                            </span>
                          )}
                        </p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          {item.produk} · {item.warna} · {item.ukuran}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Dikirim: <strong>{item.dikirim} pcs</strong>
                        </p>
                      </div>

                      {/* Validasi total */}
                      <div className={`text-[11px] font-700 px-2 py-1 rounded-lg ${
                        valid ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {total}/{item.dikirim} pcs
                      </div>
                    </div>

                    {/* Input QC */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10.5px] font-700 text-emerald-600 uppercase tracking-wide block mb-1">
                          ✅ Lolos QC
                        </label>
                        <input
                          type="number"
                          value={item.lolos}
                          onChange={(e) => setQcLolos(idx, e.target.value)}
                          min={0}
                          max={item.dikirim}
                          className="input-form text-center font-700 text-emerald-700 border-emerald-200 focus:border-emerald-400"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-700 text-red-500 uppercase tracking-wide block mb-1">
                          ❌ Gagal QC
                        </label>
                        <input
                          type="number"
                          value={item.gagal}
                          onChange={(e) => setQcGagal(idx, e.target.value)}
                          min={0}
                          max={item.dikirim}
                          className="input-form text-center font-700 text-red-600 border-red-200 focus:border-red-400"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-700 text-gray-400 uppercase tracking-wide block mb-1">
                          Alasan Gagal
                        </label>
                        <input
                          type="text"
                          value={item.alasan}
                          onChange={(e) => setQcAlasan(idx, e.target.value)}
                          placeholder="Cacat jahitan, dll"
                          className="input-form text-[12px]"
                          disabled={Number(item.gagal || 0) === 0}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary QC */}
            <div className="flex gap-4 px-4 py-3 bg-gray-50 rounded-xl text-[12.5px]">
              <div>
                <span className="text-gray-400">Total Lolos: </span>
                <span className="font-700 text-emerald-600">
                  {qcItems.reduce((a, i) => a + Number(i.lolos || 0), 0)} pcs
                </span>
              </div>
              <div>
                <span className="text-gray-400">Total Gagal: </span>
                <span className="font-700 text-red-500">
                  {qcItems.reduce((a, i) => a + Number(i.gagal || 0), 0)} pcs
                </span>
              </div>
              <div>
                <span className="text-gray-400">Pass Rate: </span>
                <span className="font-700 text-blue-600">
                  {(() => {
                    const l = qcItems.reduce((a, i) => a + Number(i.lolos || 0), 0);
                    const t = qcItems.reduce((a, i) => a + Number(i.dikirim || 0), 0);
                    return t > 0 ? `${Math.round((l / t) * 100)}%` : '—';
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ MODAL DETAIL ══ */}
      <Modal
        open={modalDetail.open}
        onClose={modalDetail.onClose}
        title={`Detail Penerimaan — ${selectedPnr?.no}`}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={modalDetail.onClose}>Tutup</Button>
            {selectedPnr?.status === 'Selesai QC' && (
              <Button variant="ghost" onClick={() => { modalDetail.onClose(); openLabel(selectedPnr); }}>
                🏷️ Cetak Label
              </Button>
            )}
          </div>
        }
      >
        {selectedPnr && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-[12.5px]">
              {[
                ['No. Penerimaan', selectedPnr.no],
                ['No. SP', selectedPnr.spNo],
                ['Vendor', selectedPnr.vendor],
                ['Tgl Terima', formatDate(selectedPnr.tglTerima)],
                ['Total Dikirim', `${selectedPnr.totalDikirim} pcs`],
                ['Status', selectedPnr.status],
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
                  {['SKU', 'Produk', 'Warna', 'Ukuran', 'Dikirim', 'Lolos', 'Gagal', 'Alasan'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10.5px] font-700 text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedPnr.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-3 py-2.5 font-mono font-700">{item.sku}</td>
                    <td className="px-3 py-2.5 text-[12px]">{item.produk}</td>
                    <td className="px-3 py-2.5">{item.warna}</td>
                    <td className="px-3 py-2.5">{item.ukuran}</td>
                    <td className="px-3 py-2.5 font-700">{item.dikirim}</td>
                    <td className="px-3 py-2.5 font-700 text-emerald-600">{item.lolos || 0}</td>
                    <td className="px-3 py-2.5 font-700 text-red-500">{item.gagal || 0}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-gray-400">{item.alasan || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ══ MODAL LABEL ══ */}
      <Modal
        open={modalLabel.open}
        onClose={modalLabel.onClose}
        title="Cetak Label Barang Jadi"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={modalLabel.onClose}>Tutup</Button>
            <Button onClick={printLabel}>🖨️ Print Label</Button>
          </>
        }
      >
        <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
          ⚠️ Wajib cetak dan tempel label ke setiap pcs barang sebelum masuk gudang.
          Label berisi barcode SKU + kode batch SP untuk tracking.
        </p>
        <div
          className="border border-gray-200 rounded-xl p-4 bg-white overflow-auto max-h-96"
          dangerouslySetInnerHTML={{ __html: labelHtml }}
        />
        <p className="text-center text-[11px] text-gray-400 mt-2">
          Ukuran: {labelJadi?.lebar || 58}×{labelJadi?.tinggi || 40}mm · Thermal Printer
        </p>
      </Modal>
    </div>
  );
}
