// src/utils/generators.js
// Fungsi-fungsi generate kode otomatis untuk NUDIE JUICE

import { todayCode, yyMM, uid } from './formatters';

/**
 * Generate SKU produk
 * Format: {KODE_KATEGORI}-{KODE_WARNA}-{URUT}
 * Contoh: KP-BLK-01
 *
 * @param {string} kategoriKode - Kode kategori (contoh: "KP")
 * @param {string} kodeWarna - Kode warna (contoh: "BLK")
 * @param {Array} existingProduk - Array produk yang sudah ada
 */
export function generateSKU(kategoriKode, kodeWarna, existingProduk = []) {
  const existing = existingProduk.filter(
    (p) => p.kategoriKode === kategoriKode && p.kodeWarna === kodeWarna
  );
  const urut = String(existing.length + 1).padStart(2, '0');
  return `${kategoriKode}-${kodeWarna}-${urut}`;
}

/**
 * Generate kode kategori dari nama
 * Format: inisial huruf kapital setiap kata
 * Contoh: "Kemeja Pria" → "KP"
 *
 * @param {string} namaKategori
 */
export function generateKodeKategori(namaKategori) {
  if (!namaKategori) return '';
  return namaKategori
    .split(' ')
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Generate kode supplier
 * Format: SUP-{INISIAL}-{URUT}
 * Contoh: SUP-TM-01
 *
 * @param {string} namaSupplier
 * @param {Array} existingSuppliers
 */
export function generateKodeSupplier(namaSupplier, existingSuppliers = []) {
  const inisial = namaSupplier
    .split(' ')
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 6);
  const urut = String(existingSuppliers.length + 1).padStart(2, '0');
  return `SUP-${inisial}-${urut}`;
}

/**
 * Generate kode vendor
 * Format: VN{URUT}
 * Contoh: VN01
 *
 * @param {Array} existingVendors
 */
export function generateKodeVendor(existingVendors = []) {
  const urut = String(existingVendors.length + 1).padStart(2, '0');
  return `VN${urut}`;
}

/**
 * Generate barcode internal bahan baku
 * Format: BB-{KODE_SUPPLIER}-{YYMM}-{URUT}
 * Contoh: BB-TM-2602-001
 *
 * @param {string} kodeSupplier - Kode supplier (contoh: "SUP-TM-01")
 * @param {Array} existingRolls - Array roll yang sudah ada bulan ini
 */
export function generateBarcodeRoll(kodeSupplier, existingRolls = []) {
  // Ambil bagian tengah kode supplier (contoh: "SUP-TM-01" → "TM")
  const parts = kodeSupplier.split('-');
  const suppKode = parts[1] || kodeSupplier.slice(0, 6);
  const bulan = yyMM();
  const rollBulanIni = existingRolls.filter((r) =>
    r.barcode?.includes(`BB-${suppKode}-${bulan}`)
  );
  const urut = String(rollBulanIni.length + 1).padStart(3, '0');
  return `BB-${suppKode}-${bulan}-${urut}`;
}

/**
 * Generate nomor Surat Pesanan
 * Format: SP-{KODE_VENDOR}-{YYMMDD}-{URUT}
 * Contoh: SP-VN01-260226-01
 *
 * @param {string} vendorKode - Kode vendor (contoh: "VN01")
 * @param {Array} existingSP - Array SP yang sudah ada
 */
export function generateNoSP(vendorKode, existingSP = []) {
  const dc = todayCode();
  const prefix = `SP-${vendorKode}-${dc}`;
  const existing = existingSP.filter((sp) => sp.no?.startsWith(prefix));
  const urut = String(existing.length + 1).padStart(2, '0');
  return `${prefix}-${urut}`;
}

/**
 * Generate nomor Penerimaan Barang
 * Format: PNR-{SP_CODE}-{URUT}
 * Contoh: PNR-VN01-260226-01-01
 *
 * @param {string} spNo - Nomor SP (contoh: "SP-VN01-260226-01")
 * @param {Array} existingPenerimaan - Array penerimaan yang sudah ada
 */
export function generateNoPenerimaan(spNo, existingPenerimaan = []) {
  // Hapus prefix "SP-" dari nomor SP
  const spCode = spNo.replace('SP-', '');
  const existing = existingPenerimaan.filter((p) => p.spNo === spNo);
  const urut = String(existing.length + 1).padStart(2, '0');
  return `PNR-${spCode}-${urut}`;
}

/**
 * Generate nomor Order Penjualan
 * Format: PJ-{KODE_CHANNEL}-{YYMMDD}-{URUT}
 * Contoh: PJ-SHP-260226-001
 *
 * @param {string} channel - Channel penjualan ("Shopee" | "TikTok" | "Offline")
 * @param {Array} existingOrders - Array order yang sudah ada
 */
export function generateNoOrder(channel, existingOrders = []) {
  const chCode = { Shopee: 'SHP', TikTok: 'TTK', Offline: 'OFL' }[channel] || 'OFL';
  const dc = todayCode();
  const prefix = `PJ-${chCode}-${dc}`;
  const existing = existingOrders.filter((o) => o.no?.startsWith(prefix));
  const urut = String(existing.length + 1).padStart(3, '0');
  return `${prefix}-${urut}`;
}

/**
 * Generate display label untuk SKU di dropdown
 * Format: {SKU} — {nama} · {warna} · {ukuran}
 * Contoh: "KP-BLK-S — Kemeja Pria Lengan Pendek · Hitam · S"
 *
 * @param {Object} produk - Object produk dari store
 */
export function generateSKULabel(produk) {
  if (!produk) return '';
  return `${produk.sku} — ${produk.nama} · ${produk.warna} · ${produk.ukuran}`;
}
