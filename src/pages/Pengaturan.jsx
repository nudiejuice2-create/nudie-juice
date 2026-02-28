// src/pages/Pengaturan.jsx
import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { formatDate } from '../utils/formatters';
import { generateLabelJadi, generateLabelBB } from '../utils/barcode';

const TABS = [
  { key: 'profil',  label: '🏢 Profil Usaha' },
  { key: 'labelJ',  label: '🏷️ Label Barang Jadi' },
  { key: 'labelBB', label: '🧵 Label Bahan Baku' },
  { key: 'audit',   label: '📋 Audit Trail' },
];

export default function Pengaturan() {
  const toast       = useToast();
  const currentUser = useStore((s) => s.currentUser);
  const profile     = useStore((s) => s.profile);
  const labelJadi   = useStore((s) => s.labelJadi);
  const labelBB     = useStore((s) => s.labelBB);
  const auditTrail  = useStore((s) => s.auditTrail);
  const updateProfile   = useStore((s) => s.updateProfile);
  const updateLabelJadi = useStore((s) => s.updateLabelJadi);
  const updateLabelBB   = useStore((s) => s.updateLabelBB);
  const resetAllData    = useStore((s) => s.resetAllData);

  const isSA  = currentUser?.role === 'superadmin';
  const [tab, setTab] = useState('profil');

  // ── PROFIL ──
  const [profil, setProfil] = useState({ ...profile });
  const logoRef = useRef();

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfil((p) => ({ ...p, logo: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function handleSimpanProfil() {
    updateProfile(profil);
    toast('Profil usaha disimpan ✅', 'green');
  }

  // ── LABEL JADI ──
  const [lj, setLj] = useState({ ...labelJadi });

  const previewLabelJadi = generateLabelJadi({
    produk: { nama: 'Kemeja Pria Pendek', warna: 'Hitam', ukuran: 'M', sku: 'KP-BLK-M' },
    spNo: 'SP-VN01-260226-01',
    cfg: lj,
    brandName: profil.name || 'NUDIE JUICE',
  });

  function handleSimpanLJ() {
    updateLabelJadi(lj);
    toast('Konfigurasi label barang jadi disimpan ✅', 'green');
  }

  // ── LABEL BB ──
  const [lbb, setLbb] = useState({ ...labelBB });

  const previewLabelBB = generateLabelBB({
    roll: { barcode: 'BB-TM-2602-001', jenis: 'Cotton Combed 30s', supplier: 'PT Tekstil Maju', meter: 50 },
    cfg: lbb,
    brandName: profil.name || 'NUDIE JUICE',
  });

  function handleSimpanLBB() {
    updateLabelBB(lbb);
    toast('Konfigurasi label bahan baku disimpan ✅', 'green');
  }

  // ── DANGER ZONE ──
  function handleReset() {
    const conf1 = window.confirm('⚠️ BAHAYA! Semua data akan dihapus permanen. Lanjutkan?');
    if (!conf1) return;
    const conf2 = window.prompt('Ketik "RESET SEMUA DATA" untuk konfirmasi:');
    if (conf2 !== 'RESET SEMUA DATA') return toast('Reset dibatalkan', 'gray');
    resetAllData();
    toast('Semua data telah direset 🔴', 'red');
  }

  // Toggle helper
  const Toggle = ({ val, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[12.5px] text-gray-700">{label}</span>
      <div
        onClick={() => onChange(!val)}
        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${val ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );

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

      {/* ══ PROFIL ══ */}
      {tab === 'profil' && (
        <div className="max-w-lg space-y-4 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => logoRef.current?.click()}
            >
              {profil.logo
                ? <img src={profil.logo} alt="logo" className="w-full h-full object-contain" />
                : <span className="text-3xl">👕</span>
              }
            </div>
            <div>
              <button onClick={() => logoRef.current?.click()}
                className="text-[12px] font-600 text-blue-600 hover:text-blue-700">
                Upload Logo
              </button>
              {profil.logo && (
                <button onClick={() => setProfil((p) => ({ ...p, logo: '' }))}
                  className="ml-3 text-[12px] text-red-400 hover:text-red-500">Hapus</button>
              )}
              <p className="text-[11px] text-gray-400 mt-1">PNG/JPG, tampil di dokumen print</p>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {[
            ['Nama Usaha', 'name', 'NUDIE JUICE'],
            ['Tagline / Sub', 'sub', 'Sistem Manajemen Konveksi'],
            ['Alamat', 'alamat', 'Jl. Contoh No. 1'],
            ['Telepon', 'telp', '08xx-xxxx-xxxx'],
            ['Email', 'email', 'info@nudiejuice.com'],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className="label-form">{label}</label>
              <input type="text" value={profil[key] || ''} placeholder={placeholder}
                onChange={(e) => setProfil((p) => ({ ...p, [key]: e.target.value }))}
                className="input-form" />
            </div>
          ))}

          <Button onClick={handleSimpanProfil} className="w-full justify-center">Simpan Profil</Button>

          {/* Danger Zone */}
          {isSA && (
            <div className="mt-6 pt-5 border-t-2 border-dashed border-red-200">
              <p className="text-[11px] font-700 text-red-400 uppercase tracking-wide mb-2">⚠️ Danger Zone</p>
              <p className="text-[12px] text-gray-500 mb-3">
                Reset akan menghapus SEMUA data secara permanen. Tidak bisa dikembalikan.
              </p>
              <Button variant="danger" onClick={handleReset}>🔴 Reset Semua Data</Button>
            </div>
          )}
        </div>
      )}

      {/* ══ LABEL JADI ══ */}
      {tab === 'labelJ' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">Konfigurasi Label Barang Jadi</p>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label-form">Lebar (mm)</label>
                <input type="number" value={lj.lebar || 58} onChange={(e) => setLj((l) => ({ ...l, lebar: Number(e.target.value) }))} className="input-form" /></div>
              <div><label className="label-form">Tinggi (mm)</label>
                <input type="number" value={lj.tinggi || 40} onChange={(e) => setLj((l) => ({ ...l, tinggi: Number(e.target.value) }))} className="input-form" /></div>
            </div>

            <div className="space-y-2.5">
              <p className="label-form">Tampilkan Konten</p>
              {[
                ['showBrand',  'Nama Brand'],
                ['showProduk', 'Nama Produk'],
                ['showWarna',  'Warna'],
                ['showUkuran', 'Ukuran'],
                ['showBatch',  'Kode Batch / SP'],
                ['showBarcode','Barcode'],
              ].map(([key, label]) => (
                <Toggle key={key} val={lj[key] !== false} label={label}
                  onChange={(v) => setLj((l) => ({ ...l, [key]: v }))} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[['fontBrand', 'Font Brand'], ['fontProduk', 'Font Produk'], ['fontDetail', 'Font Detail']].map(([key, label]) => (
                <div key={key}>
                  <label className="label-form">{label} (px)</label>
                  <input type="number" value={lj[key] || 10} min={6} max={20}
                    onChange={(e) => setLj((l) => ({ ...l, [key]: Number(e.target.value) }))} className="input-form text-center" />
                </div>
              ))}
            </div>

            <Button onClick={handleSimpanLJ} className="w-full justify-center">Simpan Konfigurasi</Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-4">Preview Label</p>
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
              <div dangerouslySetInnerHTML={{ __html: previewLabelJadi }} />
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3">
              {lj.lebar || 58}×{lj.tinggi || 40}mm · Thermal Printer
            </p>
          </div>
        </div>
      )}

      {/* ══ LABEL BB ══ */}
      {tab === 'labelBB' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">Konfigurasi Label Bahan Baku</p>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label-form">Lebar (mm)</label>
                <input type="number" value={lbb.lebar || 58} onChange={(e) => setLbb((l) => ({ ...l, lebar: Number(e.target.value) }))} className="input-form" /></div>
              <div><label className="label-form">Tinggi (mm)</label>
                <input type="number" value={lbb.tinggi || 40} onChange={(e) => setLbb((l) => ({ ...l, tinggi: Number(e.target.value) }))} className="input-form" /></div>
            </div>

            <div className="space-y-2.5">
              <p className="label-form">Tampilkan Konten</p>
              {[
                ['showBrand',  'Nama Brand'],
                ['showJenis',  'Jenis Kain'],
                ['showSupp',   'Nama Supplier'],
                ['showMeter',  'Jumlah Meter'],
                ['showBarcode','Barcode'],
              ].map(([key, label]) => (
                <Toggle key={key} val={lbb[key] !== false} label={label}
                  onChange={(v) => setLbb((l) => ({ ...l, [key]: v }))} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[['fontBrand', 'Font Brand'], ['fontDetail', 'Font Detail']].map(([key, label]) => (
                <div key={key}>
                  <label className="label-form">{label} (px)</label>
                  <input type="number" value={lbb[key] || 10} min={6} max={20}
                    onChange={(e) => setLbb((l) => ({ ...l, [key]: Number(e.target.value) }))} className="input-form text-center" />
                </div>
              ))}
            </div>

            <Button onClick={handleSimpanLBB} className="w-full justify-center">Simpan Konfigurasi</Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide mb-4">Preview Label</p>
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
              <div dangerouslySetInnerHTML={{ __html: previewLabelBB }} />
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3">
              {lbb.lebar || 58}×{lbb.tinggi || 40}mm · Thermal Printer
            </p>
          </div>
        </div>
      )}

      {/* ══ AUDIT TRAIL ══ */}
      {tab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-wide">
              Audit Trail — {auditTrail.length} log
            </p>
            <p className="text-[11px] text-gray-400">Max 500 entri (FIFO)</p>
          </div>
          {auditTrail.length === 0 ? (
            <div className="py-16 text-center text-[12px] text-gray-300">
              <p className="text-3xl mb-2">📋</p>
              Belum ada aktivitas
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    {['Aksi', 'Detail', 'Tanggal', 'Waktu', 'User'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-700 text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-600 text-[12.5px] text-gray-800">{a.action}</td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-500 max-w-xs truncate">{a.detail}</td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-400">{formatDate(a.tgl)}</td>
                      <td className="px-4 py-2.5 font-mono text-[11.5px] text-gray-400">{a.waktu}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-600">
                          {a.user}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
