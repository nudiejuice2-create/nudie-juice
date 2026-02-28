// src/pages/MasterData.jsx
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { uid } from '../utils/formatters';
import { generateKodeSupplier, generateKodeVendor, generateKodeKategori } from '../utils/generators';

const TABS = [
  { key: 'supplier', label: '🏭 Supplier' },
  { key: 'vendor',   label: '🧵 Vendor' },
  { key: 'kategori', label: '🏷️ Kategori' },
  { key: 'warna',    label: '🎨 Warna' },
];

// ─── SUPPLIER ───────────────────────────────────────────────────────────────
function TabSupplier() {
  const toast     = useToast();
  const suppliers = useStore((s) => s.suppliers);
  const tambahSupplier = useStore((s) => s.tambahSupplier);
  const updateSupplier = useStore((s) => s.updateSupplier);
  const hapusSupplier  = useStore((s) => s.hapusSupplier);

  const modal = useModal();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nama: '', pic: '', telp: '', email: '', jenis: '', alamat: '' });

  function openBuat() {
    setEditId(null);
    setForm({ nama: '', pic: '', telp: '', email: '', jenis: '', alamat: '' });
    modal.onOpen();
  }

  function openEdit(s) {
    setEditId(s.id);
    setForm({ nama: s.nama, pic: s.pic, telp: s.telp, email: s.email, jenis: s.jenis, alamat: s.alamat });
    modal.onOpen();
  }

  function handleSimpan() {
    if (!form.nama.trim()) return toast('Nama supplier wajib diisi!', 'red');
    if (editId) {
      updateSupplier(editId, form);
      toast('Supplier diperbarui ✅', 'green');
    } else {
      const kode = generateKodeSupplier(form.nama, suppliers);
      tambahSupplier({ id: uid(), kode, ...form });
      toast(`Supplier ${kode} ditambah ✅`, 'green');
    }
    modal.onClose();
  }

  function handleHapus(s) {
    if (!window.confirm(`Hapus supplier ${s.nama}?`)) return;
    hapusSupplier(s.id);
    toast('Supplier dihapus', 'red');
  }

  const preview = !editId && form.nama ? generateKodeSupplier(form.nama, suppliers) : '';

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={openBuat}>+ Tambah Supplier</Button>
      </div>
      <Table
        headers={['Kode', 'Nama', 'PIC', 'Telepon', 'Email', 'Jenis Bahan', 'Aksi']}
        empty={{ icon: '🏭', title: 'Belum ada supplier', desc: 'Tambah supplier bahan baku' }}
      >
        {suppliers.map((s) => (
          <Tr key={s.id}>
            <Td mono><span className="font-700">{s.kode}</span></Td>
            <Td><span className="font-600">{s.nama}</span></Td>
            <Td>{s.pic || '—'}</Td>
            <Td>{s.telp || '—'}</Td>
            <Td>{s.email || '—'}</Td>
            <Td>{s.jenis || '—'}</Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openEdit(s)}>Edit</Button>
              <Button size="xs" variant="danger" onClick={() => handleHapus(s)}>Hapus</Button>
            </TdAction>
          </Tr>
        ))}
      </Table>

      <Modal open={modal.open} onClose={modal.onClose}
        title={editId ? 'Edit Supplier' : 'Tambah Supplier'}
        size="md"
        footer={<><Button variant="secondary" onClick={modal.onClose}>Batal</Button><Button onClick={handleSimpan}>Simpan</Button></>}
      >
        <div className="space-y-4">
          {preview && (
            <div className="px-4 py-2.5 bg-blue-50 rounded-xl text-center">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-0.5">Kode Otomatis</p>
              <p className="font-mono font-extrabold text-blue-700 text-lg">{preview}</p>
            </div>
          )}
          <div><label className="label-form">Nama Supplier</label>
            <input type="text" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} className="input-form" placeholder="PT. Tekstil Maju" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-form">PIC</label>
              <input type="text" value={form.pic} onChange={(e) => setForm((f) => ({ ...f, pic: e.target.value }))} className="input-form" placeholder="Nama penanggung jawab" /></div>
            <div><label className="label-form">Telepon</label>
              <input type="text" value={form.telp} onChange={(e) => setForm((f) => ({ ...f, telp: e.target.value }))} className="input-form" placeholder="08xx-xxxx-xxxx" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-form">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-form" placeholder="supplier@email.com" /></div>
            <div><label className="label-form">Jenis Bahan</label>
              <input type="text" value={form.jenis} onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))} className="input-form" placeholder="Cotton, Polyester, dll" /></div>
          </div>
          <div><label className="label-form">Alamat</label>
            <textarea value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} rows={2} className="input-form resize-none" placeholder="Alamat lengkap supplier" /></div>
        </div>
      </Modal>
    </>
  );
}

