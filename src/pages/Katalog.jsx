// src/pages/Katalog.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { EmptyState } from '../components/ui/Toast';
import { generateSKU } from '../utils/generators';

const UKURAN_LIST = ['XS','S','M','L','XL','XXL','XXXL','28','30','32','34','36','38','40','42','44'];

const emptyForm = {
  nama: '', kategoriId: '', kodeWarna: '', ukuran: 'M', minStok: 10,
};

export default function Katalog() {
  const toast    = useToast();
  const produk   = useStore((s) => s.produk);
  const stokBatch = useStore((s) => s.stokBatch);
  const kategori = useStore((s) => s.kategori);
  const warnaList = useStore((s) => s.warnaList);
  const tambahProduk  = useStore((s) => s.tambahProduk);
  const updateProduk  = useStore((s) => s.updateProduk);
  const hapusProduk   = useStore((s) => s.hapusProduk);

  // Filter state — Koreksi #4
  const [fKategori, setFKategori] = useState('');
  const [fNama, setFNama]         = useState('');
  const [fUkuran, setFUkuran]     = useState('');
  const [fStok, setFStok]         = useState('');

  // Modal
  const modal  = useModal();
  const [form, setForm]       = useState(emptyForm);
  const [editId, setEditId]   = useState(null);
  const [preview, setPreview] = useState('');

  // Hitung stok per SKU
  function getStok(sku) {
    return stokBatch
      .filter((b) => b.sku === sku && b.sisa > 0)
      .reduce((a, b) => a + b.sisa, 0);
  }

  function getStatus(sku, minStok) {
    const stok = getStok(sku);
    if (stok === 0) return 'Habis';
    if (stok <= (minStok || 10)) return 'Menipis';
    return 'Tersedia';
  }

  // Filter produk — Koreksi #4
  const filtered = useMemo(() => {
    return produk.filter((p) => {
      if (fKategori && p.kategoriKode !== fKategori) return false;
      if (fNama && !(`${p.sku} ${p.nama}`.toLowerCase().includes(fNama.toLowerCase()))) return false;
      if (fUkuran && p.ukuran !== fUkuran) return false;
      if (fStok) {
        const st = getStatus(p.sku, p.minStok);
        if (st !== fStok) return false;
      }
      return true;
    });
  }, [produk, stokBatch, fKategori, fNama, fUkuran, fStok]);

  // Generate preview SKU saat form berubah
  function updatePreview(f) {
    const kat = kategori.find((k) => k.id === f.kategoriId);
    const warna = warnaList.find((w) => w.kode === f.kodeWarna);
    if (kat && warna) {
      const sku = editId
        ? produk.find((p) => p.id === editId)?.sku
        : generateSKU(kat.kode, warna.kode, produk);
      setPreview(sku || '');
    } else {
      setPreview('');
    }
  }

  function setField(key, val) {
    const next = { ...form, [key]: val };
    setForm(next);
    updatePreview(next);
  }

  function openTambah() {
    setForm(emptyForm);
    setEditId(null);
    setPreview('');
    modal.onOpen();
  }

  function openEdit(p) {
    setForm({
      nama: p.nama,
      kategoriId: kategori.find((k) => k.kode === p.kategoriKode)?.id || '',
      kodeWarna: p.kodeWarna,
      ukuran: p.ukuran,
      minStok: p.minStok,
    });
    setEditId(p.id);
    setPreview(p.sku);
    modal.onOpen();
  }

  function handleSimpan() {
    const kat = kategori.find((k) => k.id === form.kategoriId);
    const warna = warnaList.find((w) => w.kode === form.kodeWarna);

    if (!form.nama.trim()) return toast('Nama produk wajib diisi!', 'red');
    if (!kat) return toast('Pilih kategori!', 'red');
    if (!warna) return toast('Pilih warna!', 'red');
    if (!form.ukuran) return toast('Pilih ukuran!', 'red');

    const sku = editId
      ? produk.find((p) => p.id === editId)?.sku
      : generateSKU(kat.kode, warna.kode, produk);

    const data = {
      sku,
      nama: form.nama.trim(),
      kategoriNama: kat.nama,
      kategoriKode: kat.kode,
      warna: warna.nama,
      kodeWarna: warna.kode,
      ukuran: form.ukuran,
      minStok: Number(form.minStok) || 10,
    };

    if (editId) {
      updateProduk(editId, data);
      toast('Produk berhasil diperbarui ✅', 'green');
    } else {
      tambahProduk(data);
      toast(`SKU ${sku} berhasil ditambah ✅`, 'green');
    }
    modal.onClose();
  }

  function handleHapus(p) {
    if (!window.confirm(`Hapus SKU ${p.sku}? Data tidak bisa dikembalikan.`)) return;
    hapusProduk(p.id);
    toast(`SKU ${p.sku} dihapus`, 'red');
  }

  // Stat summary
  const totalSKU   = produk.length;
  const totalHabis = produk.filter((p) => getStatus(p.sku, p.minStok) === 'Habis').length;
  const totalTipis = produk.filter((p) => getStatus(p.sku, p.minStok) === 'Menipis').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-xl font-extrabold text-gray-900">{totalSKU}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Total SKU</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-xl font-extrabold text-amber-500">{totalTipis}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Menipis</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-xl font-extrabold text-red-500">{totalHabis}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Habis</div>
          </div>
        </div>
        <Button onClick={openTambah}>+ Tambah SKU</Button>
      </div>

      {/* Filter — Koreksi #4: kategori + nama/SKU + ukuran + status stok */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 mb-4 flex gap-2.5 flex-wrap shadow-sm">
        <select
          value={fKategori}
          onChange={(e) => setFKategori(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 min-w-[140px]"
        >
          <option value="">Semua Kategori</option>
          {kategori.map((k) => (
            <option key={k.id} value={k.kode}>{k.nama}</option>
          ))}
        </select>

        <input
          type="text"
          value={fNama}
          onChange={(e) => setFNama(e.target.value)}
          placeholder="Cari nama / SKU..."
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg flex-1 min-w-[160px] outline-none focus:border-blue-400"
        />

        <select
          value={fUkuran}
          onChange={(e) => setFUkuran(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 min-w-[120px]"
        >
          <option value="">Semua Ukuran</option>
          {UKURAN_LIST.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <select
          value={fStok}
          onChange={(e) => setFStok(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 min-w-[130px]"
        >
          <option value="">Semua Status</option>
          <option value="Tersedia">Tersedia</option>
          <option value="Menipis">Menipis</option>
          <option value="Habis">Habis</option>
        </select>

        {(fKategori || fNama || fUkuran || fStok) && (
          <button
            onClick={() => { setFKategori(''); setFNama(''); setFUkuran(''); setFStok(''); }}
            className="text-[12px] font-600 text-blue-600 hover:text-blue-700 px-2"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Tabel */}
      <Table
        headers={['SKU', 'Nama Produk', 'Kategori', 'Warna', 'Ukuran', 'Stok', 'Min Stok', 'Status', 'Aksi']}
        empty={{ icon: '🏷️', title: 'Belum ada produk', desc: 'Tambahkan SKU pertama Anda' }}
      >
        {filtered.map((p) => {
          const stok   = getStok(p.sku);
          const status = getStatus(p.sku, p.minStok);
          return (
            <Tr key={p.id}>
              <Td mono>{p.sku}</Td>
              <Td><span className="font-600 text-gray-800">{p.nama}</span></Td>
              <Td>{p.kategoriNama}</Td>
              <Td>
                <span className="flex items-center gap-1.5">
                  <span className="text-[13px]">🎨</span>
                  {p.warna}
                </span>
              </Td>
              <Td>
                <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-100 text-[11px] font-700 text-gray-600">
                  {p.ukuran}
                </span>
              </Td>
              <Td>
                <span className={`font-700 text-[13px] ${stok === 0 ? 'text-red-500' : stok <= p.minStok ? 'text-amber-500' : 'text-gray-800'}`}>
                  {stok}
                </span>
                <span className="text-[11px] text-gray-400 ml-0.5">pcs</span>
              </Td>
              <Td>{p.minStok} pcs</Td>
              <Td><StatusBadge status={status} /></Td>
              <TdAction>
                <Button size="xs" variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
                <Button size="xs" variant="danger" onClick={() => handleHapus(p)}>Hapus</Button>
              </TdAction>
            </Tr>
          );
        })}
      </Table>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modal.open}
        onClose={modal.onClose}
        title={editId ? 'Edit Produk' : 'Tambah SKU Baru'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={modal.onClose}>Batal</Button>
            <Button onClick={handleSimpan}>{editId ? 'Simpan Perubahan' : 'Tambah SKU'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Preview SKU */}
          {preview && (
            <div className="px-4 py-3 rounded-xl text-center" style={{ background: '#EFF6FF' }}>
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">SKU Produk</p>
              <p className="text-xl font-extrabold text-blue-700 font-mono tracking-widest">{preview}</p>
            </div>
          )}

          <div>
            <label className="label-form">Nama Produk</label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setField('nama', e.target.value)}
              placeholder="Contoh: Kemeja Pria Lengan Pendek"
              className="input-form"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Kategori</label>
              <select
                value={form.kategoriId}
                onChange={(e) => setField('kategoriId', e.target.value)}
                className="input-form"
                disabled={!!editId}
              >
                <option value="">Pilih kategori</option>
                {kategori.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.kode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-form">Warna</label>
              <select
                value={form.kodeWarna}
                onChange={(e) => setField('kodeWarna', e.target.value)}
                className="input-form"
                disabled={!!editId}
              >
                <option value="">Pilih warna</option>
                {warnaList.map((w) => (
                  <option key={w.kode} value={w.kode}>{w.nama} ({w.kode})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Ukuran</label>
              <select
                value={form.ukuran}
                onChange={(e) => setField('ukuran', e.target.value)}
                className="input-form"
                disabled={!!editId}
              >
                {UKURAN_LIST.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-form">Min. Stok Alert</label>
              <input
                type="number"
                value={form.minStok}
                onChange={(e) => setField('minStok', e.target.value)}
                min={1}
                className="input-form"
              />
            </div>
          </div>

          {editId && (
            <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              ⚠️ SKU, kategori, warna, dan ukuran tidak bisa diubah setelah dibuat.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
