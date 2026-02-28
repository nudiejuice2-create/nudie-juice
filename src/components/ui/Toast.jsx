// src/components/ui/Toast.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'green') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const colors = {
    green:  'bg-emerald-500',
    red:    'bg-red-500',
    blue:   'bg-blue-600',
    yellow: 'bg-amber-500 text-gray-900',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9000] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              ${colors[t.type] || colors.green}
              text-white text-[13px] font-semibold
              px-4 py-3 rounded-xl shadow-xl max-w-xs
              animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]
            `}
          >
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}


// ============================================================
// src/components/ui/StatCard.jsx
// ============================================================
export function StatCard({ label, value, sub, color = 'blue', icon }) {
  const accents = {
    blue:   'bg-blue-600',
    green:  'bg-emerald-500',
    yellow: 'bg-amber-500',
    red:    'bg-red-500',
    purple: 'bg-violet-500',
    gray:   'bg-gray-400',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden">
      {/* Accent bar atas */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accents[color] || accents.blue}`} />

      {icon && (
        <div className="absolute right-4 top-4 text-2xl opacity-10">{icon}</div>
      )}

      <p className="text-[11px] font-700 text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1.5 mb-0.5 tracking-tight leading-none">
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}


// ============================================================
// src/components/ui/EmptyState.jsx
// ============================================================
export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="text-4xl mb-3 opacity-60">{icon}</div>
      {title && <p className="text-[14px] font-700 text-gray-500 mb-1">{title}</p>}
      {desc  && <p className="text-[12px] text-gray-400 max-w-xs">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}


// ============================================================
// src/components/ui/ConfirmDialog.jsx
// ============================================================
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Hapus', confirmVariant = 'danger' }) {
  if (!open) return null;

  const btnColors = {
    danger:  'bg-red-500 hover:bg-red-600 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-[modalIn_0.2s_ease]">
        <div className="text-3xl mb-3 text-center">⚠️</div>
        <h3 className="text-base font-extrabold text-gray-900 text-center mb-2">{title}</h3>
        {message && <p className="text-[13px] text-gray-500 text-center mb-5">{message}</p>}
        <div className="flex gap-2 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => { onConfirm?.(); onClose?.(); }}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${btnColors[confirmVariant] || btnColors.danger}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
