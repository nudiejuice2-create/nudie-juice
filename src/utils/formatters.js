// src/utils/formatters.js
// Utility functions untuk formatting data di NUDIE JUICE

/**
 * Mengembalikan tanggal hari ini dalam format ID
 * Contoh: "27 Feb 2026"
 */
export function today() {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Mengembalikan tanggal hari ini dalam format ISO (YYYY-MM-DD)
 * Untuk digunakan di input type="date"
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Mengembalikan kode tanggal YYMMDD
 * Contoh: "260227"
 */
export function todayCode() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Mengembalikan kode YYMM untuk barcode bahan baku
 * Contoh: "2602"
 */
export function yyMM() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

/**
 * Generate unique ID berbasis timestamp + random
 */
export function uid() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

/**
 * Format angka ke format ribuan Indonesia
 * Contoh: 1500 → "1.500"
 */
export function formatNumber(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

/**
 * Format tanggal ISO ke format ID
 * Contoh: "2026-02-27" → "27 Feb 2026"
 */
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Mengembalikan jam sekarang HH:MM
 * Contoh: "20:53"
 */
export function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

/**
 * Truncate teks panjang dengan ellipsis
 * Contoh: truncate("Kemeja Pria Lengan Panjang", 20) → "Kemeja Pria Lengan..."
 */
export function truncate(str, maxLen = 30) {
  if (!str) return '—';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

/**
 * Kapitalisasi huruf pertama setiap kata
 * Contoh: "kemeja pria" → "Kemeja Pria"
 */
export function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Generate inisial dari nama (untuk avatar)
 * Contoh: "nudie juice" → "NJ"
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
}

/**
 * Hitung persentase dengan batas 0-100
 */
export function percent(value, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

/**
 * Cek apakah string kosong atau null
 */
export function isEmpty(val) {
  return val === null || val === undefined || String(val).trim() === '';
}
