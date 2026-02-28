// src/components/ui/Table.jsx
import React from 'react';
import { EmptyState } from './Toast';

/**
 * Reusable Table component
 *
 * @param {string[]} headers - Array label header kolom
 * @param {React.ReactNode} children - tbody rows
 * @param {Object} empty - { icon, title, desc } untuk empty state
 * @param {boolean} loading - tampilkan skeleton loader
 * @param {number} emptyColspan - jumlah kolom untuk empty state
 */
export default function Table({
  headers = [],
  children,
  empty,
  loading = false,
  emptyColspan,
}) {
  const colspan = emptyColspan || headers.length;

  // Cek apakah ada baris (children)
  const hasRows = React.Children.count(children) > 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3.5 py-2.5 text-left text-[10.5px] font-700 text-gray-500 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, ri) => (
              <tr key={ri}>
                {Array.from({ length: colspan }).map((_, ci) => (
                  <td key={ci} className="px-3.5 py-3 border-b border-gray-50">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={colspan}>
                <EmptyState
                  icon={empty?.icon || '📭'}
                  title={empty?.title || 'Belum ada data'}
                  desc={empty?.desc}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Table Row dengan hover effect
 */
export function Tr({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`
        border-b border-gray-50 last:border-0
        transition-colors duration-100
        ${onClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/60'}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

/**
 * Table Cell standar
 */
export function Td({ children, className = '', mono = false }) {
  return (
    <td
      className={`
        px-3.5 py-2.5 text-[12.5px] text-gray-700 align-middle
        ${mono ? 'font-mono text-[11.5px]' : ''}
        ${className}
      `}
    >
      {children}
    </td>
  );
}

/**
 * Action buttons cell (pojok kanan)
 */
export function TdAction({ children }) {
  return (
    <td className="px-3.5 py-2 align-middle no-print">
      <div className="flex items-center gap-1.5 justify-end">{children}</div>
    </td>
  );
}