// ─── VENDOR ─────────────────────────────────────────────────────────────────
function TabVendor() {
  const toast   = useToast();
  const vendors = useStore((s) => s.vendors);
  const tambahVendor = useStore((s) => s.tambahVendor);
  const updateVendor = useStore((s) => s.updateVendor);
  const hapusVendor  = useStore((s) => s.hapusVendor);

  const modal = useModal();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nama: '', pic: '', telp: '', email: '', alamat: '' });

  function openBuat() {
    setEditId(null);
    setForm({ nama: '', pic: '', telp: '', email: '', alamat: '' });
    modal.onOpen();
  }

  function openEdit(v) {
    setEditId(v.id);
    setForm({ nama: v.nama, pic: v.pic, telp: v.telp, email: v.email, alamat: v.alamat });
    modal.onOpen();
  }

  function handleSimpan() {
    if (!form.nama.trim()) return toast('Nama vendor wajib diisi!', 'red');
    if (editId) {
      updateVendor(editId, form);
      toast('Vendor diperbarui ✅', 'green');
    } else {
      const kode = generateKodeVendor(vendors);
      tambahVendor({ id: uid(), kode, ...form });
      toast(`Vendor ${kode} ditambah ✅`, 'green');
    }
    modal.onClose();
  }

  function handleHapus(v) {
    if (!window.confirm(`Hapus vendor ${v.nama}?`)) return;
    hapusVendor(v.id);
    toast('Vendor dihapus', 'red');
  }

  const preview = !editId ? generateKodeVendor(vendors) : '';

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={openBuat}>+ Tambah Vendor</Button>
      </div>
      <Table
        headers={['Kode', 'Nama', 'PIC', 'Telepon', 'Email', 'Aksi']}
        empty={{ icon: '🧵', title: 'Belum ada vendor', desc: 'Tambah vendor / konveksi' }}
      >
        {vendors.map((v) => (
          <Tr key={v.id}>
            <Td mono><span className="font-700">{v.kode}</span></Td>
            <Td><span className="font-600">{v.nama}</span></Td>
            <Td>{v.pic || '—'}</Td>
            <Td>{v.telp || '—'}</Td>
            <Td>{v.email || '—'}</Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openEdit(v)}>Edit</Button>
              <Button size="xs" variant="danger" onClick={() => handleHapus(v)}>Hapus</Button>
            </TdAction>
          </Tr>
        ))}
      </Table>

      <Modal open={modal.open} onClose={modal.onClose}
        title={editId ? 'Edit Vendor' : 'Tambah Vendor'}
        size="md"
        footer={<><Button variant="secondary" onClick={modal.onClose}>Batal</Button><Button onClick={handleSimpan}>Simpan</Button></>}
      >
        <div className="space-y-4">
          {!editId && preview && (
            <div className="px-4 py-2.5 bg-blue-50 rounded-xl text-center">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-0.5">Kode Otomatis</p>
              <p className="font-mono font-extrabold text-blue-700 text-lg">{preview}</p>
            </div>
          )}
          <div><label className="label-form">Nama Vendor / Konveksi</label>
            <input type="text" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} className="input-form" placeholder="CV. Konveksi Jaya" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-form">PIC</label>
              <input type="text" value={form.pic} onChange={(e) => setForm((f) => ({ ...f, pic: e.target.value }))} className="input-form" /></div>
            <div><label className="label-form">Telepon</label>
              <input type="text" value={form.telp} onChange={(e) => setForm((f) => ({ ...f, telp: e.target.value }))} className="input-form" /></div>
          </div>
          <div><label className="label-form">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-form" /></div>
          <div><label className="label-form">Alamat</label>
            <textarea value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} rows={2} className="input-form resize-none" /></div>
        </div>
      </Modal>
    </>
  );
}

