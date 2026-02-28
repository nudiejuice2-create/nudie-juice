// src/pages/SuratPesanan.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { SPBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/Toast';
import { formatDate, todayISO, uid, today } from '../utils/formatters';
import { generateNoSP } from '../utils/generators';

const emptyRow = { sku: '', produk: '', warna: '', ukuran: '', target: '' };

export default function SuratPesanan() {
  const toast          = useToast();
  const suratPesanan   = useStore((s) => s.suratPesanan);
  const vendors        = useStore((s) => s.vendors);
  const produk         = useStore((s) => s.produk);
  const gudangBB       = useStore((s) => s.gudangBB);
  const profile        = useStore((s) => s.profile);
  const tambahSP       = useStore((s) => s.tambahSP);
  const updateSP       = useStore((s) => s.updateSP);
  const kirimSP        = useStore((s) => s.kirimSP);
  const hapusSP        = useStore((s) => s.hapusSP);

  // ── State ──
  const [fStatus, setFStatus] = useState('');
  const [step, setStep]       = useState(1); // 1 | 2
  const [editId, setEditId]   = useState(null);

  // Form Step 1
  const [vendorId, setVendorId]   = useState('');
  const [catatan, setCatatan]     = useState('');
  const [rows, setRows]           = useState([{ ...emptyRow, id: uid() }]);
  const [fKatFilter, setFKatFilter] = useState(''); // filter kategori opsional

  // Form Step 2
  const [selectedRolls, setSelectedRolls] = useState([]);

  // Modal
  const modalForm   = useModal();
  const modalDetail = useModal();
  const modalPrint  = useModal();
  const [detailSP, setDetailSP] = useState(null);

  // ── Filter tabel utama ──
  const filtered = useMemo(() => {
    return suratPesanan.filter((s) => !fStatus || s.status === fStatus);
  }, [suratPesanan, fStatus]);

  // ── Kategori unik dari produk (untuk filter opsional) ──
  const kategoriList = useMemo(() => {
    return [...new Set(produk.map((p) => p.kategoriNama))];
  }, [produk]);

  // ── Produk tersedia untuk dropdown — Koreksi #2 ──
  // Filter berdasarkan kategori kalau dipilih, tapi kategori OPSIONAL
  const produkOptions = useMemo(() => {
    return produk.filter((p) => !fKatFilter || p.kategoriNama === fKatFilter);
  }, [produk, fKatFilter]);

  // ── Roll tersedia di gudang BB ──
  const rollTersedia = useMemo(() => {
    return gudangBB.filter((r) => r.status === 'Tersedia');
  }, [gudangBB]);

  // ── Roll yang sudah dipilih sebelumnya (saat edit) ──
  const rollSebelumnya = useMemo(() => {
    if (!editId) return [];
    const sp = suratPesanan.find((s) => s.id === editId);
    return sp?.rollIds || [];
  }, [editId, suratPesanan]);

  // ── Stats ──
  const stats = useMemo(() => ({
    draft    : suratPesanan.filter((s) => s.status === 'Draft').length,
    dikirim  : suratPesanan.filter((s) => s.status === 'Dikirim').length,
    sebagian : suratPesanan.filter((s) => s.status === 'Sebagian').length,
    selesai  : suratPesanan.filter((s) => s.status === 'Selesai').length,
  }), [suratPesanan]);

  // ────────────────────────────────────────────
  // OPEN FORM — Buat Baru
  // ────────────────────────────────────────────
  function openBuat() {
    setEditId(null);
    setStep(1);
    setVendorId('');
    setCatatan('');
    setRows([{ ...emptyRow, id: uid() }]);
    setFKatFilter('');
    setSelectedRolls([]);
    modalForm.onOpen();
  }

  // ────────────────────────────────────────────
  // OPEN FORM — Edit Draft (Koreksi #1)
  // ────────────────────────────────────────────
  function openEdit(sp) {
    setEditId(sp.id);
    setStep(1);

    // Load data lama ke form
    const vendor = vendors.find((v) => v.kode === sp.vendorKode);
    setVendorId(vendor?.id || '');
    setCatatan(sp.catatan || '');

    // Load rows lama
    const loadedRows = (sp.rows || []).map((r) => ({ ...r, id: uid() }));
    setRows(loadedRows.length > 0 ? loadedRows : [{ ...emptyRow, id: uid() }]);

    setFKatFilter('');

    // Koreksi #1: roll lama dikembalikan statusnya ke Tersedia saat edit dibuka
    // (dilakukan di store action openEditSP)
    setSelectedRolls(sp.rollIds || []);

    modalForm.onOpen();
  }

  // ────────────────────────────────────────────
  // ROWS MANAGEMENT
  // ────────────────────────────────────────────
  function addRow() {
    setRows((r) => [...r, { ...emptyRow, id: uid() }]);
  }

  function removeRow(id) {
    if (rows.length === 1) return toast('Minimal 1 produk!', 'red');
    setRows((r) => r.filter((row) => row.id !== id));
  }

  // Koreksi #2: Pilih SKU langsung → auto-isi warna & ukuran
  function setRowSKU(rowId, sku) {
    const p = produk.find((p) => p.sku === sku);
    setRows((rows) =>
      rows.map((r) =>
        r.id === rowId
          ? { ...r, sku: p?.sku || '', produk: p?.nama || '', warna: p?.warna || '', ukuran: p?.ukuran || '' }
          : r
      )
    );
  }

  function setRowTarget(rowId, val) {
    setRows((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, target: val } : r))
    );
  }

  // ────────────────────────────────────────────
  // VALIDASI STEP 1 → STEP 2
  // ────────────────────────────────────────────
  function goStep2() {
    if (!vendorId) return toast('Pilih vendor!', 'red');
    const invalid = rows.some((r) => !r.sku || !r.target || Number(r.target) <= 0);
    if (invalid) return toast('Lengkapi semua produk & target!', 'red');

    // Cek duplikat SKU
    const skus = rows.map((r) => r.sku);
    if (new Set(skus).size !== skus.length) return toast('SKU tidak boleh duplikat dalam 1 SP!', 'red');

    setStep(2);
  }

  // ────────────────────────────────────────────
  // TOGGLE ROLL
  // ────────────────────────────────────────────
  function toggleRoll(id) {
    setSelectedRolls((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  // ────────────────────────────────────────────
  // SIMPAN DRAFT
  // ────────────────────────────────────────────
  function handleSimpanDraft() {
    const vendor = vendors.find((v) => v.id === vendorId);
    const produkStr = rows.map((r) => `${r.sku} (${r.target}pcs)`).join(', ');
    const targetTotal = rows.reduce((a, r) => a + Number(r.target || 0), 0);

    const data = {
      no: editId
        ? suratPesanan.find((s) => s.id === editId)?.no
        : generateNoSP(vendor.kode, suratPesanan),
      tgl: todayISO(),
      vendor: vendor.nama,
      vendorKode: vendor.kode,
      rows: rows.map(({ id, ...r }) => r),
      produkStr,
      targetTotal,
      rollIds: selectedRolls,
      catatan,
      status: 'Draft',
      diterima: 0,
    };

    if (editId) {
      updateSP(editId, data);
      toast('SP berhasil diperbarui ✅', 'green');
    } else {
      tambahSP({ id: uid(), ...data });
      toast(`SP ${data.no} tersimpan sebagai Draft ✅`, 'green');
    }
    modalForm.onClose();
  }

  // ────────────────────────────────────────────
  // SIMPAN & KIRIM
  // ────────────────────────────────────────────
  function handleSimpanKirim() {
    if (selectedRolls.length === 0)
      return toast('Pilih minimal 1 roll kain!', 'red');

    const vendor = vendors.find((v) => v.id === vendorId);
    const produkStr = rows.map((r) => `${r.sku} (${r.target}pcs)`).join(', ');
    const targetTotal = rows.reduce((a, r) => a + Number(r.target || 0), 0);

    const spId = editId || uid();
    const no   = editId
      ? suratPesanan.find((s) => s.id === editId)?.no
      : generateNoSP(vendor.kode, suratPesanan);

    const data = {
      no,
      tgl: todayISO(),
      vendor: vendor.nama,
      vendorKode: vendor.kode,
      rows: rows.map(({ id, ...r }) => r),
      produkStr,
      targetTotal,
      rollIds: selectedRolls,
      catatan,
      status: 'Dikirim',
      diterima: 0,
    };

    if (editId) {
      updateSP(editId, data);
    } else {
      tambahSP({ id: spId, ...data });
    }

    // Update status roll → Terpakai SP
    kirimSP(editId || spId, selectedRolls, no);
    toast(`SP ${no} dikirim ke vendor ${vendor.nama} 📤`, 'blue');
    modalForm.onClose();
  }

  // ────────────────────────────────────────────
  // KIRIM SP yang masih Draft
  // ────────────────────────────────────────────
  function handleKirimDraft(sp) {
    if (!sp.rollIds || sp.rollIds.length === 0)
      return toast('SP ini belum ada roll kain. Edit dulu untuk pilih kain!', 'red');
    if (!window.confirm(`Kirim SP ${sp.no} ke ${sp.vendor}?`)) return;
    kirimSP(sp.id, sp.rollIds, sp.no);
    toast(`SP ${sp.no} dikirim 📤`, 'blue');
  }

  // ────────────────────────────────────────────
  // HAPUS SP
  // ────────────────────────────────────────────
  function handleHapus(sp) {
    if (!window.confirm(`Hapus SP ${sp.no}? Data tidak bisa dikembalikan.`)) return;
    hapusSP(sp.id);
    toast(`SP ${sp.no} dihapus`, 'red');
  }

  // ────────────────────────────────────────────
  // DETAIL & PRINT
  // ────────────────────────────────────────────
  function openDetail(sp) {
    setDetailSP(sp);
    modalDetail.onOpen();
  }

  function openPrint(sp) {
    setDetailSP(sp);
    modalPrint.onOpen();
  }

  function handlePrint() {
    window.print();
  }

  // Roll yang dipakai di SP detail
  const rollsDetail = useMemo(() => {
    if (!detailSP) return [];
    return gudangBB.filter((r) => detailSP.rollIds?.includes(r.id));
  }, [detailSP, gudangBB]);

  // Roll yang tersedia untuk dipilih di Step 2
  // Termasuk roll yang sebelumnya dipilih (saat edit)
  const rollUntukDipilih = useMemo(() => {
    if (!editId) return rollTersedia;
    const sp = suratPesanan.find((s) => s.id === editId);
    const rollLama = gudangBB.filter((r) => sp?.rollIds?.includes(r.id));
    const tersedia = gudangBB.filter((r) => r.status === 'Tersedia' && !sp?.rollIds?.includes(r.id));
    return [...rollLama, ...tersedia];
  }, [editId, rollTersedia, gudangBB, suratPesanan]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Draft"    value={stats.draft}    sub="belum dikirim"   color="gray"   icon="📝" />
        <StatCard label="Dikirim"  value={stats.dikirim}  sub="di vendor"       color="blue"   icon="📤" />
        <StatCard label="Sebagian" value={stats.sebagian} sub="parsial masuk"   color="yellow" icon="📦" />
        <StatCard label="Selesai"  value={stats.selesai}  sub="semua selesai"   color="green"  icon="✅" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="">Semua Status</option>
          <option value="Draft">Draft</option>
          <option value="Dikirim">Dikirim</option>
          <option value="Sebagian">Sebagian</option>
          <option value="Selesai">Selesai</option>
        </select>
        <Button onClick={openBuat}>+ Buat SP</Button>
      </div>

      {/* Tabel */}
      <Table
        headers={['No. SP', 'Tgl', 'Vendor', 'Produk', 'Target', 'Diterima', 'Status', 'Aksi']}
        empty={{ icon: '📋', title: 'Belum ada SP', desc: 'Buat Surat Pesanan pertama ke vendor' }}
      >
        {filtered.map((sp) => (
          <Tr key={sp.id}>
            <Td mono><span className="font-700 text-gray-800">{sp.no}</span></Td>
            <Td>{formatDate(sp.tgl)}</Td>
            <Td><span className="font-600">{sp.vendor}</span></Td>
            <Td>
              <span className="text-[11.5px] text-gray-500 truncate max-w-[200px] block">
                {sp.produkStr}
              </span>
            </Td>
            <Td><span className="font-700">{sp.targetTotal}</span> pcs</Td>
            <Td>
              <span className="font-700">{sp.diterima || 0}</span> pcs
              {sp.targetTotal > 0 && (
                <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((sp.diterima || 0) / sp.targetTotal) * 100))}%` }}
                  />
                </div>
              )}
            </Td>
            <Td><SPBadge status={sp.status} /></Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openDetail(sp)}>Detail</Button>
              <Button size="xs" variant="ghost" onClick={() => openPrint(sp)}>Print</Button>
              {/* Koreksi #1: tombol Edit hanya untuk Draft */}
              {sp.status === 'Draft' && (
                <Button size="xs" variant="primary" onClick={() => openEdit(sp)}>Edit</Button>
              )}
              {sp.status === 'Draft' && (
                <Button size="xs" variant="success" onClick={() => handleKirimDraft(sp)}>Kirim</Button>
              )}
              {sp.status === 'Draft' && (
                <Button size="xs" variant="danger" onClick={() => handleHapus(sp)}>Hapus</Button>
              )}
            </TdAction>
          </Tr>
        ))}
      </Table>

      {/* ══════════════════════════════════════
          MODAL FORM — 2 Step
      ══════════════════════════════════════ */}
      <Modal
        open={modalForm.open}
        onClose={modalForm.onClose}
        title={editId ? `Edit SP — ${suratPesanan.find((s) => s.id === editId)?.no}` : 'Buat Surat Pesanan'}
        size="xl"
        footer={
          step === 1 ? (
            <>
              <Button variant="secondary" onClick={modalForm.onClose}>Batal</Button>
              <Button onClick={goStep2}>Pilih Kain →</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep(1)}>← Kembali</Button>
              <Button variant="secondary" onClick={handleSimpanDraft}>Simpan Draft</Button>
              <Button variant="success" onClick={handleSimpanKirim}>Simpan & Kirim 📤</Button>
            </>
          )
        }
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-[12px] font-700 ${step >= s ? 'text-blue-600' : 'text-gray-300'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</span>
                {s === 1 ? 'Info & Produk' : 'Pilih Kain'}
              </div>
              {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-blue-300' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Vendor */}
            <div>
              <label className="label-form">Vendor / Konveksi</label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="input-form"
              >
                <option value="">Pilih vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.nama} ({v.kode})</option>
                ))}
              </select>
            </div>

            {/* Daftar Produk */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-form mb-0">Produk yang Dipesan</label>

                {/* Filter kategori — OPSIONAL (Koreksi #2) */}
                <select
                  value={fKatFilter}
                  onChange={(e) => setFKatFilter(e.target.value)}
                  className="text-[11px] px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-500"
                >
                  <option value="">Filter kategori (opsional)</option>
                  {kategoriList.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {rows.map((row, idx) => (
                  <div key={row.id} className="flex gap-2 items-start bg-gray-50 rounded-xl p-3">
                    <span className="text-[11px] font-700 text-gray-400 pt-2.5 w-5 flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Koreksi #2: Dropdown langsung nama produk/SKU */}
                    <div className="flex-1">
                      <select
                        value={row.sku}
                        onChange={(e) => setRowSKU(row.id, e.target.value)}
                        className="input-form text-[12px]"
                      >
                        <option value="">Pilih produk (SKU)</option>
                        {produkOptions.map((p) => (
                          <option key={p.sku} value={p.sku}>
                            {p.sku} — {p.nama} · {p.warna} · {p.ukuran}
                          </option>
                        ))}
                      </select>

                      {/* Auto-fill warna & ukuran */}
                      {row.sku && (
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-[11px] px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-500">
                            🎨 {row.warna}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-500">
                            📏 {row.ukuran}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Target pcs */}
                    <div className="w-28 flex-shrink-0">
                      <input
                        type="number"
                        value={row.target}
                        onChange={(e) => setRowTarget(row.id, e.target.value)}
                        placeholder="Target pcs"
                        min={1}
                        className="input-form text-[12px]"
                      />
                    </div>

                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors pt-2 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addRow}
                className="mt-2 text-[12px] font-600 text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                + Tambah Produk
              </button>
            </div>

            {/* Catatan */}
            <div>
              <label className="label-form">Catatan untuk Vendor (opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                className="input-form resize-none"
                placeholder="Instruksi khusus, deadline, dll..."
              />
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-blue-50 rounded-xl">
              <p className="text-[11px] text-blue-400 uppercase tracking-wide mb-1">Ringkasan SP</p>
              <p className="text-[13px] font-700 text-blue-800">
                {vendors.find((v) => v.id === vendorId)?.nama} —{' '}
                {rows.reduce((a, r) => a + Number(r.target || 0), 0)} pcs
              </p>
              <p className="text-[11px] text-blue-500 mt-0.5">
                {rows.map((r) => r.sku).filter(Boolean).join(', ')}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-form mb-0">
                  Pilih Roll Kain yang Dikirim
                </label>
                <span className="text-[11px] text-blue-600 font-700">
                  {selectedRolls.length} roll dipilih
                </span>
              </div>

              <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-3">
                ⚠️ Semua roll yang dipilih harus dikirim sekaligus ke vendor.
              </p>

              {rollUntukDipilih.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-gray-400">
                  Tidak ada roll tersedia di gudang
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {rollUntukDipilih.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedRolls.includes(r.id)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRolls.includes(r.id)}
                        onChange={() => toggleRoll(r.id)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-700 font-mono text-gray-800">{r.barcode}</p>
                        <p className="text-[11px] text-gray-400">
                          {r.jenis} · {r.supplier} · {r.meter}m
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════
          MODAL DETAIL SP
      ══════════════════════════════════════ */}
      <Modal
        open={modalDetail.open}
        onClose={modalDetail.onClose}
        title={`Detail SP — ${detailSP?.no}`}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={modalDetail.onClose}>Tutup</Button>
            <Button variant="ghost" onClick={() => { modalDetail.onClose(); openPrint(detailSP); }}>
              🖨️ Print
            </Button>
          </div>
        }
      >
        {detailSP && (
          <div className="space-y-5">
            {/* Info SP */}
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              {[
                ['No. SP', detailSP.no],
                ['Tanggal', formatDate(detailSP.tgl)],
                ['Vendor', detailSP.vendor],
                ['Status', detailSP.status],
                ['Target', `${detailSP.targetTotal} pcs`],
                ['Diterima', `${detailSP.diterima || 0} pcs`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-400 text-[10.5px] uppercase tracking-wide">{k}</p>
                  <p className="font-700 text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            {/* Produk */}
            <div>
              <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-2">Produk Dipesan</p>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-gray-50">
                    {['SKU', 'Nama', 'Warna', 'Ukuran', 'Target'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10.5px] font-700 text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detailSP.rows || []).map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-mono font-700">{r.sku}</td>
                      <td className="px-3 py-2">{r.produk}</td>
                      <td className="px-3 py-2">{r.warna}</td>
                      <td className="px-3 py-2">{r.ukuran}</td>
                      <td className="px-3 py-2 font-700">{r.target} pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Roll kain */}
            <div>
              <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-2">
                Roll Kain Dikirim ({rollsDetail.length} roll)
              </p>
              {rollsDetail.length === 0 ? (
                <p className="text-[12px] text-gray-300 italic">Belum ada roll dipilih</p>
              ) : (
                <div className="space-y-1.5">
                  {rollsDetail.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-[12px]">
                      <span className="font-mono font-700 text-gray-800">{r.barcode}</span>
                      <span className="text-gray-400">·</span>
                      <span>{r.jenis}</span>
                      <span className="text-gray-400">·</span>
                      <span>{r.meter}m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detailSP.catatan && (
              <div>
                <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-1">Catatan</p>
                <p className="text-[12.5px] text-gray-600">{detailSP.catatan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════
          MODAL PRINT SP
      ══════════════════════════════════════ */}
      <Modal
        open={modalPrint.open}
        onClose={modalPrint.onClose}
        title="Print Surat Pesanan"
        size="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={modalPrint.onClose}>Tutup</Button>
            <Button onClick={handlePrint}>🖨️ Print</Button>
          </>
        }
      >
        {detailSP && (
          <div id="print-sp" className="print-area p-8 font-sans text-[13px]">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">{profile.name}</h1>
                <p className="text-[12px] text-gray-500">{profile.sub}</p>
                <p className="text-[12px] text-gray-500 mt-1">{profile.alamat}</p>
                <p className="text-[12px] text-gray-500">{profile.telp}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-extrabold uppercase tracking-widest text-gray-700">
                  Surat Pesanan
                </h2>
                <p className="font-mono font-700 text-lg mt-1">{detailSP.no}</p>
                <p className="text-[12px] text-gray-500 mt-1">{formatDate(detailSP.tgl)}</p>
              </div>
            </div>

            {/* Info Vendor */}
            <div className="mb-5">
              <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-1">Kepada Yth.</p>
              <p className="font-700 text-[15px]">{detailSP.vendor}</p>
              <p className="text-[12px] text-gray-500">{detailSP.vendorKode}</p>
            </div>

            {/* Tabel Produk */}
            <table className="w-full border-collapse mb-5 text-[12.5px]">
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  {['No', 'SKU', 'Nama Produk', 'Warna', 'Ukuran', 'Target (pcs)'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-700 text-[11px] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detailSP.rows || []).map((r, i) => (
                  <tr key={i} className="border-b border-gray-200" style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono font-700">{r.sku}</td>
                    <td className="px-3 py-2.5">{r.produk}</td>
                    <td className="px-3 py-2.5">{r.warna}</td>
                    <td className="px-3 py-2.5">{r.ukuran}</td>
                    <td className="px-3 py-2.5 font-700">{r.target}</td>
                  </tr>
                ))}
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <td colSpan={5} className="px-3 py-2.5 font-700 text-right">Total Target</td>
                  <td className="px-3 py-2.5 font-700">{detailSP.targetTotal} pcs</td>
                </tr>
              </tbody>
            </table>

            {/* Roll Kain */}
            {rollsDetail.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-2">
                  Bahan Baku Dikirim
                </p>
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-gray-100">
                      {['Barcode', 'Jenis', 'Meter'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-700 text-[11px] uppercase text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rollsDetail.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 font-mono font-700">{r.barcode}</td>
                        <td className="px-3 py-2">{r.jenis}</td>
                        <td className="px-3 py-2">{r.meter}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detailSP.catatan && (
              <div className="mb-6 px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-[11px] font-700 text-gray-400 uppercase mb-1">Catatan</p>
                <p className="text-[12.5px]">{detailSP.catatan}</p>
              </div>
            )}

            {/* Tanda Tangan */}
            <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-200">
              {['Dibuat Oleh', 'Disetujui', 'Vendor', 'Penerima Barang'].map((label) => (
                <div key={label} className="text-center">
                  <p className="text-[11px] font-700 text-gray-500 uppercase tracking-wide mb-12">{label}</p>
                  <div className="border-t border-gray-400 pt-1">
                    <p className="text-[10px] text-gray-300">Nama & Tanda Tangan</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-area { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
