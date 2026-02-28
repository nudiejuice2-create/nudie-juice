import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const todayISO = () => new Date().toISOString().split('T')[0];
const timeNow = () => new Date().toTimeString().split(' ')[0].substring(0, 5);

const defaultWarnaList = [
  { kode: 'BLK', nama: 'Hitam' }, { kode: 'WHT', nama: 'Putih' },
  { kode: 'RED', nama: 'Merah' }, { kode: 'NVY', nama: 'Navy' },
  { kode: 'BLU', nama: 'Biru' },  { kode: 'GRN', nama: 'Hijau' },
  { kode: 'YLW', nama: 'Kuning' },{ kode: 'GRY', nama: 'Abu-abu' },
  { kode: 'BRN', nama: 'Coklat' },{ kode: 'ORG', nama: 'Orange' },
  { kode: 'PNK', nama: 'Pink' },  { kode: 'PRP', nama: 'Ungu' }
];

const defaultUsers = [
  { id: uid(), username: 'superadmin123', password: 'superadmin123', role: 'superadmin', active: true },
  { id: uid(), username: 'admin123',      password: 'admin123',      role: 'admin',      active: true }
];

const useStore = create(
  persist(
    (set, get) => ({
      currentUser: null,
      profile: { name: 'NUDIE JUICE', sub: 'Konveksi Berkualitas', alamat: '', telp: '', email: '', logo: null },
      labelJadi: { lebar: 58, tinggi: 40, showBrand: true, showProduk: true, showWarna: true, showUkuran: true, showBatch: true, showBarcode: true, fontBrand: 14, fontProduk: 12, fontDetail: 10 },
      labelBB:   { lebar: 58, tinggi: 40, showBrand: true, showJenis: true, showSupp: true, showMeter: true, showBarcode: true, fontBrand: 14, fontDetail: 10 },
      users: defaultUsers,
      suppliers: [], vendors: [], kategori: [], warnaList: defaultWarnaList,
      produk: [], gudangBB: [], stokBatch: [],
      returSupplier: [], returVendor: [],
      suratPesanan: [], penerimaan: [], orderPenjualan: [], returCustomer: [],
      auditTrail: [],

      addAudit: (action, detail) => {
        const { currentUser, auditTrail } = get();
        const entry = { id: uid(), action, detail, tgl: todayISO(), waktu: timeNow(), user: currentUser?.username || 'System' };
        let trail = [entry, ...auditTrail];
        if (trail.length > 500) trail = trail.slice(0, 500);
        set({ auditTrail: trail });
      },

      // AUTH
      login: (username, password) => {
        const user = get().users.find(u => u.username === username && u.password === password && u.active !== false);
        if (user) { set({ currentUser: user }); get().addAudit('Login', `${username} login`); return true; }
        return false;
      },
      logout: () => { get().addAudit('Logout', `${get().currentUser?.username} logout`); set({ currentUser: null }); },

      // PROFILE
      updateProfile:   (d) => { set({ profile: { ...get().profile, ...d } }); get().addAudit('Update Profile', 'Profil diperbarui'); },
      updateLabelJadi: (d) => { set({ labelJadi: { ...get().labelJadi, ...d } }); },
      updateLabelBB:   (d) => { set({ labelBB: { ...get().labelBB, ...d } }); },

      // USERS
      tambahUser:      (d) => { set({ users: [...get().users, { ...d, id: uid() }] }); get().addAudit('Tambah User', d.username); },
      updateUser:      (id, d) => { set({ users: get().users.map(u => u.id === id ? { ...u, ...d } : u) }); },
      hapusUser:       (id) => { set({ users: get().users.filter(u => u.id !== id) }); },
      toggleUserActive:(id) => { set({ users: get().users.map(u => u.id === id ? { ...u, active: !u.active } : u) }); },

      // SUPPLIER
      tambahSupplier:  (d) => { set({ suppliers: [...get().suppliers, { ...d, id: uid() }] }); get().addAudit('Tambah Supplier', d.nama); },
      updateSupplier:  (id, d) => { set({ suppliers: get().suppliers.map(s => s.id === id ? { ...s, ...d } : s) }); },
      hapusSupplier:   (id) => { set({ suppliers: get().suppliers.filter(s => s.id !== id) }); },

      // VENDOR
      tambahVendor:    (d) => { set({ vendors: [...get().vendors, { ...d, id: uid() }] }); get().addAudit('Tambah Vendor', d.nama); },
      updateVendor:    (id, d) => { set({ vendors: get().vendors.map(v => v.id === id ? { ...v, ...d } : v) }); },
      hapusVendor:     (id) => { set({ vendors: get().vendors.filter(v => v.id !== id) }); },

      // KATEGORI
      tambahKategori:  (d) => { set({ kategori: [...get().kategori, { ...d, id: uid() }] }); },
      updateKategori:  (id, d) => { set({ kategori: get().kategori.map(k => k.id === id ? { ...k, ...d } : k) }); },
      hapusKategori:   (id) => { set({ kategori: get().kategori.filter(k => k.id !== id) }); },

      // WARNA
      tambahWarna:     (d) => { set({ warnaList: [...get().warnaList, d] }); },
      updateWarna:     (kode, d) => { set({ warnaList: get().warnaList.map(w => w.kode === kode ? { ...w, ...d } : w) }); },
      hapusWarna:      (kode) => { set({ warnaList: get().warnaList.filter(w => w.kode !== kode) }); },

      // PRODUK
      tambahProduk:    (d) => { set({ produk: [...get().produk, { ...d, id: uid() }] }); get().addAudit('Tambah Produk', d.sku); },
      updateProduk:    (id, d) => { set({ produk: get().produk.map(p => p.id === id ? { ...p, ...d } : p) }); },
      hapusProduk:     (id) => { set({ produk: get().produk.filter(p => p.id !== id) }); },

      // GUDANG BB
      tambahRoll: (d) => { set({ gudangBB: [...get().gudangBB, { ...d, id: uid() }] }); get().addAudit('Tambah Roll', d.barcode); },
      hapusRoll:  (id) => { set({ gudangBB: get().gudangBB.filter(r => r.id !== id) }); },
      kembalikanRoll: (id, { meterSisa, kondisi, catatan }) => {
        const roll = get().gudangBB.find(r => r.id === id);
        if (!roll) return;
        if (kondisi === 'Baik') {
          set({ gudangBB: get().gudangBB.map(r => r.id === id ? { ...r, status: 'Tersedia', meter: meterSisa, kondisi: 'Baik', catatan, spNo: '' } : r) });
        } else {
          set({ gudangBB: get().gudangBB.map(r => r.id === id ? { ...r, status: 'Di Gudang Retur', meter: meterSisa, kondisi: 'Rusak', catatan } : r) });
          set({ returSupplier: [...get().returSupplier, { id: uid(), barcode: roll.barcode, jenis: roll.jenis, supplier: roll.supplier, meter: meterSisa, kondisi: 'Rusak', alasan: catatan || 'Rusak dari vendor', tgl: todayISO(), status: 'Menunggu Kirim', sumber: 'Otomatis dari Vendor' }] });
        }
        get().addAudit('Kembalikan Roll', `${roll.barcode} kembali - ${kondisi}`);
      },
      returRollManual: (id) => {
        const roll = get().gudangBB.find(r => r.id === id);
        if (!roll) return;
        set({ gudangBB: get().gudangBB.map(r => r.id === id ? { ...r, status: 'Di Gudang Retur' } : r) });
        set({ returSupplier: [...get().returSupplier, { id: uid(), barcode: roll.barcode, jenis: roll.jenis, supplier: roll.supplier, meter: roll.meter, kondisi: roll.kondisi, alasan: 'Retur manual', tgl: todayISO(), status: 'Menunggu Kirim', sumber: 'Manual' }] });
      },

      // RETUR SUPPLIER
      kirimReturSupplier:   (id) => { set({ returSupplier: get().returSupplier.map(r => r.id === id ? { ...r, status: 'Sudah Dikirim' } : r) }); },
      terimaGantiSupplier:  (id) => { set({ returSupplier: get().returSupplier.map(r => r.id === id ? { ...r, status: 'Pengganti Diterima' } : r) }); },
      kerugianSupplier:     (id) => { set({ returSupplier: get().returSupplier.map(r => r.id === id ? { ...r, status: 'Kerugian' } : r) }); },

      // RETUR VENDOR
      kirimReturVendor: (id) => { set({ returVendor: get().returVendor.map(r => r.id === id ? { ...r, status: 'Di Vendor' } : r) }); },
      kembalikanReturVendor: (id, aksi) => {
        const retur = get().returVendor.find(r => r.id === id);
        if (!retur) return;
        if (aksi === 'Masuk Gudang') {
          set({ stokBatch: [...get().stokBatch, { id: uid(), sku: retur.sku, produk: retur.produk, warna: retur.warna, ukuran: retur.ukuran, spNo: retur.spNo, vendor: retur.vendor, masuk: retur.qty, sisa: retur.qty, tgl: todayISO(), pnrNo: `RTV-${id}` }] });
        }
        set({ returVendor: get().returVendor.map(r => r.id === id ? { ...r, status: aksi === 'Masuk Gudang' ? 'Masuk Gudang' : 'Uang Dikembalikan' } : r) });
        get().addAudit('Retur Vendor', `${retur.sku} - ${aksi}`);
      },

      // SURAT PESANAN
      tambahSP: (d) => { set({ suratPesanan: [...get().suratPesanan, { ...d, id: d.id || uid() }] }); get().addAudit('Tambah SP', d.no); },
      updateSP: (id, d) => {
        const sp = get().suratPesanan.find(s => s.id === id);
        if (sp?.status === 'Draft' && sp.rollIds?.length > 0) {
          set({ gudangBB: get().gudangBB.map(r => sp.rollIds.includes(r.id) ? { ...r, status: 'Tersedia', spNo: '' } : r) });
        }
        set({ suratPesanan: get().suratPesanan.map(s => s.id === id ? { ...s, ...d } : s) });
        get().addAudit('Update SP', sp?.no);
      },
      kirimSP: (spId, rollIds, spNo) => {
        set({ gudangBB: get().gudangBB.map(r => rollIds.includes(r.id) ? { ...r, status: 'Terpakai SP', spNo } : r) });
        set({ suratPesanan: get().suratPesanan.map(s => s.id === spId ? { ...s, status: 'Dikirim', rollIds } : s) });
        get().addAudit('Kirim SP', `${spNo} dikirim ke vendor`);
      },
      hapusSP: (id) => {
        const sp = get().suratPesanan.find(s => s.id === id);
        if (sp?.rollIds?.length > 0) {
          set({ gudangBB: get().gudangBB.map(r => sp.rollIds.includes(r.id) ? { ...r, status: 'Tersedia', spNo: '' } : r) });
        }
        set({ suratPesanan: get().suratPesanan.filter(s => s.id !== id) });
        get().addAudit('Hapus SP', sp?.no);
      },

      // PENERIMAAN
      tambahPenerimaan: (d) => {
        set({ penerimaan: [...get().penerimaan, { ...d, id: d.id || uid() }] });
        const sp = get().suratPesanan.find(s => s.no === d.spNo);
        if (sp) {
          const diterima = (sp.diterima || 0) + d.totalDikirim;
          set({ suratPesanan: get().suratPesanan.map(s => s.no === d.spNo ? { ...s, diterima, status: diterima >= s.targetTotal ? 'Sebagian' : 'Dikirim' } : s) });
        }
        get().addAudit('Penerimaan', `${d.no} - ${d.totalDikirim} pcs`);
      },
      simpanQC: (pnrId, qcItems) => {
        const pnr = get().penerimaan.find(p => p.id === pnrId);
        if (!pnr) return;
        let totalLolos = 0, totalGagal = 0;
        qcItems.forEach(item => {
          totalLolos += item.lolos;
          totalGagal += item.gagal;
          if (item.lolos > 0) {
            set({ stokBatch: [...get().stokBatch, { id: uid(), sku: item.sku, produk: item.produk, warna: item.warna, ukuran: item.ukuran, spNo: pnr.spNo, vendor: pnr.vendor, masuk: item.lolos, sisa: item.lolos, tgl: todayISO(), pnrNo: pnr.no }] });
          }
          if (item.gagal > 0) {
            set({ returVendor: [...get().returVendor, { id: uid(), produk: item.produk, sku: item.sku, warna: item.warna, ukuran: item.ukuran, vendor: pnr.vendor, spNo: pnr.spNo, qty: item.gagal, alasan: item.alasan || 'Gagal QC', sumber: 'QC Gagal', tgl: todayISO(), status: 'Menunggu' }] });
          }
        });
        set({ penerimaan: get().penerimaan.map(p => p.id === pnrId ? { ...p, status: 'Selesai QC', totalLolos, totalGagal, items: p.items.map((itm, idx) => ({ ...itm, lolos: qcItems[idx]?.lolos || 0, gagal: qcItems[idx]?.gagal || 0, alasan: qcItems[idx]?.alasan || '' })) } : p) });
        get().addAudit('QC Selesai', `${pnr.no} - Lolos: ${totalLolos}, Gagal: ${totalGagal}`);
      },

      // ORDER PENJUALAN
      tambahOrder: (d) => {
        let batches = [...get().stokBatch];
        d.items.forEach(item => {
          const idx = batches.findIndex(b => b.id === item.batchId);
          if (idx !== -1) batches[idx] = { ...batches[idx], sisa: batches[idx].sisa - item.qty };
        });
        set({ orderPenjualan: [...get().orderPenjualan, { ...d, id: d.id || uid() }], stokBatch: batches });
        get().addAudit('Tambah Order', `${d.no} - ${d.totalPcs} pcs`);
      },
      updateOrder: (id, d) => {
        const old = get().orderPenjualan.find(o => o.id === id);
        if (!old) return;
        let batches = [...get().stokBatch];
        old.items.forEach(item => { const idx = batches.findIndex(b => b.id === item.batchId); if (idx !== -1) batches[idx] = { ...batches[idx], sisa: batches[idx].sisa + item.qty }; });
        d.items.forEach(item => { const idx = batches.findIndex(b => b.id === item.batchId); if (idx !== -1) batches[idx] = { ...batches[idx], sisa: batches[idx].sisa - item.qty }; });
        set({ orderPenjualan: get().orderPenjualan.map(o => o.id === id ? { ...o, ...d } : o), stokBatch: batches });
        get().addAudit('Update Order', old.no);
      },
      selesaikanOrder: (id) => { const o = get().orderPenjualan.find(o => o.id === id); set({ orderPenjualan: get().orderPenjualan.map(o => o.id === id ? { ...o, status: 'Selesai' } : o) }); get().addAudit('Selesai Order', o?.no); },
      batalkanOrder: (id) => {
        const order = get().orderPenjualan.find(o => o.id === id);
        if (!order) return;
        let batches = [...get().stokBatch];
        order.items.forEach(item => { const idx = batches.findIndex(b => b.id === item.batchId); if (idx !== -1) batches[idx] = { ...batches[idx], sisa: batches[idx].sisa + item.qty }; });
        set({ orderPenjualan: get().orderPenjualan.map(o => o.id === id ? { ...o, status: 'Dibatalkan' } : o), stokBatch: batches });
        get().addAudit('Batalkan Order', order.no);
      },
      hapusOrder: (id) => { set({ orderPenjualan: get().orderPenjualan.filter(o => o.id !== id) }); },

      // RETUR CUSTOMER
      tambahReturCustomer: (d) => { set({ returCustomer: [...get().returCustomer, { ...d, id: d.id || uid() }] }); get().addAudit('Retur Customer', `${d.sku} dari ${d.orderNo}`); },
      prosesReturCustomer: (id, aksi, payload) => {
        const retur = get().returCustomer.find(r => r.id === id);
        if (!retur) return;
        if (aksi === 'Dimusnahkan') {
          set({ returCustomer: get().returCustomer.map(r => r.id === id ? { ...r, status: 'Dimusnahkan' } : r) });
        } else if (aksi === 'Selesai Ditukar') {
          let batches = [...get().stokBatch];
          const oldIdx = batches.findIndex(b => b.id === retur.batchId);
          if (oldIdx !== -1) batches[oldIdx] = { ...batches[oldIdx], sisa: batches[oldIdx].sisa + retur.qty };
          const newIdx = batches.findIndex(b => b.id === payload.tukarBatchId);
          if (newIdx !== -1) batches[newIdx] = { ...batches[newIdx], sisa: batches[newIdx].sisa - payload.tukarQty };
          set({ returCustomer: get().returCustomer.map(r => r.id === id ? { ...r, status: 'Selesai Ditukar' } : r), stokBatch: batches });
        } else if (aksi === 'Dikirim ke Vendor') {
          set({ returVendor: [...get().returVendor, { id: uid(), produk: retur.produk, sku: retur.sku, warna: retur.warna, ukuran: retur.ukuran, vendor: retur.vendor, spNo: retur.spNo, qty: retur.qty, alasan: retur.alasan, sumber: 'Retur Customer', tgl: todayISO(), status: 'Menunggu' }] });
          set({ returCustomer: get().returCustomer.map(r => r.id === id ? { ...r, status: 'Dikirim ke Vendor' } : r) });
        }
        get().addAudit('Proses Retur Customer', `${retur.sku} - ${aksi}`);
      },

      // RESET
      resetAllData: () => {
        set({ suppliers: [], vendors: [], kategori: [], produk: [], gudangBB: [], stokBatch: [], returSupplier: [], returVendor: [], suratPesanan: [], penerimaan: [], orderPenjualan: [], returCustomer: [], auditTrail: [] });
        get().addAudit('Reset Data', 'Semua data direset');
      }
    }),
    {
      name: 'nj-v1',
      partialize: (state) => ({
        profile: state.profile, labelJadi: state.labelJadi, labelBB: state.labelBB,
        users: state.users, suppliers: state.suppliers, vendors: state.vendors,
        kategori: state.kategori, warnaList: state.warnaList, produk: state.produk,
        gudangBB: state.gudangBB, stokBatch: state.stokBatch,
        returSupplier: state.returSupplier, returVendor: state.returVendor,
        suratPesanan: state.suratPesanan, penerimaan: state.penerimaan,
        orderPenjualan: state.orderPenjualan, returCustomer: state.returCustomer,
        auditTrail: state.auditTrail, currentUser: state.currentUser
      })
    }
  )
);

export default useStore;

export { useStore };