// ─── KATEGORI ────────────────────────────────────────────────────────────────
function TabKategori() {
  const toast    = useToast();
  const kategori = useStore((s) => s.kategori);
  const tambahKategori = useStore((s) => s.tambahKategori);
  const updateKategori = useStore((s) => s.updateKategori);
  const hapusKategori  = useStore((s) => s.hapusKategori);

  const modal = useModal();
  const [editId, setEditId] = useState(null);
  const [nama, setNama]     = useState('');

  function openBuat() { setEditId(null); setNama(''); modal.onOpen(); }
  function openEdit(k) { setEditId(k.id); setNama(k.nama); modal.onOpen(); }

  function handleSimpan() {
    if (!nama.trim()) return toast('Nama kategori wajib diisi!', 'red');
    if (editId) {
      updateKategori(editId, { nama: nama.trim() });
      toast('Kategori diperbarui ✅', 'green');
    } else {
      const kode = generateKodeKategori(nama, kategori);
      if (kategori.find((k) => k.kode === kode))
        return toast('Kategori dengan inisial yang sama sudah ada!', 'red');
      tambahKategori({ id: uid(), kode, nama: nama.trim() });
      toast(`Kategori ${kode} ditambah ✅`, 'green');
    }
    modal.onClose();
  }

  const preview = !editId && nama ? generateKodeKategori(nama, kategori) : '';

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={openBuat}>+ Tambah Kategori</Button>
      </div>
      <Table
        headers={['Kode', 'Nama Kategori', 'Aksi']}
        empty={{ icon: '🏷️', title: 'Belum ada kategori', desc: 'Tambah kategori produk' }}
      >
        {kategori.map((k) => (
          <Tr key={k.id}>
            <Td mono><span className="font-700 text-blue-600">{k.kode}</span></Td>
            <Td><span className="font-600">{k.nama}</span></Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openEdit(k)}>Edit</Button>
              <Button size="xs" variant="danger" onClick={() => { if (window.confirm(`Hapus kategori ${k.nama}?`)) { hapusKategori(k.id); toast('Kategori dihapus', 'red'); } }}>Hapus</Button>
            </TdAction>
          </Tr>
        ))}
      </Table>

      <Modal open={modal.open} onClose={modal.onClose}
        title={editId ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
        footer={<><Button variant="secondary" onClick={modal.onClose}>Batal</Button><Button onClick={handleSimpan}>Simpan</Button></>}
      >
        <div className="space-y-4">
          {preview && (
            <div className="px-4 py-2.5 bg-blue-50 rounded-xl text-center">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-0.5">Kode Otomatis</p>
              <p className="font-mono font-extrabold text-blue-700 text-lg">{preview}</p>
            </div>
          )}
          <div><label className="label-form">Nama Kategori</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="input-form"
              placeholder="Contoh: Kemeja Pria" />
            <p className="text-[11px] text-gray-400 mt-1">Kode dibuat dari inisial huruf kapital</p>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── WARNA ──────────────────────────────────────────────────────────────────
function TabWarna() {
  const toast     = useToast();
  const warnaList = useStore((s) => s.warnaList);
  const tambahWarna = useStore((s) => s.tambahWarna);
  const updateWarna = useStore((s) => s.updateWarna);
  const hapusWarna  = useStore((s) => s.hapusWarna);

  const modal = useModal();
  const [editKode, setEditKode] = useState(null);
  const [form, setForm] = useState({ kode: '', nama: '' });

  function openBuat() { setEditKode(null); setForm({ kode: '', nama: '' }); modal.onOpen(); }
  function openEdit(w) { setEditKode(w.kode); setForm({ kode: w.kode, nama: w.nama }); modal.onOpen(); }

  function handleSimpan() {
    if (!form.kode.trim() || !form.nama.trim()) return toast('Kode dan nama wajib diisi!', 'red');
    const kode = form.kode.toUpperCase().trim().slice(0, 3);
    if (editKode) {
      updateWarna(editKode, { kode, nama: form.nama.trim() });
      toast('Warna diperbarui ✅', 'green');
    } else {
      if (warnaList.find((w) => w.kode === kode)) return toast('Kode warna sudah ada!', 'red');
      tambahWarna({ kode, nama: form.nama.trim() });
      toast(`Warna ${kode} ditambah ✅`, 'green');
    }
    modal.onClose();
  }

  const swatchColors = {
    BLK: '#111', WHT: '#fff', RED: '#ef4444', NVY: '#1e3a5f',
    BLU: '#3b82f6', GRN: '#22c55e', YLW: '#eab308', GRY: '#9ca3af',
    BRN: '#92400e', ORG: '#f97316', PNK: '#ec4899', PRP: '#a855f7',
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={openBuat}>+ Tambah Warna</Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {warnaList.map((w) => (
          <div key={w.kode} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div
              className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0"
              style={{ background: swatchColors[w.kode] || '#e5e7eb' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-700 text-gray-800 text-[13px]">{w.nama}</p>
              <p className="font-mono text-[11px] text-blue-500 font-700">{w.kode}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => openEdit(w)} className="text-[10px] text-gray-400 hover:text-blue-500 transition-colors">Edit</button>
              <button onClick={() => {
                if (!window.confirm(`Hapus warna ${w.nama}?`)) return;
                hapusWarna(w.kode);
                toast('Warna dihapus', 'red');
              }} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={modal.onClose}
        title={editKode ? 'Edit Warna' : 'Tambah Warna'}
        size="sm"
        footer={<><Button variant="secondary" onClick={modal.onClose}>Batal</Button><Button onClick={handleSimpan}>Simpan</Button></>}
      >
        <div className="space-y-4">
          <div><label className="label-form">Kode Warna (3 huruf)</label>
            <input type="text" value={form.kode} onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value.toUpperCase().slice(0, 3) }))}
              className="input-form font-mono tracking-widest text-center text-lg" placeholder="BLK" maxLength={3}
              disabled={!!editKode} />
          </div>
          <div><label className="label-form">Nama Warna</label>
            <input type="text" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              className="input-form" placeholder="Hitam" /></div>
        </div>
      </Modal>
    </>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function MasterData() {
  const [tab, setTab] = useState('supplier');

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[12.5px] font-600 transition-all ${
              tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>{t.label}</button>
        ))}
      </div>
      {tab === 'supplier' && <TabSupplier />}
      {tab === 'vendor'   && <TabVendor />}
      {tab === 'kategori' && <TabKategori />}
      {tab === 'warna'    && <TabWarna />}
    </div>
  );
}
