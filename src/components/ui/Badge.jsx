// src/components/ui/Badge.jsx
import React from 'react';

const variants = {
  green:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  blue:    'bg-blue-50 text-blue-700 border border-blue-200',
  yellow:  'bg-amber-50 text-amber-700 border border-amber-200',
  red:     'bg-red-50 text-red-700 border border-red-200',
  gray:    'bg-gray-100 text-gray-600 border border-gray-200',
  purple:  'bg-violet-50 text-violet-700 border border-violet-200',
  shopee:  'bg-red-50 text-red-700 border border-red-200',
  tiktok:  'bg-sky-50 text-sky-700 border border-sky-200',
  offline: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

// Map status ke warna badge
const statusMap = {
  // Roll & Produk
  'Tersedia':              'green',
  'Aktif':                 'green',
  'Selesai':               'green',
  'Selesai QC':            'green',
  'Pengganti Diterima':    'green',
  'Masuk Gudang':          'green',
  'Uang Dikembalikan':     'green',
  'Selesai Ditukar':       'green',
  'Sudah Dikirim':         'green',
  // SP & Proses
  'Dikirim':               'blue',
  'Terpakai SP':           'blue',
  'Di Vendor':             'blue',
  // Warning
  'Menunggu QC':           'yellow',
  'Sebagian':              'yellow',
  'Menunggu':              'yellow',
  'Kembali dari Vendor':   'yellow',
  'Menunggu Pengecekan':   'yellow',
  'Menunggu Kirim':        'yellow',
  'Menipis':               'yellow',
  // Netral
  'Draft':                 'gray',
  'Habis':                 'gray',
  'Dimusnahkan':           'gray',
  // Danger
  'Di Gudang Retur':       'red',
  'Gagal':                 'red',
  'Rusak':                 'red',
  'Kerugian':              'red',
};

export function getStatusColor(status) {
  return statusMap[status] || 'gray';
}

export default function Badge({ children, variant, status, className = '' }) {
  // Kalau ada prop status, pakai mapping otomatis
  const color = status ? getStatusColor(status) : (variant || 'gray');
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        text-[10.5px] font-semibold whitespace-nowrap
        ${variants[color] || variants.gray}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Shortcut untuk status badge
export function StatusBadge({ status }) {
  return <Badge status={status}>{status}</Badge>;
}

// Channel badge
export function ChannelBadge({ channel }) {
  const map = { Shopee: 'shopee', TikTok: 'tiktok', Offline: 'offline' };
  return <Badge variant={map[channel] || 'gray'}>{channel}</Badge>;
}

// SP status badge dengan icon
export function SPBadge({ status }) {
  const icons = {
    Draft: '📝',
    Dikirim: '📤',
    Sebagian: '📦',
    Selesai: '✅',
  };
  return (
    <Badge status={status}>
      {icons[status] && <span>{icons[status]}</span>}
      {status}
    </Badge>
  );
}
