// src/utils/barcode.js
// Generate barcode visual untuk label thermal printer NUDIE JUICE

/**
 * Generate barcode SVG sebagai string HTML
 * Menghasilkan barcode Code 128 sederhana (visual only, tidak scannable)
 * Untuk label thermal printer 58x40mm
 *
 * @param {string} code - Kode yang di-encode (SKU atau barcode roll)
 * @param {number} height - Tinggi bar dalam pixel (default: 28)
 * @returns {string} - HTML string berisi div-div barcode
 */
export function generateBarSVG(code = '', height = 28) {
  // Pattern bar berdasarkan karakter kode
  // Simplified visual barcode — representasi visual saja
  const basePattern = [2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3];

  // Generate pattern dari kode string untuk variasi visual
  let pattern = [...basePattern];
  if (code) {
    for (let i = 0; i < code.length && i < 8; i++) {
      const charCode = code.charCodeAt(i) % 3 + 1;
      pattern[i * 2] = charCode;
    }
  }

  return pattern
    .map(
      (w, i) =>
        `<div style="width:${w}px;height:${height}px;background:${
          i % 2 === 0 ? '#111111' : '#ffffff'
        };display:inline-block;"></div>`
    )
    .join('');
}

/**
 * Generate barcode sebagai SVG element string (lebih clean untuk print)
 *
 * @param {string} code - Kode barcode
 * @param {number} width - Lebar total SVG
 * @param {number} height - Tinggi bar
 * @returns {string} - SVG string
 */
export function generateBarcodeSVG(code = '', width = 120, height = 30) {
  const bars = [];
  const baseWidths = [2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3];

  // Modifikasi pattern berdasarkan kode
  let pattern = [...baseWidths];
  if (code) {
    for (let i = 0; i < Math.min(code.length, 8); i++) {
      pattern[i * 2] = (code.charCodeAt(i) % 3) + 1;
    }
  }

  // Hitung total lebar
  const totalWidth = pattern.reduce((a, b) => a + b, 0);
  const scale = width / totalWidth;

  let x = 0;
  pattern.forEach((w, i) => {
    const scaledW = w * scale;
    if (i % 2 === 0) {
      bars.push(
        `<rect x="${x.toFixed(2)}" y="0" width="${scaledW.toFixed(2)}" height="${height}" fill="#111111"/>`
      );
    }
    x += scaledW;
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <rect width="${width}" height="${height}" fill="white"/>
    ${bars.join('\n    ')}
  </svg>`;
}

/**
 * Generate konten label barang jadi untuk thermal printer
 * Sesuai konfigurasi di Pengaturan → Label Barang Jadi
 *
 * @param {Object} params
 * @param {Object} params.produk - Data produk {nama, warna, ukuran, sku}
 * @param {string} params.spNo - Nomor SP (batch)
 * @param {Object} params.cfg - Konfigurasi label dari store
 * @param {string} params.brandName - Nama usaha dari profil
 * @returns {string} - HTML string label
 */
export function generateLabelJadi({ produk, spNo, cfg, brandName }) {
  const w = cfg?.lebar || 58;
  const h = cfg?.tinggi || 40;
  const barcode = generateBarcodeSVG(produk?.sku, 100, 24);

  return `
    <div style="
      width:${w}mm;
      min-height:${h}mm;
      border:1px solid #000;
      padding:3px 4px;
      font-family:'JetBrains Mono', monospace;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1px;
      box-sizing:border-box;
      background:#fff;
    ">
      ${
        cfg?.showBrand !== false
          ? `<div style="font-size:${cfg?.fontBrand || 8}px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${brandName || 'NUDIE JUICE'}</div>`
          : ''
      }
      ${
        cfg?.showProduk !== false
          ? `<div style="font-size:${cfg?.fontProduk || 9}px;font-weight:700;text-align:center;line-height:1.2;">${produk?.nama || ''}</div>`
          : ''
      }
      ${
        cfg?.showWarna !== false || cfg?.showUkuran !== false
          ? `<div style="font-size:${cfg?.fontDetail || 8}px;color:#333;">
              ${cfg?.showWarna !== false ? produk?.warna || '' : ''}
              ${cfg?.showWarna !== false && cfg?.showUkuran !== false ? ' · ' : ''}
              ${cfg?.showUkuran !== false ? `Size ${produk?.ukuran || ''}` : ''}
            </div>`
          : ''
      }
      ${
        cfg?.showBarcode !== false
          ? `<div style="margin:2px 0;">${barcode}</div>`
          : ''
      }
      <div style="font-size:7px;letter-spacing:0.5px;font-weight:600;">${produk?.sku || ''}</div>
      ${
        cfg?.showBatch !== false && spNo
          ? `<div style="font-size:7px;color:#555;">Batch: ${spNo}</div>`
          : ''
      }
    </div>
  `;
}

/**
 * Generate konten label bahan baku untuk thermal printer
 * Sesuai konfigurasi di Pengaturan → Label Bahan Baku
 *
 * @param {Object} params
 * @param {Object} params.roll - Data roll {barcode, jenis, supplier, meter}
 * @param {Object} params.cfg - Konfigurasi label BB dari store
 * @param {string} params.brandName - Nama usaha dari profil
 * @returns {string} - HTML string label
 */
export function generateLabelBB({ roll, cfg, brandName }) {
  const w = cfg?.lebar || 58;
  const h = cfg?.tinggi || 40;
  const barcode = generateBarcodeSVG(roll?.barcode, 100, 24);

  return `
    <div style="
      width:${w}mm;
      min-height:${h}mm;
      border:1px solid #000;
      padding:3px 4px;
      font-family:'JetBrains Mono', monospace;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1px;
      box-sizing:border-box;
      background:#fff;
    ">
      ${
        cfg?.showBrand !== false
          ? `<div style="font-size:${cfg?.fontBrand || 8}px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${brandName || 'NUDIE JUICE'}</div>`
          : ''
      }
      ${
        cfg?.showJenis !== false
          ? `<div style="font-size:${cfg?.fontDetail || 8}px;font-weight:700;">${roll?.jenis || ''}</div>`
          : ''
      }
      ${
        cfg?.showSupp !== false
          ? `<div style="font-size:${cfg?.fontDetail || 8}px;color:#333;">${roll?.supplier || ''}</div>`
          : ''
      }
      ${
        cfg?.showMeter !== false
          ? `<div style="font-size:${cfg?.fontDetail || 8}px;">${roll?.meter || 0}m</div>`
          : ''
      }
      ${
        cfg?.showBarcode !== false
          ? `<div style="margin:2px 0;">${barcode}</div>`
          : ''
      }
      <div style="font-size:7px;letter-spacing:0.5px;">${roll?.barcode || ''}</div>
    </div>
  `;
}

/**
 * Generate grid label untuk print multiple label sekaligus
 *
 * @param {string[]} labels - Array HTML string label
 * @returns {string} - HTML string grid label siap print
 */
export function generateLabelGrid(labels = []) {
  return `
    <div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px;">
      ${labels.join('')}
    </div>
  `;
}
