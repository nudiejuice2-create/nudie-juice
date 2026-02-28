// src/pages/ReturSupplier.jsx
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/Badge';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { StatCard } from '../components/ui/Toast';
import { formatDate } from '../utils/formatters';

export default function ReturSupplier() {
  const toast          = useToast();
  const returSupplier  = useStore((s) => s.returSupplier);
  const kirimReturSupplier    = useStore((s) => s.kirimReturSupplier);
  const terimaGantiSupplier   = useStore((s) => s.terimaGantiSupplier);
  const kerugianSupplier      = useStore((s) => s.kerugianSupplier);

  const [fStatus, setFStatus] = useState('');
  const modalAksi = useModal();
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return returSupplier.filter((r) => !fStatus || r.status === fStatus);
  }, [returSupplier, fStatus]);

  // Stats
  const menunggu  = returSupplier.filter((r) => r.status === 'Menunggu Kirim').length;
  const dikirim   = returSupplier.filter((r) => r.status === 'Sudah Dikirim').length;
  const kerugian  = returSupplier.filter((r) => r.status === 'Kerugian');
  const totMeterRugi = kerugian.reduce((a, b) => a + Number(b.meter || 0), 0);

  function openAksi(r) {
    setSelected(r);
    modalAksi.onOpen();
  }

  function handleKirim() {
    kirimReturSupplier(selected.id);
    toast(`Retur ${selected.barcode} sudah dikirim ke supplier ✅`, 'green');
    modalAksi.onClose();
  }

  function handleTerimaGanti() {
    terimaGantiSupplier(selected.id);
    toast(`Pengganti untuk ${selected.barcode} diterima ✅`, 'green');
    modalAksi.onClose();
  }

  function handleKerugian() {
    if (!window.confirm('Tandai sebagai kerugian? Supplier tidak mengganti roll ini.')) return;
    kerugianSupplier(selected.id);
    toast(`Roll ${selected.barcode} dicatat sebagai kerugian`, 'red');
    modalAksi.onClose();
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Menunggu Kirim"  value={menunggu}       sub="siap diretur"         color="yellow" icon="📦" />
        <StatCard label="Sudah Dikirim"   value={dikirim}        sub="menunggu respons"      color="blue"   icon="📤" />
        <StatCard label="Total Kerugian"  value={kerugian.length} sub="tidak diganti"        color="red"    icon="⚠️" />
        <StatCard label="Meter Kerugian"  value={`${totMeterRugi}m`} sub="total meter hilang" color="red"  icon="📏" />
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="text-[12.5px] px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="">Semua Status</option>
          <option value="Menunggu Kirim">Menunggu Kirim</option>
          <option value="Sudah Dikirim">Sudah Dikirim</option>
          <option value="Pengganti Diterima">Pengganti Diterima</option>
          <option value="Kerugian">Kerugian</option>
        </select>
      </div>

      {/* Tabel */}
      <Table
        headers={['Barcode Roll', 'Jenis', 'Supplier', 'Meter', 'Kondisi', 'Alasan', 'Sumber', 'Tgl', 'Status', 'Aksi']}
        empty={{ icon: '↩️', title: 'Belum ada retur supplier', desc: 'Retur masuk otomatis dari roll rusak' }}
      >
        {filtered.map((r) => (
          <Tr key={r.id}>
            <Td mono><span className="font-700">{r.barcode}</span></Td>
            <Td>{r.jenis}</Td>
            <Td>{r.supplier}</Td>
            <Td>{r.meter}m</Td>
            <Td>{r.kondisi}</Td>
            <Td>{r.alasan || '—'}</Td>
            <Td>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-600 ${
                r.sumber === 'Manual' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {r.sumber}
              </span>
            </Td>
            <Td>{formatDate(r.tgl)}</Td>
            <Td><StatusBadge status={r.status} /></Td>
            <TdAction>
              {(r.status === 'Menunggu Kirim' || r.status === 'Sudah Dikirim') && (
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
        title="Proses Retur Supplier"
        size="sm"
        footer={<Button variant="secondary" onClick={modalAksi.onClose}>Tutup</Button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-gray-50 rounded-xl space-y-1.5 text-[12.5px]">
              {[
                ['Barcode', selected.barcode],
                ['Supplier', selected.supplier],
                ['Jenis', selected.jenis],
                ['Meter', `${selected.meter}m`],
                ['Kondisi', selected.kondisi],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-600 font-mono">{v}</span>
                </div>
              ))}
            </div>

            <p className="text-[12px] font-700 text-gray-600">Pilih Aksi:</p>

            {selected.status === 'Menunggu Kirim' && (
              <Button className="w-full justify-center" variant="primary" onClick={handleKirim}>
                📤 Kirim ke Supplier
              </Button>
            )}

            {selected.status === 'Sudah Dikirim' && (
              <div className="space-y-2">
                <Button className="w-full justify-center" variant="success" onClick={handleTerimaGanti}>
                  ✅ Pengganti Diterima
                </Button>
                <Button className="w-full justify-center" variant="danger" onClick={handleKerugian}>
                  ❌ Tidak Diganti (Kerugian)
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
