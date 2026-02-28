// src/components/ui/Modal.jsx
import React, { useEffect } from 'react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-3xl',
    '2xl': 'max-w-4xl',
  };

  // Tutup modal dengan ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock scroll saat modal buka
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className={`
          bg-white rounded-2xl shadow-2xl w-full
          max-h-[90vh] flex flex-col
          animate-[modalIn_0.2s_ease]
          ${sizes[size] || sizes.md}
          ${className}
        `}
        style={{ animation: 'modalIn 0.2s ease' }}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 pt-6 pb-0 flex-shrink-0">
            {title && (
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                {title}
              </h2>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs transition-colors ml-auto"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// Hook untuk manage modal state
export function useModal(initial = false) {
  const [open, setOpen] = React.useState(initial);
  return {
    open,
    onOpen:  () => setOpen(true),
    onClose: () => setOpen(false),
    toggle:  () => setOpen((v) => !v),
  };
}
