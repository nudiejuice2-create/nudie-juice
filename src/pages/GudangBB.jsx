// src/pages/GudangBB.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/Toast';
import { formatDate, todayISO, uid } from '../utils/formatters';
import { generateBarcodeRoll } from '../utils/generators';
import { generateLabelBB, generateBarcodeSVG } from '../utils/barcode';

const emptyForm = {
  supplierKode: '', jenis: '', meter: '', kondisi: 'Baik',
  barcodeSupp: '', catatan: '',
};

const emptyKembali = { meter: '', kondisi: 'Baik', catatan: '' };

export default function GudangBB() {
  const toast       = useToast();
  const gudangBB    = useStore((s) => s.gudangBB);
  const suppliers   = useStore((s) => s.suppliers);
  const profile     = useStore((s) => s.profile);
  const labelBB     = useStore((s) => s.labelBB);
  const tambahRoll      = useStore((s) => s.tambahRoll);
  const hapusRoll       = useStore((s) => s.hapusRoll);
  const kembalikanRoll  = useStore((s) => s.kembalikanRoll);
  const returRollManual = useStore((s) => s.returRollManual);

  // Filter — Koreksi #3: default hanya tampil Tersedia
  const [fStatus, setFStatus]   = useState('Tersedia');
  const [fSupp, setFSupp]       = useState('');
  const [fCari, setFCari]       = useState('');

  // Modal states
  const modalTerima  = useModal();
  const modalDetail  = useModal();
  const modalKembali = useModal();
  const modalLabel   = useModal();

  const [form, setForm]           = useState(emptyForm);
  const [selected, setSelected]   = useState(null);
  const [formKembali, setFormKembali] = useState(emptyKembali);
  const [previewBarcode, setPreviewBarcode] = useState('');
  const [labelHtml, setLabelHtml] = useState('');

  // ── KOREKSI #3: Default hanya tampil Tersedia ──
  const filtered = useMemo(() => {
    return gudangBB.filter((r) => {
      if (fStatus && r.status !== fStatus) return false;
      if (fSupp && r.supplier !== fSupp) return false;
      if (fCari && !r.barcode?.toLowerCase().includes(fCari.toLowerCase()) &&
          !r.jenis?.toLowerCase().includes(fCari.toLowerCase())) return false;
      return true;
    });
  }, [gudangBB, fStatus, fSupp, fCari]);

  // Stats — hanya hitung yang Tersedia (Koreksi #3)
  const rollTersedia = gudangBB.filter((r) => r.status === 'Tersedia').length;
  const meterTersedia = gudangBB
    .filter((r) => r.status === 'Tersedia')
    .reduce((a, b) => a + Number(b.meter || 0), 0);
  const rollTerpakai = gudangBB.filter((r) => r.status === 'Terpakai SP').length;
  const rollRetur    = gudangBB.filter((r) => r.status === 'Di Gudang Retur').length;

  // Generate barcode preview saat pilih supplier
  function onSupplierChange(kode) {
    setForm((f) => ({ ...f, supplierKode: kode }));
    if (kode) {
      const bc = generateBarcodeRoll(kode, gudangBB);
      setPreviewBarcode(bc);
    } else {
      setPreviewBarcode('');
    }
  }

  function handleTerima() {
    if (!form.supplierKode) return toast('Pilih supplier!', 'red');
    if (!form.jenis.trim()) return toast('Isi jenis kain!', 'red');
    if (!form.meter || Number(form.meter) <= 0) return toast('Isi jumlah meter!', 'red');
    if (!form.barcodeSupp.trim()) return toast('Isi barcode supplier!', 'red');

    const barcode = generateBarcodeRoll(form.supplierKode, gudangBB);
    const supp    = suppliers.find((s) => s.kode === form.supplierKode);

    tambahRoll({
      id: uid(),
      barcode,
      barcodeSupp: form.barcodeSupp.trim(),
      jenis: form.jenis.trim(),
      supplier: supp?.nama || '',
      supplierKode: form.supplierKode,
      meter: Number(form.meter),
      kondisi: form.kondisi,
      tgl: todayISO(),
      status: 'Tersedia',
      spNo: null,
      catatan: form.catatan.trim(),
    });

    toast(`Roll ${barcode} berhasil ditambah ✅`, 'green');
    setForm(emptyForm);
    setPreviewBarcode('');
    modalTerima.onClose();
  }

  function openDetail(roll) {
    setSelected(roll);
    modalDetail.onOpen();
  }

  function openKembali(roll) {
    setSelected(roll);
    setFormKembali(emptyKembali);
    modalKembali.onOpen();
  }

  function handleKembali() {
    if (!formKembali.meter || Number(formKembali.meter) < 0)
      return toast('Isi meter sisa!', 'red');

    kembalikanRoll(selected.id, {
      meterSisa: Number(formKembali.meter),
      kondisi: formKembali.kondisi,
      catatan: formKembali.catatan,
    });

    toast(
      formKembali.kondisi === 'Rusak'
        ? `Roll ${selected.barcode} → Gudang Retur 🔴`
        : `Roll ${selected.barcode} → Tersedia ✅`,
      formKembali.kondisi === 'Rusak' ? 'red' : 'green'
    );
    modalKembali.onClose();
  }

  function handleReturManual(roll) {
    if (!window.confirm(`Retur roll ${roll.barcode} ke supplier?`)) return;
    returRollManual(roll.id);
    toast(`Roll ${roll.barcode} masuk Gudang Retur`, 'yellow');
  }

  function handleHapus(roll) {
    if (!window.confirm(`Hapus roll ${roll.barcode}? Data tidak bisa dikembalikan.`)) return;
    hapusRoll(roll.id);
    toast('Roll dihapus', 'red');
  }

  function openLabel(roll) {
    setSelected(roll);
    const html = generateLabelBB({
      roll,
      cfg: labelBB,
      brandName: profile.name,
    });
    setLabelHtml(html);
    modalLabel.onOpen();
  }

  function printLabel() {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Label BB</title>
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

  const statusOptions = ['Tersedia', 'Terpakai SP', 'Kembali dari Vendor', 'Di Gudang Retur'];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Roll Tersedia"  value={rollTersedia}  sub={`${meterTersedia.toLocaleString()} meter`} color="green"  icon="🧵" />
        <StatCard label="Terpakai SP"    value={rollTerpakai}  sub="di vendor"        color="blue"   icon="📤" />
        <StatCard label="Di Gudang Retur" value={rollRetur}    sub="menunggu retur"   color="red"    icon="↩️" />
        <StatCard label="Total Roll"     value={gudangBB.length} sub="semua status"   color="gray"   icon="📦" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-700 text-gray-500">
          Daftar Roll Kain
          {fStatus === 'Tersedia' && (
            <span className="ml-2 text-[11px] text-blue-500 font-500">
              (menampilkan roll tersedia)
            </span>
          )}
        </h2>
        <Button onClick={modalTerima.onOpen}>+ Terima Roll</Button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 mb-4 flex gap-2.5 flex-wrap shadow-sm">
        {/* Koreksi #3: filter status default Tersedia */}
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 min-w-[160px]"
        >
          <option value="Tersedia">Tersedia (Default)</option>
          <option value="">Semua Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={fSupp}
          onChange={(e) => setFSupp(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 min-w-[160px]"
        >
          <option value="">Semua Supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.nama}>{s.nama}</option>
          ))}
        </select>

        <input
          type="text"
          value={fCari}
          onChange={(e) => setFCari(e.target.value)}
          placeholder="Cari barcode / jenis kain..."
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg flex-1 min-w-[180px] outline-none focus:border-blue-400"
        />
      </div>

      {/* Tabel */}
      <Table
        headers={['Barcode Internal', 'Barcode Supplier', 'Jenis', 'Supplier', 'Meter', 'Kondisi', 'Tgl Masuk', 'Status', 'Aksi']}
        empty={{ icon: '🧵', title: 'Tidak ada roll kain', desc: 'Terima roll bahan baku terlebih dahulu' }}
      >
        {filtered.map((r) => (
          <Tr key={r.id}>
            <Td mono>
              <span className="font-700 text-gray-800">{r.barcode}</span>
            </Td>
            <Td mono>{r.barcodeSupp || '—'}</Td>
            <Td>{r.jenis}</Td>
            <Td>{r.supplier}</Td>
            <Td><span className="font-700">{r.meter}</span> m</Td>
            <Td>{r.kondisi}</Td>
            <Td>{formatDate(r.tgl)}</Td>
            <Td><StatusBadge status={r.status} /></Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openDetail(r)}>Detail</Button>
              <Button size="xs" variant="ghost" onClick={() => openLabel(r)}>Label</Button>
              {r.status === 'Kembali dari Vendor' && (
                <Button size="xs" variant="success" onClick={() => openKembali(r)}>Proses</Button>
              )}
              {r.status === 'Tersedia' && (
                <Button size="xs" variant="warning" onClick={() => handleReturManual(r)}>Retur</Button>
              )}
              {r.status === 'Tersedia' && (
                <Button size="xs" variant="danger" onClick={() => handleHapus(r)}>Hapus</Button>
              )}
            </TdAction>
          </Tr>
        ))}
      </Table>

      {/* Modal Terima Roll */}
      <Modal
        open={modalTerima.open}
        onClose={modalTerima.onClose}
        title="Terima Roll Kain Baru"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={modalTerima.onClose}>Batal</Button>
            <Button onClick={handleTerima}>Simpan & Generate Barcode</Button>
          </>
        }
      >
        <div className="space-y-4">
          {previewBarcode && (
            <div className="px-4 py-3 rounded-xl text-center bg-blue-50">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Barcode Internal</p>
              <p className="text-lg font-extrabold text-blue-700 font-mono">{previewBarcode}</p>
              <div className="flex justify-center mt-2"
                dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(previewBarcode, 160, 28) }} />
            </div>
          )}

          <div>
            <label className="label-form">Supplier</label>
            <select
              value={form.supplierKode}
              onChange={(e) => onSupplierChange(e.target.value)}
              className="input-form"
            >
              <option value="">Pilih supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.kode}>{s.nama} ({s.kode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-form">Barcode Supplier</label>
            <input
              type="text"
              value={form.barcodeSupp}
              onChange={(e) => setForm((f) => ({ ...f, barcodeSupp: e.target.value }))}
              placeholder="Scan / ketik barcode dari supplier"
              className="input-form font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Jenis Kain</label>
              <input
                type="text"
                value={form.jenis}
                onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))}
                placeholder="Contoh: Cotton Combed 30s"
                className="input-form"
              />
            </div>
            <div>
              <label className="label-form">Jumlah Meter</label>
              <input
                type="number"
                value={form.meter}
                onChange={(e) => setForm((f) => ({ ...f, meter: e.target.value }))}
                placeholder="0"
                min={1}
                className="input-form"
              />
            </div>
          </div>

          <div>
            <label className="label-form">Kondisi</label>
            <select
              value={form.kondisi}
              onChange={(e) => setForm((f) => ({ ...f, kondisi: e.target.value }))}
              className="input-form"
            >
              <option value="Baik">Baik</option>
              <option value="Cukup">Cukup</option>
            </select>
          </div>

          <div>
            <label className="label-form">Catatan (opsional)</label>
            <textarea
              value={form.catatan}
              onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
              placeholder="Catatan tambahan..."
              rows={2}
              className="input-form resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Detail */}
      <Modal
        open={modalDetail.open}
        onClose={modalDetail.onClose}
        title="Detail Roll Kain"
        size="sm"
        footer={<Button variant="secondary" onClick={modalDetail.onClose}>Tutup</Button>}
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex justify-center mb-3"
              dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(selected.barcode, 180, 32) }} />
            {[
              ['Barcode Internal', selected.barcode],
              ['Barcode Supplier', selected.barcodeSupp || '—'],
              ['Jenis', selected.jenis],
              ['Supplier', selected.supplier],
              ['Meter', `${selected.meter} m`],
              ['Kondisi', selected.kondisi],
              ['Tanggal Masuk', formatDate(selected.tgl)],
              ['Status', selected.status],
              ['SP', selected.spNo || '—'],
              ['Catatan', selected.catatan || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[12.5px]">
                <span className="text-gray-400">{k}</span>
                <span className="font-600 text-gray-800 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal Kembali dari Vendor */}
      <Modal
        open={modalKembali.open}
        onClose={modalKembali.onClose}
        title="Proses Roll Kembali dari Vendor"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={modalKembali.onClose}>Batal</Button>
            <Button onClick={handleKembali}>Simpan</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="px-3 py-2.5 bg-gray-50 rounded-lg text-[12px] text-gray-600">
              Roll: <span className="font-mono font-700">{selected.barcode}</span>
            </div>
            <div>
              <label className="label-form">Meter Sisa</label>
              <input
                type="number"
                value={formKembali.meter}
                onChange={(e) => setFormKembali((f) => ({ ...f, meter: e.target.value }))}
                placeholder="0"
                min={0}
                className="input-form"
              />
            </div>
            <div>
              <label className="label-form">Kondisi Roll</label>
              <select
                value={formKembali.kondisi}
                onChange={(e) => setFormKembali((f) => ({ ...f, kondisi: e.target.value }))}
                className="input-form"
              >
                <option value="Baik">Baik — kembali ke gudang</option>
                <option value="Rusak">Rusak — masuk gudang retur</option>
              </select>
            </div>
            <div>
              <label className="label-form">Catatan</label>
              <textarea
                value={formKembali.catatan}
                onChange={(e) => setFormKembali((f) => ({ ...f, catatan: e.target.value }))}
                rows={2}
                className="input-form resize-none"
                placeholder="Opsional..."
              />
            </div>
            {formKembali.kondisi === 'Rusak' && (
              <p className="text-[11px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                ⚠️ Roll akan masuk Gudang Retur dan siap diretur ke supplier.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Label */}
      <Modal
        open={modalLabel.open}
        onClose={modalLabel.onClose}
        title="Preview Label Bahan Baku"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={modalLabel.onClose}>Tutup</Button>
            <Button onClick={printLabel}>🖨️ Print Label</Button>
          </>
        }
      >
        <div className="flex justify-center p-4">
          <div dangerouslySetInnerHTML={{ __html: labelHtml }} />
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          Ukuran: {labelBB?.lebar || 58}×{labelBB?.tinggi || 40}mm
        </p>
      </Modal>
    </div>
  );
}
