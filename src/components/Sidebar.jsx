// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToast } from './ui/Toast';

const navItems = [
  {
    section: null,
    items: [
      { to: '/', icon: '📊', label: 'Dashboard', end: true },
    ],
  },
  {
    section: 'Katalog',
    items: [
      { to: '/katalog', icon: '🏷️', label: 'Katalog Produk' },
    ],
  },
  {
    section: 'Gudang',
    items: [
      { to: '/gudang-bb',     icon: '🧵', label: 'Bahan Baku' },
      { to: '/gudang-produk', icon: '📦', label: 'Produk Jadi' },
      { to: '/retur-supplier',icon: '↩️', label: 'Retur Supplier' },
      { to: '/retur-vendor',  icon: '🔄', label: 'Retur Vendor' },
    ],
  },
  {
    section: 'Produksi',
    items: [
      { to: '/sp',          icon: '📋', label: 'Surat Pesanan' },
      { to: '/penerimaan',  icon: '📥', label: 'Penerimaan Barang' },
    ],
  },
  {
    section: 'Penjualan',
    items: [
      { to: '/order',          icon: '🛒', label: 'Order Penjualan' },
      { to: '/retur-customer', icon: '📤', label: 'Retur Customer' },
    ],
  },
  {
    section: 'Analitik',
    items: [
      { to: '/laporan', icon: '📈', label: 'Laporan' },
    ],
  },
  {
    section: 'Sistem',
    items: [
      { to: '/master',     icon: '🗂️', label: 'Master Data' },
      { to: '/pengaturan', icon: '⚙️', label: 'Pengaturan' },
      { to: '/users', icon: '👥', label: 'Manajemen User', superAdminOnly: true },
    ],
  },
];

export default function Sidebar() {
  const currentUser = useStore((s) => s.currentUser);
  const profile     = useStore((s) => s.profile);
  const logout      = useStore((s) => s.logout);
  const navigate    = useNavigate();
  const toast       = useToast();

  const isSA = currentUser?.role === 'superadmin';

  function handleLogout() {
    if (!window.confirm('Yakin ingin logout?')) return;
    logout();
    toast('Sampai jumpa! 👋', 'blue');
    navigate('/login', { replace: true });
  }

  const initials = currentUser?.username?.[0]?.toUpperCase() || 'A';

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col overflow-y-auto z-50"
      style={{
        width: '252px',
        background: '#0A0F1E',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: '#2563EB' }}
        >
          {profile.logo ? (
            <img src={profile.logo} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-lg">👕</span>
          )}
        </div>
        <div>
          <div className="text-[14px] font-extrabold text-white leading-tight tracking-tight">
            {profile.name || 'NUDIE JUICE'}
          </div>
          <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
            {profile.sub || 'Konveksi'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 overflow-y-auto">
        {navItems.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.section && (
              <div className="px-2 pt-3 pb-1 text-[9.5px] font-700 text-white/22 uppercase tracking-widest">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              if (item.superAdminOnly && !isSA) return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5
                    text-[12.5px] font-medium transition-all duration-150
                    relative cursor-pointer
                    ${isActive
                      ? 'bg-blue-600/25 text-white'
                      : 'text-white/50 hover:text-white/85 hover:bg-white/7'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r"
                          style={{ height: '60%', background: '#2563EB' }}
                        />
                      )}
                      <span className="w-4 text-center text-[13px] flex-shrink-0">
                        {item.icon}
                      </span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-700 text-white flex-shrink-0"
            style={{ background: '#2563EB' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-600 text-white/80 truncate">
              {currentUser?.username}
            </div>
            <div className="text-[10px] text-white/30">
              {isSA ? 'Super Admin' : 'Administrator'}
            </div>
          </div>
          <span className="text-[11px] text-white/25">↪</span>
        </button>
      </div>
    </aside>
  );
}
